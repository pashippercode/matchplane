#!/usr/bin/env bash
# Per-boot runtime initialization for the MatchPlane Cloud Agent environment.
# Starts the Docker daemon, brings up development infrastructure (PostgreSQL/
# TimescaleDB + pgvector, Kafka, Valkey), and applies database migrations.
# Idempotent and safe to re-run: existing containers are reused.
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE=(docker compose --env-file .env -f deploy/compose/compose.yaml)

# 1. Start the Docker daemon if it is not already running (nested VM uses
#    fuse-overlayfs; overlay2 cannot mount on the overlay root filesystem).
if ! sudo docker info >/dev/null 2>&1; then
  sudo mkdir -p /etc/docker
  [ -f /etc/docker/daemon.json ] || echo '{"storage-driver":"fuse-overlayfs"}' | sudo tee /etc/docker/daemon.json >/dev/null
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    sudo docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi
# Allow the agent user to use the Docker socket without sudo for this boot.
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# 2. Bring up development infrastructure only. The full stack's application
#    images (web, auto-agent, builder) are built on demand with `just dev`;
#    the auto-agent depends on the optional subplatforms/auto submodule.
"${COMPOSE[@]}" up -d --build postgres valkey kafka kafka-init

# 3. Wait for PostgreSQL and apply all embedded migrations (idempotent).
set -a
# shellcheck disable=SC1091
source .env
set +a
export PATH="$PWD/target/debug:$PATH"

for _ in $(seq 1 60); do
  docker exec matchplane-postgres-1 pg_isready -U "${MATCHPLANE_POSTGRES_USER:-matchplane}" >/dev/null 2>&1 && break
  sleep 2
done

if command -v matchplane >/dev/null 2>&1; then
  matchplane initialize
else
  cargo run --locked -p xtask -- initialize
fi

echo "start.sh complete: infrastructure is up and migrations are applied"

#!/usr/bin/env bash
# Idempotent repository bootstrap for the MatchPlane Cloud Agent environment.
# Runs after the source is checked out. Prepares JS/TS workspaces and the Rust
# build cache so the workspace is ready to run. No long-running process is
# started here — daemons and infrastructure belong in start.sh.
set -euo pipefail

cd "$(dirname "$0")/.."

# The automotive compatibility adapter is an optional git submodule whose
# upstream may be private/unavailable. Never fail setup when it cannot be cloned.
git submodule update --init --recursive \
  || echo "warning: subplatforms/auto submodule unavailable; continuing without it"

# Development-only environment file (rejected outside development by the app).
if [ ! -f .env ]; then
  cp .env.example .env
fi

# GCC is the default compiler on the trixie base image and is required by
# rdkafka-sys. Set it explicitly so setup also succeeds on Clang-default hosts.
export CC="${CC:-gcc}"
export CXX="${CXX:-g++}"

# Install the JS/TS workspace (web app + integrations packages share one lock).
bun install --frozen-lockfile --cwd web

# Warm the Rust build cache and produce the matchplane CLI + service binaries.
cargo build --workspace --locked

echo "install.sh complete"

# Cloud Agent development image for MatchPlane.
#
# Base on the same pinned Rust toolchain the release builder uses. The Debian
# "trixie" images default `cc`/`c++` to GCC, which is required to build
# `rdkafka-sys` (librdkafka) — a Clang default fails to link `-lstdc++`.
FROM rust:1.97.0-trixie

ENV DEBIAN_FRONTEND=noninteractive

# System build dependencies for the Rust workspace:
# - cmake + libcurl4-openssl-dev: librdkafka (rdkafka-sys, cmake-build feature)
# - protobuf-compiler + libprotobuf-dev: tonic/prost proto codegen
# - libssl-dev/pkg-config: OpenSSL-linked crates
# - python3: repository check scripts (just skills-check / subplatform-check)
# - fuse-overlayfs/uidmap/iptables: Docker inside the nested Cloud Agent VM
RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        build-essential \
        cmake \
        pkg-config \
        git \
        curl \
        ca-certificates \
        jq \
        sudo \
        libssl-dev \
        libcurl4-openssl-dev \
        libprotobuf-dev \
        protobuf-compiler \
        python3 \
        fuse-overlayfs \
        uidmap \
        iptables \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 — Next.js dev server, the standalone web workload, and health probes.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install --yes --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && node --version

# Bun (pinned to the repository's packageManager) — web and integrations packages.
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash -s "bun-v1.3.14" \
    && bun --version

# just — the repository task runner.
RUN curl -fsSL https://just.systems/install.sh | bash -s -- --to /usr/local/bin \
    && just --version

# Docker Engine + Compose plugin — local development infrastructure
# (PostgreSQL/TimescaleDB + pgvector, Kafka, Valkey) is run via docker compose.
RUN curl -fsSL https://get.docker.com | sh \
    && mkdir -p /etc/docker \
    && printf '{\n  "storage-driver": "fuse-overlayfs"\n}\n' > /etc/docker/daemon.json

# Non-root agent user with passwordless sudo and Docker access.
RUN useradd --create-home --shell /bin/bash --uid 1000 ubuntu \
    && usermod --append --groups sudo,docker ubuntu \
    && echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/ubuntu \
    && chmod 0440 /etc/sudoers.d/ubuntu

USER ubuntu

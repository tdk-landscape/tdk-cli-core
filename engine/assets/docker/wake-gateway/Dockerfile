# Wake gateway (see openspec/changes/prioritized-cold-start): fronts every
# `sablier.deferStart` resource's Traefik static route, triggers cold
# containers via `tilt trigger` and/or Sablier, then holds the request until
# healthy. Needs the Docker CLI (client only, talks to the mounted
# /var/run/docker.sock) and the real `tilt` CLI (D3: shells out to the
# documented `tilt trigger` command rather than depending on Tilt's
# undocumented internal HTTP API).

FROM oven/bun:1.3.11-alpine AS base

# Pin to the same Tilt version this workspace runs (v0.37.7) so `tilt trigger`
# talks the same protocol as the real daemon it's connecting to. Installed
# directly (not via tilt-dev's install.sh, which shells out to `sudo` -- not
# present in this minimal image, and unnecessary since we're already root).
ARG TILT_VERSION=0.37.7
RUN apk add --no-cache docker-cli curl gcompat \
    && arch="$(uname -m)" \
    && case "$arch" in aarch64) tilt_arch=arm64 ;; x86_64) tilt_arch=x86_64 ;; *) echo "unsupported arch: $arch" >&2; exit 1 ;; esac \
    && curl -fsSL "https://github.com/tilt-dev/tilt/releases/download/v${TILT_VERSION}/tilt.${TILT_VERSION}.linux.${tilt_arch}.tar.gz" \
       | tar -xz -C /usr/local/bin tilt

WORKDIR /app
COPY decide.ts server.ts ./

EXPOSE 9999
CMD ["bun", "run", "server.ts"]

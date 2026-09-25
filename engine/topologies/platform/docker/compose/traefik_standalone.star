# =============================================================================
# Standalone Traefik compose for generated TDK projects
# =============================================================================
# Full platform checkouts load Introvertic/platform proxy compose files.
# Standalone `tdk project` output does not ship those files, so Tilt used to
# skip Traefik entirely and api.{project}.localhost never served.

load("../constants.star", "PlatformDockerConstants")
load("../config/healthcheck.star", "compose_healthcheck_timing")


def generate_standalone_traefik_compose():
    """Minimal Traefik that routes Docker labels on api.{project}.localhost."""
    network = PlatformDockerConstants.NETWORK_TRAEFIK_PUBLIC
    name = PlatformDockerConstants.PROJECT_NAME
    return """###############################################################################
# SYSTEM-GENERATED - DO NOT EDIT
# Standalone Traefik for TDK projects without platform/introvertic proxy files.
###############################################################################

services:
  traefik:
    image: traefik:v3.6.8
    container_name: {name}_traefik
    restart: unless-stopped
    depends_on:
      - sablier
    command:
      - "--api.insecure=true"
      - "--ping=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.watch=true"
      - "--providers.docker.network={network}"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--log.level=INFO"
      # On-demand scaling: routes to stopped containers (opt-in via a
      # resource's `sablier:` manifest block), keeps idle services from
      # burning memory. Requires Traefik >=3.6 (see allownonrunning below).
      - "--experimental.plugins.sablier.moduleName=github.com/sablierapp/sablier-traefik-plugin"
      - "--experimental.plugins.sablier.version=v1.3.1"
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik-public
    healthcheck:
      test: ["CMD", "traefik", "healthcheck", "--ping"]
{healthcheck_timing}
  sablier:
    image: sablierapp/sablier:1.18.0
    container_name: {name}_sablier
    restart: unless-stopped
    command:
      - "start"
      - "--provider.name=docker"
    volumes:
      # Read-write: Sablier stops/starts containers via the Docker API.
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - traefik-public

networks:
  traefik-public:
    name: {network}
    external: true
""".format(name=name, network=network, healthcheck_timing=compose_healthcheck_timing(10))

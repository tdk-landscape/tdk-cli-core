# =============================================================================
# Standalone Traefik compose for generated TDK projects
# =============================================================================
# Full platform checkouts load Introvertic/platform proxy compose files.
# Standalone `tdk project` output does not ship those files, so Tilt used to
# skip Traefik entirely and api.{project}.localhost never served.

load("../constants.star", "PlatformDockerConstants")


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
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik-public
    healthcheck:
      test: ["CMD", "traefik", "healthcheck", "--ping"]
      interval: 10s
      timeout: 5s
      retries: 6
      start_period: 10s

networks:
  traefik-public:
    name: {network}
    external: true
""".format(name=name, network=network)

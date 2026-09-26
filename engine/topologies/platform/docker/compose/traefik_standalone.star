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
      - wake-gateway
    command:
      - "--api.insecure=true"
      - "--ping=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.watch=true"
      - "--providers.docker.network={network}"
      # Static routes for sablier.deferStart resources (openspec/changes/
      # prioritized-cold-start): a never-created resource has no container
      # and thus no Docker labels for the provider above to discover, so its
      # route is defined here instead, pointed at wake-gateway. Harmless when
      # no deferStart resource exists (empty directory, no routes emitted).
      - "--providers.file.directory=/etc/traefik/dynamic"
      - "--providers.file.watch=true"
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
      - ./{dynamic_dir_name}:/etc/traefik/dynamic:ro
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
      # D5: honors a one-shot migrator's exit code 0 as `completed` rather
      # than `stopped`, needed for a deferStart resource's generated
      # `depends_on: {{..., condition: service_completed_successfully}}`.
      - "--provider.docker.honor-restart-policy=true"
    volumes:
      # Read-write: Sablier stops/starts containers via the Docker API.
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - traefik-public

  # Wake gateway (openspec/changes/prioritized-cold-start): fronts every
  # deferStart resource's static route above. Triggers a cold resource (and
  # its dependencies, which Tilt never cascades to on its own -- see design.md
  # D3/task 1.5) via `tilt trigger`, or Sablier's own start when a container
  # already exists, then holds the request until healthy. Needs the same
  # Tilt session token Sablier/Traefik don't: confirmed empirically that
  # `tilt trigger` from inside a container is otherwise rejected with
  # "(403): invalid session token" even when the Tilt HTTP port is reachable.
  wake-gateway:
    build: ./{vendored_gateway_dir}
    container_name: {gateway_container}
    restart: unless-stopped
    environment:
      - TILT_HOST=host.docker.internal
      - TILT_PORT=10350
      - SABLIER_URL=http://sablier:10000
      - PORT={gateway_port}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - {tilt_dev_dir}:/root/.tilt-dev:ro
    networks:
      - traefik-public

networks:
  traefik-public:
    name: {network}
    external: true
""".format(
        name=name,
        network=network,
        healthcheck_timing=compose_healthcheck_timing(10),
        dynamic_dir_name=PlatformDockerConstants.TRAEFIK_DYNAMIC_DIR_REL.split("/")[-1],
        vendored_gateway_dir="tdk-cli-ext/engine/assets/docker/wake-gateway",
        gateway_container=PlatformDockerConstants.TRAEFIK_WAKE_GATEWAY_CONTAINER,
        gateway_port=PlatformDockerConstants.TRAEFIK_WAKE_GATEWAY_PORT,
        tilt_dev_dir=os.environ.get("HOME", "") + "/.tilt-dev",
    )

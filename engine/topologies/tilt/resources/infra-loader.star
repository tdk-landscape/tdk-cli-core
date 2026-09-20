# =============================================================================
# 🏗️ TILT SDK - INFRASTRUCTURE LOADER
# =============================================================================
# Path: .tilt/provisioner/infra-loader.star
# Purpose: Load and configure infrastructure services
# =============================================================================
#
# This module centralizes infrastructure loading:
# - Database (PostgreSQL, Redis)
# - Messaging (NATS, Kafka)
# - Secrets (Infisical)
# - Registry (Verdaccio)
# - Proxy (Traefik)
# - Monitoring (SigNoz, ELK)
# - CDC (Debezium)
#
# Usage:
#   Infra.load_all(should_enable_fn)
# =============================================================================

load("../../platform/docker/constants.star", "PlatformDockerConstants")
load("../../platform/docker/compose/traefik_standalone.star", "generate_standalone_traefik_compose")

# =============================================================================
# 🗃️ DATABASE MANAGEMENT
# =============================================================================

def _file_exists(path):
    """Check if a file exists."""
    result = str(local("test -f '{path}' && echo 'yes' || echo 'no'".format(path=path), quiet=True, echo_off=True)).strip()
    return result == 'yes'


def _docker_compose(compose_paths, env_file):
    """docker_compose() wrapper: Tilt's builtin rejects env_file=None outright
    (it type-checks the kwarg as path|string, not Optional), so the keyword must be
    omitted entirely rather than passed as None when no .env file exists."""
    if env_file:
        docker_compose(compose_paths, env_file=env_file)
    else:
        docker_compose(compose_paths)

def _load_database_management(should_enable, root_prefix="", env_file=None):
    """Load database and messaging infrastructure."""
    if not should_enable('database-management'):
        print("DEBUG INFRA: database-management not enabled")
        return
    
    print("🗃️  Loading database management services...")
    
    # Load postgres if compose file exists
    postgres_compose = root_prefix + 'services/platform/database-management/docker-compose.yml'
    if _file_exists(postgres_compose):
        print("DEBUG INFRA: Loading postgres compose from {}".format(postgres_compose))
        _docker_compose(postgres_compose, env_file)
        dc_resource('postgres', labels=['infra.tools'], resource_deps=['init-networks'], auto_init=True)
    else:
        print("DEBUG INFRA: Skipping postgres (compose file not found)")
    
    # Load messaging if compose file exists
    messaging_compose = root_prefix + 'services/platform/messaging/docker-compose.yml'
    if _file_exists(messaging_compose):
        print("DEBUG INFRA: Loading messaging compose from {}".format(messaging_compose))
        _docker_compose(messaging_compose, env_file)
        dc_resource('redis', labels=['infra.messaging'], auto_init=False)
        dc_resource('nats', labels=['infra.messaging'], auto_init=True)
    else:
        print("DEBUG INFRA: Skipping messaging (compose file not found)")
    
    # Only create kafka resources if debezium is enabled AND messaging exists
    cdc_enabled = should_enable('debezium')
    if cdc_enabled and _file_exists(messaging_compose):
        dc_resource('kafka', labels=['cdc'], resource_deps=['zookeeper'], auto_init=True)
        dc_resource('zookeeper', labels=['cdc'], auto_init=True)


# =============================================================================
# 📦 VERDACCIO (NPM Registry)
# =============================================================================

def _load_verdaccio(should_enable, root_prefix="", env_file=None):
    """Load Verdaccio private npm registry."""
    if not should_enable(PlatformDockerConstants.VERDACCIO_RESOURCE_NAME):
        print("DEBUG INFRA: Verdaccio not enabled")
        return
    
    # Use absolute path for docker-compose to ensure correct working directory
    if root_prefix:
        compose_file = root_prefix + 'docker-compose.verdaccio.yml'
    else:
        # Use project root from environment or relative path
        project_root = os.environ.get('TDK_PROJECT_ROOT', '.')
        compose_file = project_root + '/docker-compose.verdaccio.yml'
    if not _file_exists(compose_file):
        print("DEBUG INFRA: Skipping Verdaccio (compose file not found)")
        return
    print("DEBUG INFRA: Loading Verdaccio from {} with env_file={}".format(compose_file, env_file))
    _docker_compose(compose_file, env_file)
    print("DEBUG INFRA: Calling dc_resource for verdaccio")
    dc_resource(PlatformDockerConstants.VERDACCIO_RESOURCE_NAME, labels=['infra.tools', 'registry'], resource_deps=['init-networks'], auto_init=True)
    print("DEBUG INFRA: dc_resource for verdaccio completed")
    local_resource(PlatformDockerConstants.VERDACCIO_CONNECT_NETWORK_RESOURCE,
        cmd='docker network connect ' + PlatformDockerConstants.NETWORK_BACKEND + ' ' + PlatformDockerConstants.VERDACCIO_CONTAINER_NAME + ' 2>/dev/null || true',
        labels=['infra.tools', 'registry'], 
        resource_deps=[PlatformDockerConstants.VERDACCIO_RESOURCE_NAME, 'init-networks'], 
        auto_init=True
    )


# =============================================================================
# 🔐 INFISICAL (Secrets Management)
# =============================================================================

def _load_infisical(should_enable, root_prefix="", env_file=None):
    """Load Infisical secrets management."""
    if not should_enable('infisical'):
        return

    compose_file = root_prefix + 'docker-compose.infisical.yml'
    if not _file_exists(compose_file):
        print("DEBUG INFRA: Skipping Infisical (compose file not found)")
        return

    print("🔐 Loading Infisical...")
    _docker_compose(compose_file, env_file)
    dc_resource('infisical-db', labels=['infra.tools', 'secrets'], resource_deps=['init-networks'], auto_init=True)
    dc_resource('infisical-redis', labels=['infra.tools', 'secrets'], resource_deps=['init-networks'], auto_init=True)
    dc_resource('infisical', labels=['infra.tools', 'secrets'], resource_deps=['init-networks', 'infisical-db', 'infisical-redis'], auto_init=True)


# =============================================================================
# 🌐 PROXY (Traefik)
# =============================================================================

def _load_standalone_traefik(root_prefix, env_file, write_fn):
    """Generate and load a self-contained Traefik compose for standalone projects."""
    compose_rel = ".tdk/.tdk-out/docker-compose.traefik.yml"
    content = generate_standalone_traefik_compose()
    if write_fn:
        write_fn(compose_rel, content)
    compose_file = root_prefix + compose_rel if root_prefix else compose_rel
    print("🌐 Loading standalone Traefik from {}".format(compose_file))
    _docker_compose(compose_file, env_file)
    dc_resource(
        "traefik",
        labels=["infra.tools"],
        resource_deps=["init-networks"],
        auto_init=True,
    )


def _load_proxy(should_enable, root_prefix="", env_file=None, write_fn=None):
    """Load Traefik reverse proxy with proper health check sequencing."""
    if not should_enable('proxy'):
        print("DEBUG INFRA: proxy not enabled")
        return

    compose_files = [
        root_prefix + 'shared-product-engineering/introvertic/infra/docker-compose.traefik.yml',
        root_prefix + 'services/platform/proxy/docker-compose.core.yml',
        root_prefix + 'services/platform/proxy/docker-compose.utilities.yml',
        root_prefix + 'services/platform/proxy/docker-compose.redirects.yml',
        root_prefix + 'services/platform/proxy/docker-compose.docs.yml',
    ]
    missing = [path for path in compose_files if not _file_exists(path)]
    if missing:
        print("DEBUG INFRA: Platform proxy compose missing ({}), using standalone Traefik".format(missing[0]))
        _load_standalone_traefik(root_prefix, env_file, write_fn)
        return

    print("🌐 Loading proxy services from Introvertic Infra...")
    print("   → Primary: shared-product-engineering/introvertic/infra/docker-compose.traefik.yml")
    print("   → Override flags: TRAEFIK_LOG_LEVEL, TRAEFIK_ENABLE_DASHBOARD, etc.")
    print("   → Traefik will wait for postgres and nats to be healthy")
    print("   → Services configured with 60s startup grace period")

    # Use introvertic/infra traefik configuration (primary)
    # Keep legacy core.yml for network definitions during migration
    _docker_compose(compose_files, env_file)
    
    # Traefik depends on core infrastructure being healthy (not just started) to prevent 504s
    dc_resource('traefik', 
        labels=['infra.tools'], 
        resource_deps=['init-networks', 'postgres', 'nats'], 
        auto_init=True)
    dc_resource('dashy', 
        labels=['infra.tools'], 
        resource_deps=['traefik'], 
        auto_init=False)
    dc_resource('main-redirect',
        labels=['infra.tools'],
        resource_deps=['traefik'],
        auto_init=False)
    dc_resource('traefik-pages',
        labels=['infra.tools'],
        resource_deps=['traefik'],
        auto_init=False)
    dc_resource('tilt-proxy',
        labels=['infra.tools'],
        resource_deps=['traefik'],
        auto_init=False)


# =============================================================================
# 📊 MONITORING (SigNoz, SkyWalking)
# =============================================================================

def _load_monitoring(should_enable, root_prefix="", env_file=None):
    """Load monitoring and observability stack."""
    if not should_enable('monitoring'):
        return
    
    print("📊 Loading monitoring services...")
    docker_compose(root_prefix + 'services/platform/monitoring/docker-compose.yml', env_file=env_file)
    for svc in ['signoz-frontend', 'signoz-otel-collector', 'signoz-query-service']:
        dc_resource(svc, labels=['observability.apm'], auto_init=True)
    dc_resource('clickhouse', labels=['observability.storage'], auto_init=True)
    dc_resource('elasticsearch', labels=['observability.storage'], auto_init=True)
    dc_resource('skywalking-oap', labels=['observability.apm'], resource_deps=['elasticsearch'], auto_init=True)
    dc_resource('skywalking-ui', labels=['observability.apm'], resource_deps=['skywalking-oap'], auto_init=True)


# =============================================================================
# 🔄 DEBEZIUM (CDC)
# =============================================================================

def _load_debezium(should_enable, root_prefix="", env_file=None):
    """Load Debezium Change Data Capture."""
    if not should_enable('debezium'):
        return
    
    print("🔄 Loading Enhanced Debezium...")
    docker_compose(root_prefix + 'services/platform/cdc/docker-compose.enhanced.yml', env_file=env_file)
    dc_resource('nats-http-bridge', labels=['cdc'], resource_deps=['nats'], auto_init=True)
    dc_resource('debezium-connect', labels=['cdc'], resource_deps=['kafka', 'postgres', 'nats-http-bridge'], auto_init=True)
    dc_resource('enhanced-connector-setup', labels=['cdc'], resource_deps=['debezium-connect', 'postgres', 'nats-http-bridge'], auto_init=False)


# =============================================================================
# 📊 ELK STACK
# =============================================================================

def _load_elk(should_enable, root_prefix="", env_file=None):
    """Load ELK logging stack."""
    if not should_enable('elk'):
        return

    print("📊 Loading ELK stack...")
    docker_compose(root_prefix + 'docker/elk-compose.yml', env_file=env_file)
    dc_resource('elasticsearch', labels=['observability.elk'], auto_init=True)
    dc_resource('logstash', labels=['observability.elk', 'processor', 'logs'], resource_deps=['elasticsearch'], auto_init=True)
    dc_resource('kibana', labels=['observability.elk', 'frontend', 'dashboard'], resource_deps=['elasticsearch'], auto_init=True)


# =============================================================================
# 🌐 NETWORK INITIALIZATION
# =============================================================================

def _init_networks(fix_docker_networks_fn):
    """Initialize Docker networks."""
    local_resource('init-networks',
        cmd=fix_docker_networks_fn(),
        labels=['infra.setup'],
        auto_init=True,
        resource_deps=[]
    )


# =============================================================================
# 🏗️ GOLDEN IMAGE (Base Docker Image)
# =============================================================================

def _load_golden_image(should_enable, docker_provider, project_root='.'):
    """Build the golden base image for faster service builds.

    project_root must be passed through here the same way every other
    infra loader below receives it (as root_prefix) - local_resource cmds
    run relative to the Tiltfile's own directory (.tdk/.tdk-out/), not
    the project root, so an unprefixed project-root-relative path like
    GOLDEN_DOCKERFILE resolves to the wrong file otherwise.
    """
    if not should_enable('golden-image'):
        return None

    print("🏗️  Building golden base image...")
    return docker_provider.golden_image.build(project_root=project_root)


def _generate_golden_dockerfile(should_enable, docker_provider, write_fn):
    """Generate the golden-layers.Dockerfile if it doesn't exist.

    Args:
        should_enable: Function that takes service name and returns bool
        docker_provider: Docker provider struct with golden_image
        write_fn: File writing function for output
    """
    if not should_enable('golden-image'):
        return

    dockerfile_path = '.tdk/.tdk-out/golden-layers.Dockerfile'
    content = docker_provider.golden_image.generate_dockerfile()
    write_fn(dockerfile_path, content)


# =============================================================================
# 🎯 MAIN LOADER
# =============================================================================

def load_all_infrastructure(should_enable, fix_docker_networks_fn=None, docker_provider=None, write_fn=None, project_root=None, env_file=None):
    """
    Load all infrastructure services based on configuration.

    Args:
        should_enable: Function that takes service name and returns bool
        fix_docker_networks_fn: Function to fix Docker networks (optional)
        docker_provider: Docker provider struct (optional, for golden image)
        write_fn: File writing function (optional, for golden image)
        project_root: Path to project root from TDK working directory (optional, e.g., "../../")
        env_file: Path to .env file for docker-compose (optional, defaults to project_root + '.env')
    """
    # Initialize networks first
    if fix_docker_networks_fn:
        print("DEBUG INFRA: Initializing networks...")
        _init_networks(fix_docker_networks_fn)
        print("DEBUG INFRA: Networks initialized")
    else:
        print("DEBUG INFRA: SKIPPING network initialization (no fix_docker_networks_fn)")

    # These stacks both define an `elasticsearch` resource (and host port 9200).
    # Running both at once causes compose/resource collisions and unstable startup.
    if should_enable('monitoring') and should_enable('elk'):
        fail("Incompatible flags: 'monitoring' and 'elk' cannot both be enabled at the same time. Disable one of them.")

    # Build golden image before other infrastructure (if enabled)
    golden_image_resource = None
    if docker_provider and write_fn:
        _generate_golden_dockerfile(should_enable, docker_provider, write_fn)
        golden_image_resource = _load_golden_image(should_enable, docker_provider, project_root=project_root or '.')

    # Get project root prefix for paths (e.g., "../../" from .tdk/.tdk-out/)
    # Ensure root_prefix ends with / for proper path concatenation
    root_prefix = project_root if project_root else ""
    if root_prefix and not root_prefix.endswith('/'):
        root_prefix = root_prefix + '/'

    # Load environment file for docker-compose variables
    # Use provided env_file or construct default from root_prefix.
    # `docker compose ... --env-file <path>` hard-fails if that path doesn't exist, and
    # .env is gitignored (with no .env.example shipped) across every TDK example repo, so
    # a fresh clone must fall back to no --env-file flag rather than a dangling path.
    if env_file == None:
        candidate_env_file = root_prefix + '.env' if root_prefix else '.env'
        env_file = candidate_env_file if _file_exists(candidate_env_file) else None

    # Load infrastructure in order
    _load_database_management(should_enable, root_prefix, env_file)
    _load_verdaccio(should_enable, root_prefix, env_file)
    _load_infisical(should_enable, root_prefix, env_file)
    _load_proxy(should_enable, root_prefix, env_file, write_fn)
    _load_monitoring(should_enable, root_prefix, env_file)
    _load_debezium(should_enable, root_prefix, env_file)
    _load_elk(should_enable, root_prefix, env_file)

    return golden_image_resource


# =============================================================================
# 📦 INFRA STRUCT (Public API)
# =============================================================================

Infra = struct(
    # Main loader
    load_all = load_all_infrastructure,
    init_networks = _init_networks,
    
    # Individual loaders (for granular control)
    load_database = _load_database_management,
    load_verdaccio = _load_verdaccio,
    load_infisical = _load_infisical,
    load_proxy = _load_proxy,
    load_monitoring = _load_monitoring,
    load_debezium = _load_debezium,
    load_elk = _load_elk,
    load_golden_image = _load_golden_image,
)

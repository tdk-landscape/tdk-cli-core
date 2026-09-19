# =============================================================================
# 🎯 TILT SDK - SYNTHETIC MONITOR SERVICE
# =============================================================================
# Path: .tilt/topologies/platform/services/synthetic-monitor.star
# Purpose: Synthetic monitoring service for health checks and observability
# =============================================================================
#
# This module defines the Tilt resources for synthetic monitoring, providing
# health checks and observability for the platform.
#
# Key Features:
#   - Docker-based synthetic monitor service
#   - Port 3000 for health dashboard
#   - Resource dependencies on core backend services
#   - Built-in health check endpoint
# =============================================================================

# Load restart_process extension for live update support
load('ext://restart_process', 'docker_build_with_restart')

# =============================================================================
# 📋 SYNTHETIC MONITOR RESOURCE DEFINITION
# =============================================================================

SYNTHETIC_MONITOR_PORT = 3000
SYNTHETIC_MONITOR_NAME = 'synthetic-monitor'

# Service dependencies - synthetic monitor depends on core backend services
# to ensure they are healthy before running checks
# Dependencies are discovered dynamically from manifests
SYNTHETIC_MONITOR_DEPS = []

# =============================================================================
# 🐳 DOCKER BUILD CONFIGURATION
# =============================================================================

def build_synthetic_monitor(ctx):
    """
    Define the docker_build resource for synthetic-monitor service.
    
    Args:
        ctx: Tilt context with configuration
    
    Returns:
        The docker image name for synthetic-monitor
    """
    # Load project name for dynamic image naming
    # Use TDK_PROJECT_ROOT env var set by Tilt, fallback to current directory
    def _load_project_name():
        project_root = os.environ.get('TDK_PROJECT_ROOT', '')
        project_json_path = '.tdk/project.json'
        if project_root:
            project_json_path = project_root + '/' + project_json_path
        
        if os.path.exists(project_json_path):
            _project_json = read_json(project_json_path)
            return _project_json.get('project', {}).get('name', 'tdk-project')
        return 'tdk-project'
    
    _project_name = _load_project_name()
    image_name = _project_name + '/synthetic-monitor:latest'
    
    # Get service path from context, with fallback to default
    service_path = ctx.get('service_path', './services/platform/synthetic-monitor')
    
    # Use docker_build_with_restart for live update support
    # This allows the container to restart when code changes
    docker_build_with_restart(
        image_name,
        service_path,
        entrypoint=['bun', 'run', 'start'],
        build_args={'NODE_ENV': 'development'},
        live_update=[
            sync(service_path + '/src', '/app/src'),
            sync(service_path + '/config', '/app/config'),
            run('cd /app && bun install', trigger=[service_path + '/package.json']),
        ],
        only=[
            service_path + '/src',
            service_path + '/config',
            service_path + '/package.json',
            service_path + '/bun.lock',
        ],
    )
    
    return image_name

# =============================================================================
# 🔍 HEALTH CHECK CONFIGURATION
# =============================================================================

def get_health_check():
    """
    Return the health check configuration for synthetic-monitor.
    
    Returns:
        dict with health check settings
    """
    return {
        'exec': {
            'command': ['curl', '-f', 'http://localhost:3000/health'],
        },
        'interval': 30,  # seconds
        'timeout': 10,   # seconds
        'retries': 3,
    }

# =============================================================================
# 🏗️ DOCKER COMPOSE ENTRY
# =============================================================================

def generate_synthetic_monitor_compose(image_name):
    """
    Generate the Docker Compose entry for synthetic-monitor service.
    
    Args:
        image_name: The Docker image name to use
    
    Returns:
        dict representing the compose service configuration
    """
    health_check = get_health_check()
    
    return {
        'image': image_name,
        'container_name': SYNTHETIC_MONITOR_NAME,
        'ports': [
            '{}:{}'.format(SYNTHETIC_MONITOR_PORT, SYNTHETIC_MONITOR_PORT),
        ],
        'environment': [
            'NODE_ENV=development',
            'PORT={}'.format(SYNTHETIC_MONITOR_PORT),
            'HEALTH_CHECK_INTERVAL={}'.format(health_check['interval']),
        ],
        'healthcheck': {
            'test': ['CMD'] + health_check['exec']['command'],
            'interval': '{}s'.format(health_check['interval']),
            'timeout': '{}s'.format(health_check['timeout']),
            'retries': health_check['retries'],
            'start_period': '5s',
        },
        'restart': 'unless-stopped',
        'labels': [
            'traefik.enable=true',
            'traefik.http.routers.synthetic-monitor.rule=Host(`synthetic-monitor.' + _project_name + '.localhost`)',
            'traefik.http.routers.synthetic-monitor.entrypoints=web',
            'traefik.http.services.synthetic-monitor.loadbalancer.server.port={}'.format(SYNTHETIC_MONITOR_PORT),
        ],
    }

# =============================================================================
# 📊 TILT LOCAL RESOURCE
# =============================================================================

def register_synthetic_monitor_resource(ctx, should_enable):
    """
    Register the synthetic-monitor Tilt resource with proper dependencies.
    
    Args:
        ctx: Tilt context with configuration
        should_enable: Function to check if resource should be enabled
    
    Returns:
        Name of the registered resource or None
    """
    if not should_enable(SYNTHETIC_MONITOR_NAME):
        return None
    
    print("🩺 Registering {} resource...".format(SYNTHETIC_MONITOR_NAME))
    
    # Build the Docker image
    image_name = build_synthetic_monitor(ctx)
    
    # Generate compose entry
    compose_entry = generate_synthetic_monitor_compose(image_name)
    
    # Register as a local resource with dependencies
    local_resource(
        SYNTHETIC_MONITOR_NAME,
        serve_cmd='docker run --rm -p {}:{} --name {} {}'.format(
            SYNTHETIC_MONITOR_PORT,
            SYNTHETIC_MONITOR_PORT,
            SYNTHETIC_MONITOR_NAME,
            image_name
        ),
        deps=[
            './services/platform/synthetic-monitor/src',
            './services/platform/synthetic-monitor/package.json',
        ],
        auto_init=True,
        resource_deps=SYNTHETIC_MONITOR_DEPS,
        labels=['monitoring', 'synthetic-monitor'],
        links=[
            link('http://localhost:{}/health'.format(SYNTHETIC_MONITOR_PORT), 'Health Check'),
            link('http://localhost:{}/dashboard'.format(SYNTHETIC_MONITOR_PORT), 'Dashboard'),
        ],
    )
    
    print("✅ Synthetic monitor resource registered on port {}".format(SYNTHETIC_MONITOR_PORT))
    return SYNTHETIC_MONITOR_NAME

# =============================================================================
# 📦 PUBLIC API
# =============================================================================

SyntheticMonitor = struct(
    # Constants
    NAME = SYNTHETIC_MONITOR_NAME,
    PORT = SYNTHETIC_MONITOR_PORT,
    DEPS = SYNTHETIC_MONITOR_DEPS,
    
    # Functions
    register = register_synthetic_monitor_resource,
    build = build_synthetic_monitor,
    get_compose = generate_synthetic_monitor_compose,
    get_health_check = get_health_check,
    # Dynamic dependency configuration
    set_deps = lambda deps: [SYNTHETIC_MONITOR_DEPS.append(d) for d in deps],
)

print("✅ Synthetic Monitor Tilt module loaded")

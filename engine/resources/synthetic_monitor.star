# =============================================================================
# 🩺 TILT SYNTHETIC MONITOR - Starlark Configuration
# =============================================================================
# Adds a Docker-based synthetic monitor to Tilt
# Runs health checks every 60 seconds like New Relic
# =============================================================================

def deploy_synthetic_monitor(ctx):
    """Deploy synthetic monitoring container to Tilt"""
    project_root = ctx.get('project_root', '.')

    # Build and deploy the monitor container
    docker_build(
        'alpha-synthetic-monitor',
        project_root,
        dockerfile='docker/Dockerfile.synthetic-monitor',
        only=['scripts/alpha-synthetic-monitor.sh'],
        live_update=[
            sync('scripts/alpha-synthetic-monitor.sh', '/usr/local/bin/alpha-synthetic-monitor.sh'),
        ],
    )
    
    # Create local resource for monitor
    local_resource(
        'alpha-synthetic-monitor',
        cmd='docker run -d \
            --name alpha-synthetic-monitor \
            --network host \
            -v /tmp/alpha-monitoring:/tmp/alpha-monitoring \
            --restart unless-stopped \
            alpha-synthetic-monitor',
        deps=['scripts/alpha-synthetic-monitor.sh', 'docker/Dockerfile.synthetic-monitor'],
        auto_init=True,
        resource_deps=[
            # Services will be auto-discovered from manifests
            # No hardcoded service names - all from service.json
        ],
        labels=['monitoring'],
        links=[
            link('file:///tmp/alpha-monitoring/status.json', 'Health Status JSON'),
        ],
    )
    
    # Add a dashboard view
    local_resource(
        'alpha-health-dashboard',
        cmd='python3 -m http.server 8765 --directory docs/ 2>/dev/null || python -m SimpleHTTPServer 8765 &',
        deps=['docs/alpha-health-dashboard.html'],
        auto_init=True,
        serve_cmd='python3 -m http.server 8765 --directory docs/',
        links=[
            link('http://localhost:8765/alpha-health-dashboard.html', 'Health Dashboard'),
        ],
        resource_deps=['alpha-synthetic-monitor'],
    )

# Export for use in main Tiltfile
deploy_monitor = deploy_synthetic_monitor

# =============================================================================
# 🐳 TILT SDK - DOCKER NETWORK MANAGEMENT
# =============================================================================


def fix_docker_networks(platform_networks):
    """
    Generates a shell command that:
    1. Removes networks with incorrect labels (if they exist and are not in use)
    2. Creates all platform networks if they don't exist
    """
    commands = []
    commands.append('echo "Initializing Docker networks..."')

    for network in platform_networks:
        check_and_remove = '(docker network inspect ' + network + ' >/dev/null 2>&1 && '
        check_and_remove += 'docker network inspect ' + network + ' --format "{{.Labels}}" | grep -q "com.docker.compose" && '
        check_and_remove += 'echo "Removing network ' + network + ' with incorrect labels..." && '
        check_and_remove += 'docker network rm ' + network + ' 2>/dev/null) || true'
        commands.append(check_and_remove)

        create_cmd = 'docker network create ' + network + ' 2>/dev/null && echo "Created network ' + network + '" || true'
        commands.append(create_cmd)

    commands.append('echo "Docker networks initialized"')

    return ' && '.join(commands)


def cleanup_docker_networks(platform_networks):
    """
    Generates a shell command to forcefully remove all platform networks.
    WARNING: This will disconnect all containers from these networks first!
    """
    commands = []
    commands.append('echo "Cleaning up Docker networks..."')

    for network in platform_networks:
        disconnect_cmd = 'for c in $(docker network inspect ' + network + ' -f "{{range .Containers}}{{.Name}} {{end}}" 2>/dev/null); do '
        disconnect_cmd += 'docker network disconnect -f ' + network + ' "$c" 2>/dev/null || true; done'
        commands.append(disconnect_cmd)
        commands.append('docker network rm ' + network + ' 2>/dev/null || true')

    commands.append('echo "Docker networks cleaned up"')

    return ' && '.join(commands)

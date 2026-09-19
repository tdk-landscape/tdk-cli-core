# =============================================================================
# 🔐 INFISICAL ENVIRONMENT GENERATOR (Refactored)
# =============================================================================
# Uses Starlark generators for consistent secret management
# =============================================================================
#
# This module provides:
#   - Environment variable generation for Infisical integration
#   - Uses SecretsGenerator for consistent configuration
#
# Usage:
#   load("../secrets/infisical.star", "InfisicalEnv")
#   env_vars = InfisicalEnv.get_for_service("my-service")
# =============================================================================

load("../constants.star", "PlatformDockerConstants")
load("../../../tilt/generators/infisical/secrets_generator.star", "SecretsGenerator")
load("../../../tilt/generators/infisical/path_manager.star", "PathManager")

def _get_infisical_base_url():
    """Get the Infisical base URL."""
    return "http://{}-infisical:8080".format(PlatformDockerConstants.PROJECT_NAME)

def get_infisical_environment_vars(as_array=True, resource_name=None, resource_type="backend"):
    """
    Generate environment variables for Infisical integration.
    
    Uses Starlark generators for consistent configuration.
    
    Args:
        as_array: If True, return as YAML array format; else as dict format
        resource_name: Optional service name for service-specific configuration
        resource_type: Service type for path generation
    
    Returns:
        String with environment variables in YAML format
    """
    infisical_url = _get_infisical_base_url()
    
    if resource_name:
        # Use generator for service-specific configuration
        secret_path = PathManager.get_known_resource_path(resource_name)
        if not secret_path:
            path_plan = PathManager.plan_resource_path(resource_name, resource_type)
            secret_path = path_plan["full_path"]
        
        config = SecretsGenerator.generate_for_service(
            resource_name=resource_name,
            secret_path=secret_path,
            resource_type=resource_type,
        )
        
        env = config["docker_compose"]["environment"]
        
        if as_array:
            lines = []
            for key, value in env.items():
                lines.append("      - {}={}".format(key, value))
            return "\n".join(lines)
        else:
            lines = []
            for key, value in env.items():
                lines.append("      {}: {}".format(key, value))
            return "\n".join(lines)
    
    # Fallback to base configuration (no service-specific paths)
    base_env = {
        "INFISICAL_CLIENT_ID": "${INFISICAL_CLIENT_ID:-}",
        "INFISICAL_CLIENT_SECRET": "${INFISICAL_CLIENT_SECRET:-}",
        "INFISICAL_PROJECT_ID": "${INFISICAL_PROJECT_ID:-}",
        "INFISICAL_SITE_URL": "${INFISICAL_SITE_URL:-" + infisical_url + "}",
        "INFISICAL_ENV": "${INFISICAL_ENV:-dev}",
        "INFISICAL_ENABLED": "${INFISICAL_ENABLED:-true}",
    }
    
    if as_array:
        lines = []
        for key, value in base_env.items():
            lines.append("      - {}={}".format(key, value))
        return "\n".join(lines)
    else:
        lines = []
        for key, value in base_env.items():
            lines.append("      {}: {}".format(key, value))
        return "\n".join(lines)

def get_for_service(resource_name, resource_type="backend", as_array=True):
    """
    Get Infisical environment variables for a specific service.
    
    Args:
        resource_name: Name of the service
        resource_type: Type of service
        as_array: Return format (array or dict style)
    
    Returns:
        String with environment variables
    """
    return get_infisical_environment_vars(
        as_array=as_array,
        resource_name=resource_name,
        resource_type=resource_type,
    )

def get_batch_for_services(resource_configs):
    """
    Get Infisical environment variables for multiple services.
    
    Args:
        resource_configs: List of dicts with 'name' and optional 'type'
    
    Returns:
        Dict mapping service names to environment variable strings
    """
    results = {}
    
    for config in resource_configs:
        name = config.get("name")
        svc_type = config.get("type", "backend")
        
        if name:
            results[name] = get_for_service(name, svc_type)
    
    return results

# =============================================================================
# Public API
# =============================================================================

InfisicalEnv = struct(
    get_base_url=_get_infisical_base_url,
    get_infisical_environment_vars=get_infisical_environment_vars,
    get_for_service=get_for_service,
    get_batch_for_services=get_batch_for_services,
)

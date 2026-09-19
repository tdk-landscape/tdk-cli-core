# =============================================================================
# 🎯 TILT SDK - ORCHESTRATOR APPLY
# =============================================================================
# Purpose: thin coordinator for service apply lifecycle.
# =============================================================================

load('../databases.star', 'Database')
load('./apply_runtime_flags.star', 'RuntimeFlags')
load('./apply_resource_validation.star', 'ResourceValidation')
load('./apply_manifest_orchestration.star', 'ManifestOrchestration')
load('./apply_compose_resource_registration.star', 'ComposeResourceRegistration')
load('./apply_migrator_orchestration.star', 'MigratorOrchestration')


def apply_app_service(resource_config, ctx):
    """
    Load and configure an application service by delegating each responsibility
    to a focused orchestration module.
    """
    resource_name = resource_config.get('appName', resource_config.get('name', 'UNKNOWN'))
    resource_path = resource_config.get('path', 'NO_PATH')
    should_enable = ctx['should_enable']

    if not should_enable(resource_name):
        return

    runtime_flags = RuntimeFlags.resolve()
    ctx['auto_init_config_gen'] = runtime_flags['auto_init_config_gen']

    ResourceValidation.validate(resource_config)

    # Only provision database if service has a backend resource (not just frontend)
    has_backend = False
    for resource in resource_config.get('resources', []):
        manifest = resource.get('_manifest', {})
        if manifest.get('appType') == 'backend':
            has_backend = True
            break
    
    if should_enable('database-management') and has_backend:
        Database.provision(resource_name)

    manifest_state = ManifestOrchestration.prepare(resource_config, ctx)
    compose_state = ComposeResourceRegistration.register(
        resource_config,
        ctx,
        runtime_flags,
        manifest_state,
    )

    MigratorOrchestration.register(
        resource_config,
        ctx,
        runtime_flags,
        compose_state['compose_project_name'],
    )

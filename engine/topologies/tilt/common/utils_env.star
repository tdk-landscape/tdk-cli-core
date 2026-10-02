# =============================================================================
# 🌍 TILT SDK - ENVIRONMENT UTILITIES
# =============================================================================


def load_dotenv(project_root=''):
    """Load .env file into os.environ.

    The Tiltfile lives in `.tdk/.tdk-out/`, so a bare `.env` lookup misses the
    project-root file. Prefer an explicit project_root, then TDK_PROJECT_ROOT.
    """
    if not project_root:
        project_root = os.environ.get('TDK_PROJECT_ROOT', '')
    env_path = (project_root + '/.env') if project_root else '.env'
    content = str(local("cat '" + env_path + "' 2>/dev/null || true", quiet=True, echo_off=True))
    if content:
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip().strip('"').strip("'")


def should_enable(resource_name, cfg, defaults):
    """Check if a service should be enabled based on config and defaults."""
    return cfg.get(resource_name, defaults.get(resource_name, False))

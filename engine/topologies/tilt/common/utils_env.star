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


def validate_infisical_environment():
    """Validate required Infisical environment variables are set."""
    required_vars = ["INFISICAL_CLIENT_ID", "INFISICAL_CLIENT_SECRET", "INFISICAL_PROJECT_ID"]
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        fail("""
🛑 MISSING REQUIRED ENVIRONMENT VARIABLES FOR INFISICAL:
{missing_vars}

Please set these variables in your environment or .env file.
Example:
  export INFISICAL_CLIENT_ID=your_client_id
  export INFISICAL_CLIENT_SECRET=your_client_secret
  export INFISICAL_PROJECT_ID=your_project_id
""".format(missing_vars=", ".join(missing_vars)))


def should_enable(resource_name, cfg, defaults):
    """Check if a service should be enabled based on config and defaults."""
    return cfg.get(resource_name, defaults.get(resource_name, False))

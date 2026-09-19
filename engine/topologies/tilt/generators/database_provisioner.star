# =============================================================================
# 🗄️ DATABASE PROVISIONER Generator
# =============================================================================
# Ensures databases are properly provisioned before services start
# Fixes: "Authentication failed against database server" errors
# =============================================================================

def _get_timestamp():
    """Get current timestamp string"""
    return str(local("date +%Y-%m-%dT%H:%M:%S", quiet=True)).strip()

load("../common/utils.star", "Utils")
load("../../platform/docker/constants.star", "PlatformDockerConstants")


# Discovery configuration - inlined for self-containment
def get_discovery_config():
    """Return discovery configuration with database readiness settings."""
    return {
        "db_readiness_timeout_seconds": 30,
        "db_connect_retry_attempts": 10,
        "db_connect_retry_delay_seconds": 2,
    }

_discovery_config = get_discovery_config()

# =============================================================================
# Database Configuration Constants
# =============================================================================

# Load project name for dynamic database naming
# Use TDK_PROJECT_ROOT env var set by Tilt, fallback to current directory
def _load_project_names():
    project_root = os.environ.get('TDK_PROJECT_ROOT', '')
    project_json_path = '.tdk/project.json'
    if project_root:
        project_json_path = project_root + '/' + project_json_path
    
    if os.path.exists(project_json_path):
        _project_json = read_json(project_json_path)
        _PROJECT_NAME_HYPHEN = _project_json.get('project', {}).get('name', 'tdk-project')
        _PROJECT_NAME = _PROJECT_NAME_HYPHEN.replace('-', '_')
        return _PROJECT_NAME, _PROJECT_NAME_HYPHEN
    return 'tdk_project', 'tdk-project'

_PROJECT_NAME, _PROJECT_NAME_HYPHEN = _load_project_names()

DEFAULT_DB_CONFIG = {
    "host": _PROJECT_NAME + "_postgres",
    "port": 5432,
    "user": "postgres",
    # ⚠️ SECURITY: No default password - must be provided via POSTGRES_PASSWORD env var
    "password": "${POSTGRES_PASSWORD}",
    "superuser": "postgres",
    # ⚠️ SECURITY: No default password - must be provided via POSTGRES_PASSWORD env var
    "superuser_password": "${POSTGRES_PASSWORD}",
}

# Database naming conventions
DB_NAME_PREFIX = _PROJECT_NAME + "_"

# =============================================================================
# Database Provisioning
# =============================================================================

def provision_database_for_service(resource_name, db_name, db_config=None):
    """
    Generates database provisioning configuration for a service.
    
    Creates:
      - Docker Compose entry for database
      - Database creation SQL
      - User creation SQL
      - Connection string
    
    Returns: provisioning_config dict
    """
    config = db_config or DEFAULT_DB_CONFIG
    
    # Ensure database name has prefix
    if not db_name.startswith(DB_NAME_PREFIX):
        full_db_name = "{}{}".format(DB_NAME_PREFIX, db_name)
    else:
        full_db_name = db_name
    
    # Generate service-specific user (consistent with constants.star)
    resource_user = PlatformDockerConstants.PROJECT_NAME
    # ⚠️ SECURITY: No default password - must be provided via DB_PASSWORD env var
    resource_password = "${DB_PASSWORD}"
    
    # Docker Compose entry
    compose_entry = {
        "image": "postgres:16-alpine",
        "container_name": _PROJECT_NAME_HYPHEN + "-{}-db".format(resource_name.replace("_", "-")),
        "environment": {
            "POSTGRES_DB": full_db_name,
            "POSTGRES_USER": config["superuser"],
            "POSTGRES_PASSWORD": config["superuser_password"],
            "PGDATA": "/var/lib/postgresql/data/pgdata",
        },
        "volumes": [
            _PROJECT_NAME + "_{}_data:/var/lib/postgresql/data".format(full_db_name),
        ],
        "ports": [],  # Internal only
        "networks": [_PROJECT_NAME + "_network"],
        "healthcheck": {
            "test": ["CMD-SHELL", "pg_isready -U {}".format(config["superuser"])],
            "interval": "10s",
            "timeout": "5s",
            "retries": 5,
        },
    }
    
    # SQL for database setup
    setup_sql = '''
-- Database provisioning for {service}
-- Generated: {timestamp}

-- Create database if not exists
SELECT 'CREATE DATABASE {db_name}' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '{db_name}')\\gexec

-- Create service user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{resource_user}') THEN
        CREATE USER {resource_user} WITH PASSWORD '{resource_password}';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {resource_user};

-- Connect to database and grant schema privileges
\\c {db_name};

GRANT ALL ON SCHEMA public TO {resource_user};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {resource_user};
'''.format(
        service=resource_name,
        timestamp=_get_timestamp(),
        db_name=full_db_name,
        resource_user=resource_user,
        resource_password=resource_password,
    )
    
    # Connection strings
    connection_strings = {
        "superuser": "postgresql://{}:{}@{}:{}/{}".format(
            config["superuser"],
            config["superuser_password"],
            config["host"],
            config["port"],
            full_db_name
        ),
        "service": "postgresql://{}:{}@{}:{}/{}".format(
            resource_user,
            resource_password,
            config["host"],
            config["port"],
            full_db_name
        ),
        "migrator": "postgresql://{}:{}@{}:{}/{}?schema=public".format(
            resource_user,
            resource_password,
            config["host"],
            config["port"],
            full_db_name
        ),
    }
    
    return struct(
        resource_name=resource_name,
        db_name=full_db_name,
        compose_entry=compose_entry,
        setup_sql=setup_sql,
        connection_strings=connection_strings,
        resource_user=resource_user,
        resource_password=resource_password,
    )

def generate_database_provisioning_resource(resource_name, db_name, db_config=None, write_fn=None):
    """
    Generates all files needed for database provisioning.
    
    Creates:
      - db-compose-entry.json (for docker-compose)
      - db-setup.sql (initialization script)
      - db-connection-strings.txt
      - db-provision.sh (provisioning script)
    """
    provisioning = provision_database_for_service(resource_name, db_name, db_config)
    
    files = {}
    
    # 1. Docker Compose entry
    files["db-compose-entry.json"] = Utils.encode_json(provisioning.compose_entry)
    
    # 2. SQL setup script
    files["db-setup.sql"] = provisioning.setup_sql
    
    # 3. Connection strings
    connection_strings_content = '''# Database Connection Strings for {service}
# Generated: {timestamp}

SUPERUSER_URL={superuser}
RESOURCE_URL={resource_url}
MIGRATOR_URL={migrator}

# Individual components
DB_HOST={host}
DB_PORT={port}
DB_NAME={db_name}
DB_USER={user}
DB_PASSWORD={password}
'''.format(
        service=resource_name,
        timestamp=_get_timestamp(),
        superuser=provisioning.connection_strings["superuser"],
        resource_url=provisioning.connection_strings["service"],
        migrator=provisioning.connection_strings["migrator"],
        host=(db_config or DEFAULT_DB_CONFIG)["host"],
        port=(db_config or DEFAULT_DB_CONFIG)["port"],
        db_name=provisioning.db_name,
        user=provisioning.resource_user,
        password=provisioning.resource_password,
    )
    files["db-connection-strings.txt"] = connection_strings_content
    
    # 4. Provisioning shell script
    provision_script = '''#!/bin/bash
# Auto-generated database provisioning script for {service}
# Generated: {timestamp}

set -e

echo "🔍 Provisioning database for {service}..."

DB_NAME="{db_name}"
DB_HOST="{host}"
DB_PORT="{port}"
SUPERUSER="{superuser}"
SUPERUSER_PASSWORD="{superuser_password}"
RESOURCE_USER="{resource_user}"
RESOURCE_PASSWORD="{resource_password}"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
until PGPASSWORD=$SUPERUSER_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -c '\\q' 2>/dev/null; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 1
done
echo "✅ PostgreSQL is up"

# Check if database exists
echo "🔍 Checking if database $DB_NAME exists..."
DB_EXISTS=$(PGPASSWORD=$SUPERUSER_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Database $DB_NAME already exists"
else
    echo "🆕 Creating database $DB_NAME..."
    PGPASSWORD=$SUPERUSER_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -c "CREATE DATABASE $DB_NAME;"
    echo "✅ Database created"
fi

# Create service user
echo "👤 Creating service user $RESOURCE_USER..."
PGPASSWORD=$SUPERUSER_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -c "
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$RESOURCE_USER') THEN
        CREATE USER $RESOURCE_USER WITH PASSWORD '$RESOURCE_PASSWORD';
        RAISE NOTICE 'User created';
    ELSE
        RAISE NOTICE 'User already exists';
    END IF;
END
$;
"

# Grant privileges
echo "🔐 Granting privileges..."
PGPASSWORD=$SUPERUSER_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $RESOURCE_USER;"

# Set up schema privileges
PGPASSWORD=$SUPERUSER_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -d $DB_NAME -c "
GRANT ALL ON SCHEMA public TO $RESOURCE_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $RESOURCE_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $RESOURCE_USER;
"

echo "✅ Database provisioning complete for {service}"
echo ""
echo "Connection string:"
echo "  {resource_url}"
'''.format(
        service=resource_name,
        timestamp=_get_timestamp(),
        db_name=provisioning.db_name,
        host=(db_config or DEFAULT_DB_CONFIG)["host"],
        port=(db_config or DEFAULT_DB_CONFIG)["port"],
        superuser=(db_config or DEFAULT_DB_CONFIG)["superuser"],
        superuser_password=(db_config or DEFAULT_DB_CONFIG)["superuser_password"],
        resource_user=provisioning.resource_user,
        resource_password=provisioning.resource_password,
        resource_url=provisioning.connection_strings["service"],
    )
    files["db-provision.sh"] = provision_script
    
    # Write files
    if write_fn:
        for filename, content in files.items():
            write_fn(filename, content)
    
    return struct(
        files=files,
        provisioning=provisioning,
    )

# =============================================================================
# Database Validation
# =============================================================================

def validate_database_credentials(resource_name, db_name, connection_string, db_config=None):
    """
    Validates that database credentials work.
    
    Returns: (is_valid, errors)
    """
    errors = []
    
    config = db_config or DEFAULT_DB_CONFIG
    
    # Validate connection string format
    if not connection_string.startswith("postgresql://"):
        errors.append({
            "type": "format",
            "message": "Connection string must start with postgresql://",
        })
    
    # Parse connection string
    # postgresql://user:password@host:port/dbname
    # Remove protocol
    without_protocol = connection_string.replace("postgresql://", "")
    
    # Split user:password and rest
    if "@" not in without_protocol:
        errors.append({
            "type": "format",
            "message": "Connection string missing @ separator",
        })
    else:
        credentials, rest = without_protocol.split("@", 1)
        
        if ":" not in credentials:
            errors.append({
                "type": "format",
                "message": "Connection string missing password (user:password format)",
            })
        else:
            user, password = credentials.split(":", 1)
            
            if not user:
                errors.append({
                    "type": "credentials",
                    "message": "Database user is empty",
                })
            
            if not password:
                errors.append({
                    "type": "credentials",
                    "message": "Database password is empty",
                })
            
            # Check against expected user (dynamic from project name)
            expected_user = _PROJECT_NAME
            if user != expected_user and user != "postgres":
                errors.append({
                    "type": "credentials",
                    "message": "Unexpected database user: {} (expected: {})".format(user, expected_user),
                })
    
    is_valid = len(errors) == 0
    
    return struct(
        is_valid=is_valid,
        errors=errors,
        resource_name=resource_name,
        db_name=db_name,
    )

def generate_database_validation_report(resource_name, db_name, connection_string, db_config=None, write_fn=None):
    """
    Generates a validation report for database credentials.
    """
    result = validate_database_credentials(resource_name, db_name, connection_string, db_config)
    
    report = {
        "timestamp": _get_timestamp(),
        "service": resource_name,
        "database": db_name,
        "status": "VALID" if result.is_valid else "INVALID",
        "errors": result.errors if not result.is_valid else [],
    }
    
    if write_fn:
        write_fn("db-credentials-validation.json", Utils.encode_json(report))
    
    if not result.is_valid:
        print("⚠️  Database Credential Validation Failed for {}".format(resource_name))
        for error in result.errors:
            print("   ❌ {}: {}".format(error["type"], error["message"]))
    
    return report

# =============================================================================
# Database Readiness Check (for entrypoint)
# =============================================================================

def generate_db_readiness_script(resource_name, db_url, timeout=_discovery_config["db_readiness_timeout_seconds"]):
    """
    Generates a shell script that waits for database to be ready.
    
    This script is used in container entrypoints to ensure the database
    is available before starting the application.
    """
    return '''#!/bin/bash
# Database readiness check for {service}
# Generated: {timestamp}

DB_URL="{db_url}"
TIMEOUT={timeout}

echo "🗃️  Waiting for database to be ready..."
echo "   URL: $(echo $DB_URL | sed 's/:[^:@]*@/:***@/')"
echo "   Timeout: ${TIMEOUT}s"

start_time=$(date +%s)

while true; do
    # Try to connect using pg_isready if available
    if command -v pg_isready > /dev/null 2>&1; then
        # Parse connection string
        if pg_isready -d "$DB_URL" -t 2 > /dev/null 2>&1; then
            echo "✅ Database is ready"
            exit 0
        fi
    else
        # Fallback: try psql
        if psql "$DB_URL" -c '\\q' > /dev/null 2>&1; then
            echo "✅ Database is ready"
            exit 0
        fi
    fi
    
    # Check timeout
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "❌ Database readiness check timed out after ${TIMEOUT}s"
        echo "   Check that:"
        echo "     1. PostgreSQL is running"
        echo "     2. Database exists and is accessible"
        echo "     3. Credentials are correct"
        exit 1
    fi
    
    echo "   ⏳ Waiting... (${elapsed}s elapsed)"
    sleep 2
done
'''.format(
        service=resource_name,
        timestamp=_get_timestamp(),
        db_url=db_url,
        timeout=timeout,
    )

def generate_prisma_migrate_script(resource_name, db_url, schema_path="./prisma/schema.prisma"):
    """
    Generates a script that runs Prisma migrations.
    
    Ensures migrations run only after database is ready.
    """
    return '''#!/bin/bash
# Prisma migration script for {service}
# Generated: {timestamp}

set -e

echo "📦 Running Prisma migrations for {service}..."

# Check if prisma schema exists
if [ ! -f "{schema_path}" ]; then
    echo "❌ Prisma schema not found at {schema_path}"
    exit 1
fi

# Set database URL
export DATABASE_URL="{db_url}"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if command -v bun > /dev/null 2>&1; then
    bunx prisma generate --schema={schema_path}
else
    npx prisma generate --schema={schema_path}
fi

# Deploy migrations
echo "🚀 Deploying migrations..."
if command -v bun > /dev/null 2>&1; then
    bunx prisma migrate deploy --schema={schema_path}
else
    npx prisma migrate deploy --schema={schema_path}
fi

echo "✅ Migrations complete for {service}"
'''.format(
        service=resource_name,
        timestamp=_get_timestamp(),
        db_url=db_url,
        schema_path=schema_path,
    )

# =============================================================================
# Master Database Orchestrator
# =============================================================================

def provision_all_databases(services, db_config=None, write_fn=None):
    """
    Provisions databases for all services that need them.
    
    Iterates through all services, finds ones with databaseName in manifest,
    and generates provisioning configs for each.
    
    Returns: dict of {resource_name: provisioning_config}
    """
    provisioning = {}
    
    for service in services:
        manifest = service.get("_manifest", {})
        db_name = manifest.get("databaseName", "")
        
        if db_name:
            resource_name = service.get("name", manifest.get("appName", "unknown"))
            resource_path = service.get("path", "")
            
            config = generate_database_provisioning_resource(
                resource_name,
                db_name,
                db_config,
                None,  # Don't write yet, collect all first
            )
            
            provisioning[resource_name] = config
    
    # Write master report
    master_report = {
        "timestamp": _get_timestamp(),
        "databases_provisioned": len(provisioning),
        "services": list(provisioning.keys()),
    }
    
    if write_fn:
        write_fn("database-provisioning-master.json", Utils.encode_json(master_report))
        
        # Write individual configs
        for resource_name, config in provisioning.items():
            resource_dir = "provisioning/{}/".format(resource_name)
            for filename, content in config.files.items():
                write_fn(resource_dir + filename, content)
    
    # Print summary
    print("")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     🗄️  DATABASE PROVISIONING SUMMARY                         ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print("║  Databases to Provision: {:<35} ║".format(len(provisioning)))
    print("╠══════════════════════════════════════════════════════════════╣")
    for resource_name, config in provisioning.items():
        db_name = config.provisioning.db_name
        print("║  • {:<25} → {:<25} ║".format(resource_name, db_name))
    print("╚══════════════════════════════════════════════════════════════╝")
    print("")
    
    return provisioning

# =============================================================================
# Exports
# =============================================================================

DatabaseProvisioner = struct(
    # Configuration
    DEFAULT_DB_CONFIG=DEFAULT_DB_CONFIG,
    DB_NAME_PREFIX=DB_NAME_PREFIX,
    
    # Provisioning
    provision_database_for_service=provision_database_for_service,
    generate_database_provisioning_resource=generate_database_provisioning_resource,
    provision_all_databases=provision_all_databases,
    
    # Validation
    validate_database_credentials=validate_database_credentials,
    generate_database_validation_report=generate_database_validation_report,
    
    # Scripts
    generate_db_readiness_script=generate_db_readiness_script,
    generate_prisma_migrate_script=generate_prisma_migrate_script,
)

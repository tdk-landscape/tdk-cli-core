# =============================================================================
# 🏗️ TILT SDK - GOLDEN IMAGE BUILDERS
# =============================================================================

load('./golden_image_constants.star', 'GOLDEN_DOCKERFILE', 'GOLDEN_IMAGE_PREFIX')


def build_golden_layers(project_root='.'):
    """
    Build all golden layer images using local_resource.
    Returns the resource name for dependency tracking.

    project_root: path back to the project root from wherever
    local_resource cmds actually run (the Tiltfile's own directory,
    .tdk/.tdk-out/ - not the project root), e.g. '../../'. GOLDEN_DOCKERFILE
    is itself project-root-relative, so it must be prefixed with this to
    resolve correctly - passing project_root='.' (the default) only works
    when the Tiltfile happens to live at the project root.
    """
    resource_name = 'golden-layers-build'
    dockerfile_from_tiltfile = (
        GOLDEN_DOCKERFILE if project_root in (None, '.', '')
        else project_root.rstrip('/') + '/' + GOLDEN_DOCKERFILE
    )

    build_cmd = """
echo "🏗️  Building golden layered images (8 total)..."
echo "  📦 L1: OS base + runtime"
echo "  📦 L2: Dependencies"
echo "  📦 L3-Backend: Backend build tools (Prisma)"
echo "  📦 L3-Frontend: Frontend build tools"
echo "  📦 L3-Migrator: Migrator build tools (Prisma)"
echo "  📦 L4-Backend: Backend runtime"
echo "  📦 L4-Frontend: Frontend runtime"
echo "  📦 L4-Migrator: Migrator runtime"

docker build -f {dockerfile} \\
  --target l1_golden -t {prefix}-l1:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l2_golden -t {prefix}-l2:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l3_backend_golden -t {prefix}-l3-backend:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l3_frontend_golden -t {prefix}-l3-frontend:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l3_migrator_golden -t {prefix}-l3-migrator:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l4_backend_bun -t {prefix}-l4-backend:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l4_backend_node -t {prefix}-l4-backend-node:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l4_frontend_golden -t {prefix}-l4-frontend:{tag} {context} && \\
docker build -f {dockerfile} \\
  --target l4_migrator_golden -t {prefix}-l4-migrator:{tag} {context}

echo "✅ Golden layers built (9 images):"
echo "  ✓ {prefix}-l1:{tag}"
echo "  ✓ {prefix}-l2:{tag}"
echo "  ✓ {prefix}-l3-backend:{tag}"
echo "  ✓ {prefix}-l3-frontend:{tag}"
echo "  ✓ {prefix}-l3-migrator:{tag}"
echo "  ✓ {prefix}-l4-backend:{tag} (Bun - 128MB)"
echo "  ✓ {prefix}-l4-backend-node:{tag} (Node.js - 20MB, LIGHTWEIGHT)"
echo "  ✓ {prefix}-l4-frontend:{tag}"
echo "  ✓ {prefix}-l4-migrator:{tag}"
""".format(
        dockerfile=dockerfile_from_tiltfile,
        prefix=GOLDEN_IMAGE_PREFIX,
        tag='latest',
        context=project_root,
    ).strip()

    local_resource(
        resource_name,
        cmd=build_cmd,
        labels=['infra.docker', 'golden-layers'],
        deps=[dockerfile_from_tiltfile],
        allow_parallel=True,
        auto_init=True,
    )

    return resource_name

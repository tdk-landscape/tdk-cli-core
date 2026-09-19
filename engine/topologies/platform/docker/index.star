load(
    "./dockerfile/dockerfile.star",
    "generate_frontend_dockerfile",
    "generate_app_dockerfile",
    "generate_migrator_dockerfile",
)
load("./config/dockerignore.star", "generate_dockerignore")
load(
    "./compose/compose.star",
    "generate_frontend_compose",
    "generate_backend_compose_entry",
    "generate_app_compose_from_entries",
    "generate_migrator_compose",
)
load("./build/golden_image.star", "GoldenImage")

Docker = struct(
    frontend = generate_frontend_dockerfile,
    backend = generate_app_dockerfile,
    migrator = generate_migrator_dockerfile,
    generate_dockerignore = generate_dockerignore,
    frontend_compose = generate_frontend_compose,
    backend_compose = generate_backend_compose_entry,
    app_compose = generate_app_compose_from_entries,
    migrator_compose = generate_migrator_compose,
    golden_image = GoldenImage,
)

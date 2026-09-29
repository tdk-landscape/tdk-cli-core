"""Regression checks for generated environment files on BYO resources."""

from pathlib import Path

import pytest

pytestmark = [pytest.mark.fast, pytest.mark.generator]


def test_byo_manifest_has_resource_path_before_env_generation():
    source = (
        Path(__file__).resolve().parents[2]
        / "engine"
        / "topologies"
        / "tilt"
        / "resources"
        / "orchestrator"
        / "generators"
        / "manifest_resource.star"
    ).read_text()
    function_start = source.index("def _generate_all_configs_for_resource(")
    function_end = source.index("\ndef _generate_yaml_manifest(", function_start)
    function = source[function_start:function_end]

    resource_path_assignment = "manifest['_resource_path'] = resource_path"
    byo_fast_path = "if manifest.get('appType') == 'bring-your-own':"
    env_generation = "_generate_env_file(manifest, backend_manifest, write_file)"

    assert function.index(resource_path_assignment) < function.index(byo_fast_path)
    assert function.index(byo_fast_path) < function.index(env_generation)


def test_byo_compose_build_uses_service_directory_as_context():
    source = (
        Path(__file__).resolve().parents[2]
        / "engine"
        / "topologies"
        / "platform"
        / "docker"
        / "compose"
        / "compose.star"
    ).read_text()
    function_start = source.index("def _generate_single_backend_entry(")
    byo_start = source.index(
        "if manifest and manifest.get('appType') == 'bring-your-own':",
        function_start,
    )
    byo_end = source.index("\n    else:", byo_start)
    byo_branch = source[byo_start:byo_end]

    assert "build_context = context_prefix + '/' + full_resource_path" in byo_branch
    assert "context: {build_context}" in byo_branch
    assert "dockerfile: {dockerfile}" in byo_branch
    assert "compose_build_config(" not in byo_branch

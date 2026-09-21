"""Standalone TDK projects must serve api.{project}.localhost via Traefik."""

from pathlib import Path

import pytest

pytestmark = [pytest.mark.fast, pytest.mark.generator]

REPO_ROOT = Path(__file__).resolve().parents[2]


def test_standalone_traefik_compose_generator_exists():
    source = (
        REPO_ROOT
        / "engine"
        / "topologies"
        / "platform"
        / "docker"
        / "compose"
        / "traefik_standalone.star"
    ).read_text()
    assert "generate_standalone_traefik_compose" in source
    assert "entrypoints.web.address=:80" in source


def test_infra_loader_falls_back_to_standalone_traefik():
    source = (
        REPO_ROOT
        / "engine"
        / "topologies"
        / "tilt"
        / "resources"
        / "infra-loader.star"
    ).read_text()
    assert "_load_standalone_traefik" in source
    assert "using standalone Traefik" in source


def test_project_router_uses_cli_api_path():
    source = (
        REPO_ROOT
        / "engine"
        / "topologies"
        / "platform"
        / "docker"
        / "networking"
        / "traefik_helpers.star"
    ).read_text()
    assert "def cli_api_path(" in source
    assert "tdk up" in source


def test_tiltfile_keeps_traefik_in_focus_mode():
    source = (REPO_ROOT / "cli" / "templates" / "Tiltfile.hbs").read_text()
    assert "'traefik'" in source
    assert "init-networks" in source


def _infra_loader_source() -> str:
    return (
        REPO_ROOT
        / "engine"
        / "topologies"
        / "tilt"
        / "resources"
        / "infra-loader.star"
    ).read_text()


def test_standalone_traefik_checks_for_port_conflict_before_compose_up():
    """Two standalone TDK projects both generate Traefik with hardcoded host
    ports 80/8080 (so api.{project}.localhost works without a port suffix), so
    only one can bind port 80 at a time. Without a preflight check, starting a
    second project while another's Traefik is still running fails deep inside
    `docker compose up` with a cryptic "port is already allocated" networking
    error instead of a clear, actionable message.
    """
    source = _infra_loader_source()
    assert "_check_traefik_port_conflict" in source

    # The check must run before docker_compose() is invoked for the standalone
    # Traefik compose, not after. Search from the function body (not its
    # definition line, which also contains the substring "...port_conflict()").
    load_standalone_def = source.index("def _load_standalone_traefik(")
    check_call = source.index("_check_traefik_port_conflict()", load_standalone_def)
    docker_compose_call = source.index("_docker_compose(compose_file, env_file)", load_standalone_def)
    assert load_standalone_def < check_call < docker_compose_call


def test_traefik_port_conflict_check_inspects_docker_and_fails_clearly():
    source = _infra_loader_source()
    check_start = source.index("def _check_traefik_port_conflict():")
    check_body = source[check_start:source.index("def _load_standalone_traefik(")]

    # Detects other containers publishing the ports this project's Traefik needs.
    assert "docker ps" in check_body
    assert "publish=80" in check_body
    assert "publish=8080" in check_body

    # Must not flag this project's own (already-running) Traefik as a conflict.
    assert "PlatformDockerConstants.PROJECT_NAME" in check_body
    assert "!= own_container" in check_body or "own_container" in check_body

    # Fails fast with actionable remediation rather than letting the raw
    # docker/Tilt networking error surface.
    assert "fail(" in check_body
    assert "docker stop" in check_body

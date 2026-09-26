"""Standalone TDK projects must serve api.{project}.localhost via Traefik."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

pytestmark = [pytest.mark.fast, pytest.mark.generator]

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSE_DIR = REPO_ROOT / "engine" / "topologies" / "platform" / "docker" / "compose"
RESULT_MARKER = "Error in fail: RESULT"


def _run_starlark(tmp_path: Path, body: str) -> dict:
    tiltfile = tmp_path / "Tiltfile"
    tiltfile.write_text(body.replace("@COMPOSE", str(COMPOSE_DIR)) + "\nfail('RESULT' + encode_json(r))\n")
    proc = subprocess.run(
        ["tilt", "alpha", "tiltfile-result", "-f", str(tiltfile)],
        capture_output=True,
        text=True,
        timeout=180,
    )
    output = proc.stdout + proc.stderr
    assert RESULT_MARKER in output, output[-3000:]
    return json.loads(output.split(RESULT_MARKER, 1)[1].strip())


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


def test_standalone_traefik_stops_conflicting_container_before_compose_up():
    """Two standalone TDK projects both generate Traefik with hardcoded host
    ports 80/8080 (so api.{project}.localhost works without a port suffix), so
    only one can bind port 80 at a time. `tdk up` on a new project must take
    over the port from a stale Traefik left running by a previous project
    rather than letting `docker compose up` die deep inside Tilt with a
    cryptic "port is already allocated" networking error.
    """
    source = _infra_loader_source()
    assert "_stop_conflicting_traefik" in source

    # The takeover must run before docker_compose() is invoked for the
    # standalone Traefik compose, not after. Search from the function body
    # (not its definition line, which also contains the substring
    # "..._traefik()").
    load_standalone_def = source.index("def _load_standalone_traefik(")
    stop_call = source.index("_stop_conflicting_traefik()", load_standalone_def)
    docker_compose_call = source.index("_docker_compose(compose_file, env_file)", load_standalone_def)
    assert load_standalone_def < stop_call < docker_compose_call


def test_traefik_conflict_takeover_stops_other_project_and_logs_it():
    source = _infra_loader_source()
    stop_start = source.index("def _stop_conflicting_traefik():")
    stop_body = source[stop_start:source.index("def _load_standalone_traefik(")]

    # Detects other containers publishing the ports this project's Traefik needs.
    assert "docker ps" in stop_body
    assert "publish=80" in stop_body
    assert "publish=8080" in stop_body

    # Must not stop this project's own (already-running) Traefik.
    assert "PlatformDockerConstants.PROJECT_NAME" in stop_body
    assert "own_container" in stop_body

    # Actually stops the other project's container and logs what was stopped,
    # instead of just erroring out.
    assert "docker stop" in stop_body
    assert "print(" in stop_body


@pytest.mark.skipif(shutil.which("tilt") is None, reason="tilt CLI not installed")
def test_standalone_compose_enables_file_provider_and_wake_gateway(tmp_path):
    """openspec/changes/prioritized-cold-start (D4): a `sablier.deferStart`
    resource's static route needs Traefik's file provider enabled and a wake
    gateway running, even in a landscape with no such resource yet (harmless:
    an empty dynamic directory yields zero extra routes)."""
    r = _run_starlark(
        tmp_path,
        "load('@COMPOSE/traefik_standalone.star', 'generate_standalone_traefik_compose')\n"
        "r = {'yaml': generate_standalone_traefik_compose()}\n",
    )
    yaml_text = r["yaml"]
    assert "--providers.file.directory=/etc/traefik/dynamic" in yaml_text
    assert "--providers.file.watch=true" in yaml_text
    assert "/etc/traefik/dynamic:ro" in yaml_text
    assert "wake-gateway:" in yaml_text
    assert "/root/.tilt-dev:ro" in yaml_text

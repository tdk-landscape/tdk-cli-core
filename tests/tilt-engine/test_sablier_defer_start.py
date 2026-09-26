"""
sablier.deferStart: schema field and its enable-required cross-field rule.

Executes the real Starlark validator through Tilt's interpreter
(`tilt alpha tiltfile-result`) instead of inspecting source text.
Spec: openspec/changes/prioritized-cold-start/specs/on-demand-resource-startup/spec.md
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

pytestmark = [
    pytest.mark.generator,
    pytest.mark.skipif(shutil.which("tilt") is None, reason="tilt CLI not installed"),
]

MANIFEST_DIR = Path(__file__).resolve().parents[2] / "engine" / "topologies" / "tilt" / "manifest"
ORCHESTRATOR_DIR = Path(__file__).resolve().parents[2] / "engine" / "topologies" / "tilt" / "resources" / "orchestrator"
RESULT_MARKER = "Error in fail: RESULT"


def run_starlark(tmp_path: Path, body: str) -> dict:
    """Run `body` in a Tiltfile; `body` must assign a dict to `r`. `@MANIFEST`/`@ORCHESTRATOR` are module dirs."""
    tiltfile = tmp_path / "Tiltfile"
    tiltfile.write_text(
        body.replace("@MANIFEST", str(MANIFEST_DIR)).replace("@ORCHESTRATOR", str(ORCHESTRATOR_DIR))
        + "\nfail('RESULT' + encode_json(r))\n"
    )
    proc = subprocess.run(
        ["tilt", "alpha", "tiltfile-result", "-f", str(tiltfile)],
        capture_output=True,
        text=True,
        timeout=180,
    )
    output = proc.stdout + proc.stderr
    assert RESULT_MARKER in output, output[-3000:]
    return json.loads(output.split(RESULT_MARKER, 1)[1].strip())


def validate_sablier(tmp_path: Path, sablier: dict | None) -> dict:
    manifest = {"appType": "backend", "stack": "test"}
    if sablier is not None:
        manifest["sablier"] = sablier
    return run_starlark(
        tmp_path,
        "load('@MANIFEST/validator.star', 'ManifestValidator')\n"
        f"manifest = {manifest!r}\n"
        "result = ManifestValidator.validate(manifest, level='cross_field')\n"
        "r = {'valid': result.valid, 'errors': [e.message for e in result.errors]}\n",
    )


@pytest.mark.parametrize(
    "sablier",
    [
        None,
        {"enable": False},
        {"enable": True},
        {"enable": True, "deferStart": True},
        {"enable": True, "deferStart": False},
    ],
)
def test_defer_start_with_enable_is_valid(tmp_path, sablier):
    r = validate_sablier(tmp_path, sablier)
    assert r["valid"], r["errors"]


def test_defer_start_without_enable_is_rejected(tmp_path):
    r = validate_sablier(tmp_path, {"deferStart": True})
    assert not r["valid"]
    assert any("deferStart" in e and "enable" in e for e in r["errors"]), r["errors"]


def test_defer_start_with_enable_false_is_rejected(tmp_path):
    r = validate_sablier(tmp_path, {"enable": False, "deferStart": True})
    assert not r["valid"]
    assert any("deferStart" in e and "enable" in e for e in r["errors"]), r["errors"]


def resource_defers_start(tmp_path: Path, sablier: dict | None) -> bool:
    manifest = {"appType": "backend", "stack": "test"}
    if sablier is not None:
        manifest["sablier"] = sablier
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'resource_defers_start')\n"
        f"manifest = {manifest!r}\n"
        "r = {'defers': resource_defers_start(manifest)}\n",
    )
    return result["defers"]


@pytest.mark.parametrize(
    ("sablier", "expected"),
    [
        (None, False),
        ({}, False),
        ({"enable": False}, False),
        ({"enable": True}, False),
        ({"enable": False, "deferStart": True}, False),
        ({"enable": True, "deferStart": False}, False),
        ({"enable": True, "deferStart": True}, True),
    ],
)
def test_resource_defers_start_predicate(tmp_path, sablier, expected):
    assert resource_defers_start(tmp_path, sablier) == expected

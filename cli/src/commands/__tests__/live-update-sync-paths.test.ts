import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const registration = readFileSync(
  join(
    repoRoot,
    "engine",
    "topologies",
    "tilt",
    "resources",
    "orchestrator",
    "apply_compose_resource_registration.star",
  ),
  "utf-8",
);

// Tilt resolves sync() local paths against the Tiltfile directory (.tdk/.tdk-out), not the
// docker_build context. A project-relative path never matches the changed files, so every
// edit fell back to a full rebuild ("Found file(s) not matching any sync").
it("anchors live-update sync sources at the project root", () => {
  expect(registration).toContain(
    "def _live_update_sync_source(project_root, full_res_path, sync_path)",
  );
  expect(registration).toContain("return project_root.rstrip('/') + '/' + relative_path");
  expect(registration).toContain(
    "full_sync_path = _live_update_sync_source(project_root, full_res_path, sync_path)",
  );
});

it("passes the project root from the resource config into the live-update rules", () => {
  expect(registration).toMatch(
    /_build_live_update_rules\(\s*config\['res_path'\],\s*config\['res_path'\],\s*config\['syncs'\],\s*config\.get\('project_root', ''\),?\s*\)/,
  );
});

it("keeps the container destination under /app, independent of the host project root", () => {
  expect(registration).toContain("dest = '/app/' + full_res_path + '/' + sync_path");
});

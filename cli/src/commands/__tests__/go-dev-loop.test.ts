import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const languageDockerfile = join(
  repoRoot,
  "engine/topologies/platform/docker/dockerfile/language_dockerfile.star",
);
const hasTilt = spawnSync("tilt", ["version"], { encoding: "utf-8" }).status === 0;
if (process.env.TDK_REQUIRE_TILT === "1" && !hasTilt) {
  throw new Error("Tilt is required for the Go dev loop Starlark tests in CI.");
}

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function evaluate(source: string) {
  const dir = mkdtempSync(join(tmpdir(), "tdk-go-dev-"));
  dirs.push(dir);
  const tiltfile = join(dir, "Tiltfile");
  writeFileSync(tiltfile, source);
  return spawnSync("tilt", ["alpha", "tiltfile-result", "-f", tiltfile], {
    cwd: repoRoot,
    encoding: "utf-8",
    timeout: 20000,
  });
}

// Opt-in Go development loop (#369): a `development` Docker target that rebuilds and restarts on `.go` edits.
describe.skipIf(!hasTilt)("Go development Dockerfile", { timeout: 30_000 }, () => {
  it("adds a development target with a watcher and build caches, and leaves the default Dockerfile unchanged", () => {
    const result =
      evaluate(`load(${JSON.stringify(languageDockerfile)}, 'generate_language_dockerfile')
default = generate_language_dockerfile('services/shop/orders', 'go', 4100)
dev = generate_language_dockerfile('services/shop/orders', 'go', 4100, True)
if 'AS development' in default: fail('the default Go Dockerfile must not gain a development target')
if 'air' in default: fail('the default Go Dockerfile must not mention the watcher')
if 'AS development' not in dev: fail('missing development target')
if 'cosmtrek/air' not in dev and 'air-verse/air' not in dev: fail('the watcher (Air) is not installed')
if '--mount=type=cache,target=/go/pkg/mod' not in dev: fail('missing Go module cache mount')
if 'RUN go build -o /tmp/app .' not in dev: fail('the image must prime the Go build cache (a RUN, not a cache mount, so the warm cache is kept in the image the watcher runs from)')
if 'go mod download' not in dev: fail('dependencies must be installed in their own layer so edits do not redownload them')
if 'AS production' not in dev: fail('the production target must remain available')
if 'EXPOSE 4100' not in dev: fail('port contract changed')
`);
    expect(result.status, result.stderr).toBe(0);
  });

  it("does not offer a development target for other languages", () => {
    const result =
      evaluate(`load(${JSON.stringify(languageDockerfile)}, 'generate_language_dockerfile')
for lang in ['python', 'rust']:
    plain = generate_language_dockerfile('services/shop/orders', lang, 4100)
    flagged = generate_language_dockerfile('services/shop/orders', lang, 4100, True)
    if plain != flagged: fail(lang + ' output must not change when dev is requested')
`);
    expect(result.status, result.stderr).toBe(0);
  });
});

const read = (...parts: string[]) => readFileSync(join(repoRoot, ...parts), "utf-8");
const registration = read(
  "engine/topologies/tilt/resources/orchestrator/apply_compose_resource_registration.star",
);
const tsBuilder = read("engine/topologies/tilt/resources/orchestrator/builders/typescript.star");
const manifestResource = read(
  "engine/topologies/tilt/resources/orchestrator/generators/manifest_resource.star",
);

describe.skipIf(!hasTilt)("Go live reload switch", { timeout: 30_000 }, () => {
  it("is on only for a Go service with dev.liveReload true", () => {
    const result = evaluate(`load(${JSON.stringify(languageDockerfile)}, 'go_live_reload_enabled')
if not go_live_reload_enabled({'language': 'go', 'dev': {'liveReload': True}}): fail('go + liveReload must enable it')
if go_live_reload_enabled({'language': 'go'}): fail('default must stay off')
if go_live_reload_enabled({'language': 'go', 'dev': {'liveReload': False}}): fail('false must stay off')
if go_live_reload_enabled({'language': 'python', 'dev': {'liveReload': True}}): fail('only Go is supported')
if go_live_reload_enabled({'dev': {'liveReload': True}}): fail('a missing language is Bun')
if go_live_reload_enabled({'language': 'go', 'dev': 'yes'}): fail('a malformed dev block must not enable it')
if go_live_reload_enabled(None): fail('no manifest must not enable it')
`);
    expect(result.status, result.stderr).toBe(0);
  });
});

// The engine wiring is checked as source text, like live-update-sync-paths.test.ts: these paths need Tilt's
// docker_build and live_update objects, which a unit evaluation cannot create.
describe("Go development wiring", () => {
  it("generates the development Dockerfile target only when the switch is on", () => {
    expect(manifestResource).toContain("dev=Docker.go_live_reload(manifest)");
  });

  it("builds the development target in Tilt instead of production when the switch is on", () => {
    expect(tsBuilder).toContain(
      "def _build_typescript_service(name, context, dockerfile, live_update_rules, deps, env=None, target='production')",
    );
    expect(tsBuilder).toContain("target=target,");
    expect(registration).toContain(
      "target = 'development' if Docker.go_live_reload(config.get('manifest', {})) else 'production'",
    );
  });

  it("syncs the Go sources and falls back to a rebuild for go.mod, go.sum and the Dockerfile", () => {
    expect(registration).toContain("fall_back_on(");
    expect(registration).toContain("'go.mod'");
    expect(registration).toContain("'go.sum'");
    // Without the switch Go still has no live-update rules.
    expect(registration).toContain(
      "if language == 'rust' or (language == 'go' and not go_live_reload):",
    );
    expect(
      registration.indexOf("if language == 'rust' or (language == 'go' and not go_live_reload):"),
    ).toBeLessThan(registration.indexOf("live_update_rules.append(sync(full_sync_path, dest))"));
  });
});

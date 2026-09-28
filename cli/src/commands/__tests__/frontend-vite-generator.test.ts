import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const frontendGenerator = join(
  repoRoot,
  "engine",
  "topologies",
  "tilt",
  "generators",
  "vite",
  "frontend.star",
);
const frontendTsconfigGenerator = join(
  repoRoot,
  "engine",
  "topologies",
  "tilt",
  "generators",
  "typescript",
  "frontend_tsconfig.star",
);
const frontendValidators = join(
  repoRoot,
  "engine",
  "topologies",
  "tilt",
  "generators",
  "validators.star",
);
const hasTilt = spawnSync("tilt", ["version"], { encoding: "utf-8" }).status === 0;
const temporaryDirs: string[] = [];

it("registers Vue Vite templates at the shared Starlark generator paths", () => {
  const generator = readFileSync(frontendGenerator, "utf-8");
  const vueTemplates = readFileSync(
    join(dirname(frontendGenerator), "frameworks", "vue.star"),
    "utf-8",
  );

  expect(generator).toContain("load('./frameworks/vue.star'");
  expect(generator).toContain("'vue': {");
  expect(generator).toContain("manifest.get('framework', 'react')");
  expect(generator).toContain("VITE_FRONTEND_CONFIG_PATH");
  expect(generator).toContain("VITE_FRONTEND_BUILD_CONFIG_PATH");
  expect(vueTemplates).toContain("VUE_VITE_FRONTEND =");
  expect(vueTemplates).toContain("VUE_VITE_FRONTEND_BUILD =");
  expect(vueTemplates.match(/@vitejs\/plugin-vue/g)).toHaveLength(2);
  expect(vueTemplates).not.toContain("@vitejs/plugin-react");
});

it("passes the persisted framework to the shared frontend TypeScript generator", () => {
  const orchestrator = readFileSync(
    join(
      repoRoot,
      "engine",
      "topologies",
      "tilt",
      "resources",
      "orchestrator",
      "generators",
      "manifest_resource.star",
    ),
    "utf-8",
  );
  expect(orchestrator.match(/framework=manifest\.get\('framework', 'react'\)/g)).toHaveLength(2);
  expect(readFileSync(frontendTsconfigGenerator, "utf-8")).toContain("if framework == 'react':");
});

it("selects the framework entry in generated frontend health checks", () => {
  const validators = readFileSync(frontendValidators, "utf-8");
  expect(validators).toContain('manifest.get("framework", "react") == "vue"');
  expect(validators).toContain('"frontend": ["package.json", "index.html", frontend_entry]');
});

function evaluateTiltfile(source: string) {
  const directory = mkdtempSync(join(tmpdir(), "tdk-vite-generator-"));
  temporaryDirs.push(directory);
  const tiltfile = join(directory, "Tiltfile");
  writeFileSync(tiltfile, source);
  return spawnSync("tilt", ["alpha", "tiltfile-result", "-f", tiltfile], {
    cwd: repoRoot,
    encoding: "utf-8",
    timeout: 20000,
  });
}

afterEach(() => {
  for (const directory of temporaryDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe.skipIf(!hasTilt)("Starlark frontend Vite generator", () => {
  it("uses the same React configs for explicit and legacy manifests at generated paths", () => {
    const result =
      evaluateTiltfile(`load(${JSON.stringify(frontendGenerator)}, 'generate_frontend', 'VITE_FRONTEND_CONFIG_PATH', 'VITE_FRONTEND_BUILD_CONFIG_PATH')
manifest = {'appType': 'frontend', 'appName': 'storefront', 'stack': 'shop', 'port': 3000, '_resource_path': 'apps/storefront'}
legacy_files = {}
def write_legacy(path, content):
    legacy_files[path] = content
legacy_config = generate_frontend(manifest, write_fn=write_legacy)
explicit_files = {}
def write_explicit(path, content):
    explicit_files[path] = content
explicit = dict(manifest)
explicit['framework'] = 'react'
explicit_config = generate_frontend(explicit, write_fn=write_explicit)
if legacy_config != explicit_config: fail('legacy React dev config changed')
if legacy_files != explicit_files: fail('legacy React generated files changed')
if len(legacy_files) != 2: fail('expected exactly two generated Vite configs')
if 'apps/storefront' + VITE_FRONTEND_CONFIG_PATH not in legacy_files: fail('missing dev config')
if 'apps/storefront' + VITE_FRONTEND_BUILD_CONFIG_PATH not in legacy_files: fail('missing build config')
if "@vitejs/plugin-react" not in legacy_config: fail('missing React plugin')
if "@vitejs/plugin-react" not in legacy_files['apps/storefront' + VITE_FRONTEND_BUILD_CONFIG_PATH]: fail('missing React build plugin')
`);

    expect(result.status, result.stderr).toBe(0);
  });

  it("rejects an unknown framework before writing Vite configs", () => {
    const result = evaluateTiltfile(`load(${JSON.stringify(frontendGenerator)}, 'generate_frontend')
def reject_writes(path, content):
    fail('unexpected write before framework validation')
generate_frontend({'appType': 'frontend', 'appName': 'storefront', 'framework': 'svelte'}, write_fn=reject_writes)
`);

    expect(result.status).toBe(5);
    expect(result.stderr).toContain("Unknown frontend framework for Vite generation: svelte");
    expect(result.stderr).not.toContain("unexpected write before framework validation");
  });

  it("selects Vue plugin in both generated configs and retains shared runtime settings", () => {
    const result =
      evaluateTiltfile(`load(${JSON.stringify(frontendGenerator)}, 'generate_frontend', 'VITE_FRONTEND_CONFIG_PATH', 'VITE_FRONTEND_BUILD_CONFIG_PATH')
manifest = {'appType': 'frontend', 'framework': 'vue', 'appName': 'storefront', 'stack': 'shop', 'port': 3100, '_resource_path': 'apps/storefront'}
files = {}
def write_config(path, content):
    files[path] = content
generate_frontend(manifest, write_fn=write_config)
if len(files) != 2: fail('expected exactly two generated Vue Vite configs')
dev_path = 'apps/storefront' + VITE_FRONTEND_CONFIG_PATH
build_path = 'apps/storefront' + VITE_FRONTEND_BUILD_CONFIG_PATH
if dev_path not in files or build_path not in files: fail('Vue config paths differ from React')
for content in files.values():
    if "@vitejs/plugin-vue" not in content: fail('missing Vue plugin')
    if "@vitejs/plugin-react" in content: fail('React plugin leaked into Vue config')
    if "base: '/storefront/'" not in content: fail('missing shared base path')
    if "'@': resolve(__dirname, '../src')" not in content: fail('missing source alias')
if "port: 3100" not in files[dev_path]: fail('missing shared dev port')
if 'proxy:' not in files[dev_path]: fail('missing shared proxy')
`);

    expect(result.status, result.stderr).toBe(0);
  });
});

describe.skipIf(!hasTilt)("Starlark frontend TypeScript generator", () => {
  it("preserves legacy React JSX and omits it for Vue Docker builds", () => {
    const result =
      evaluateTiltfile(`load(${JSON.stringify(frontendTsconfigGenerator)}, 'generate_frontend_tsconfig')
legacy = {}
def write_legacy(path, content):
    legacy[path] = content
generate_frontend_tsconfig('apps/storefront', write_legacy, is_docker=True)
react = {}
def write_react(path, content):
    react[path] = content
generate_frontend_tsconfig('apps/storefront', write_react, is_docker=True, framework='react')
vue = {}
def write_vue(path, content):
    vue[path] = content
generate_frontend_tsconfig('apps/storefront', write_vue, is_docker=True, framework='vue')
if legacy != react: fail('legacy React TypeScript config changed')
if len(vue) != 1: fail('expected one Docker TypeScript config')
path = list(vue.keys())[0]
if path not in react: fail('Vue Docker TypeScript config path differs from React')
react_config = decode_json(react[path])
vue_config = decode_json(vue[path])
if react_config['compilerOptions'].get('jsx') != 'react-jsx': fail('missing React JSX setting')
if 'jsx' in vue_config['compilerOptions']: fail('React JSX leaked into Vue config')
if vue_config['compilerOptions']['types'] != ['node']: fail('shared Node types changed')
if vue_config['compilerOptions']['moduleResolution'] != 'bundler': fail('frontend resolution must support current TypeScript')
`);

    expect(result.status, result.stderr).toBe(0);
  });
});

describe.skipIf(!hasTilt)("Starlark frontend health check", () => {
  it("requires main.ts for Vue and main.tsx for legacy React", () => {
    const result =
      evaluateTiltfile(`load(${JSON.stringify(frontendValidators)}, 'generate_resource_health_check')
vue = generate_resource_health_check('web', 'apps/web', {'appType': 'frontend', 'framework': 'vue'}, {})
if 'src/main.tsx' in vue or 'src/main.ts' not in vue: fail('Vue entry check is wrong')
react = generate_resource_health_check('web', 'apps/web', {'appType': 'frontend'}, {})
if 'src/main.tsx' not in react: fail('legacy React entry check is wrong')
`);

    expect(result.status, result.stderr).toBe(0);
  });
});

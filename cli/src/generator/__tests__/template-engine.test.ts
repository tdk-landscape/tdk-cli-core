import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTemplate } from "../template-engine.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const readEngine = (rel: string) => fs.readFileSync(path.join(repoRoot, "engine", rel), "utf-8");

// Real template files, keyed by a substring that only appears in that specific
// file - regression coverage for the bug where loadTemplate joined a candidate
// *directory* (not the file) and silently fell through every candidate.
const REAL_TEMPLATES: Record<string, string> = {
  "TILT_RESOURCE_DEFAULTS.star.hbs": "get_resource_defaults",
  "TILT_TECH_STACK.star.hbs": "get_tech_stack",
  "Tiltfile.hbs": "Tiltfile",
  ".tiltignore.hbs": "TILT IGNORE FILE",
  "spec.master.hbs": "spec.master",
};

describe("template-engine", () => {
  describe("loadTemplate", () => {
    for (const [filename, marker] of Object.entries(REAL_TEMPLATES)) {
      it(`should load ${filename} and return its own content`, () => {
        const content = loadTemplate(filename);
        expect(typeof content).toBe("string");
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain(marker);
      });
    }

    it("should return distinct content for each template (not the same file/dir every time)", () => {
      const contents = Object.keys(REAL_TEMPLATES).map((filename) => loadTemplate(filename));
      expect(new Set(contents).size).toBe(contents.length);
    });

    it("Tiltfile passes the golden-layers resource to app resources via TILT_CONTEXT", () => {
      // Regression: Infra.load_all() returns the golden-layers-build resource name, and app
      // and migrator resources add it to resource_deps only if ctx['golden_image_resource']
      // is set. The template dropped it, so service image builds started before their base
      // images existed, failed with "pull access denied", and Tilt never retried - a clean
      // machine 404'd forever while any machine that had built the layers before worked.
      const tiltfile = loadTemplate("Tiltfile.hbs");
      expect(tiltfile).toMatch(/GOLDEN_IMAGE_RESOURCE\s*=\s*Infra\.load_all\(/);
      expect(tiltfile).toMatch(/'golden_image_resource':\s*GOLDEN_IMAGE_RESOURCE/);
    });

    it("standalone Traefik only starts sablier and wake-gateway when Sablier is licensed", () => {
      // Regression: the standalone compose always started the sablier container (read-write
      // Docker socket), built and ran the wake gateway, and had Traefik download the Sablier
      // plugin from GitHub - for every free-tier user, who cannot use any of it. The license
      // only gated the per-service labels. (Verified by loading the Tiltfile: free tier
      // renders only `traefik`; forcing the flag on renders all three.)
      const compose = readEngine("topologies/platform/docker/compose/traefik_standalone.star");
      expect(compose).toMatch(
        /def generate_standalone_traefik_compose\(sablier_enabled\s*=\s*False\)/,
      );
      for (const marker of [
        "  sablier:\n",
        "  wake-gateway:\n",
        "--experimental.plugins.sablier",
      ]) {
        const at = compose.indexOf(marker);
        expect(at, marker).toBeGreaterThan(-1);
        const guard = compose.lastIndexOf("_SABLIER_", at);
        // each only lives inside a _SABLIER_* constant, which is emitted conditionally
        expect(guard, marker).toBeGreaterThan(-1);
        expect(compose.slice(0, guard)).toContain("def generate_standalone_traefik_compose");
      }
      expect(compose).toMatch(/if sablier_enabled else ""/);

      const loader = readEngine("topologies/tilt/resources/infra-loader.star");
      expect(loader).toMatch(/generate_standalone_traefik_compose\(sablier_enabled\)/);
      expect(loader).toMatch(/sablier_middleware_suffix\(\{"sablier":\s*\{"enable":\s*True\}\}/);
    });

    it("should throw (not silently return directory bytes) for non-existent template", () => {
      expect(() => loadTemplate("non-existent.hbs")).toThrow("Failed to load template");
    });

    describe("executable-relative fallback (compiled binary layout)", () => {
      let fakeExecDir: string;
      let originalExecPath: string;

      beforeEach(() => {
        // Mirrors what scripts/release-binaries.sh bundles next to the
        // compiled binary: <exeDir>/tdk-cli/cli/templates/<filename>.
        fakeExecDir = fs.mkdtempSync(path.join(os.tmpdir(), "tdk-exec-"));
        const bundledTemplatesDir = path.join(fakeExecDir, "tdk-cli", "cli", "templates");
        fs.mkdirSync(bundledTemplatesDir, { recursive: true });
        fs.writeFileSync(path.join(bundledTemplatesDir, "only-in-bundle.hbs"), "bundled-marker");

        originalExecPath = process.execPath;
        Object.defineProperty(process, "execPath", {
          value: path.join(fakeExecDir, "tdk"),
          configurable: true,
        });
      });

      afterEach(() => {
        Object.defineProperty(process, "execPath", {
          value: originalExecPath,
          configurable: true,
        });
        fs.rmSync(fakeExecDir, { recursive: true, force: true });
      });

      it("finds a template that only exists next to the executable", () => {
        expect(loadTemplate("only-in-bundle.hbs")).toBe("bundled-marker");
      });
    });
  });
});

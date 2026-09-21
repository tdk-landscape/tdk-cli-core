import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTemplate } from "../template-engine.js";

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

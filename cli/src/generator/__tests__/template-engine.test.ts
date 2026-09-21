import { describe, expect, it } from "vitest";
import { loadTemplate } from "../template-engine.js";

describe("template-engine", () => {
  describe("loadTemplate", () => {
    it("should load TILT_RESOURCE_DEFAULTS.star.hbs template", () => {
      const content = loadTemplate("TILT_RESOURCE_DEFAULTS.star.hbs");
      expect(content).toBeTruthy();
      expect(content).toContain("TILT_RESOURCE_DEFAULTS");
      expect(typeof content).toBe("string");
    });

    it("should load TILT_TECH_STACK.star.hbs template", () => {
      const content = loadTemplate("TILT_TECH_STACK.star.hbs");
      expect(content).toBeTruthy();
      expect(content).toContain("TILT_TECH_STACK");
      expect(typeof content).toBe("string");
    });

    it("should load Tiltfile.hbs template", () => {
      const content = loadTemplate("Tiltfile.hbs");
      expect(content).toBeTruthy();
      expect(content).toContain("Tiltfile");
      expect(typeof content).toBe("string");
    });

    it("should load .tiltignore.hbs template", () => {
      const content = loadTemplate(".tiltignore.hbs");
      expect(content).toBeTruthy();
      expect(typeof content).toBe("string");
    });

    it("should load spec.master.hbs template", () => {
      const content = loadTemplate("spec.master.hbs");
      expect(content).toBeTruthy();
      expect(content).toContain("spec.master");
      expect(typeof content).toBe("string");
    });

    it("should throw error for non-existent template", () => {
      expect(() => loadTemplate("non-existent.hbs")).toThrow("Failed to load template");
    });
  });
});

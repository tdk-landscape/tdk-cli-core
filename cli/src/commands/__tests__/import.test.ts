import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectImportableFiles } from "../import.js";

describe("import command detection", () => {
  it("detects docker-compose.yml as importable", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => true,
      readdirSync: () => ["docker-compose.yml", "package.json"],
    }));

    const result = detectImportableFiles(".");

    expect(result.found).toContain("docker-compose.yml");
    expect(result.importable).toBe(true);
  });

  it("detects Dockerfile as importable", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => true,
      readdirSync: () => ["Dockerfile", "package.json"],
    }));

    const result = detectImportableFiles(".");

    expect(result.found).toContain("Dockerfile");
    expect(result.importable).toBe(true);
  });

  it("detects package.json as importable", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => true,
      readdirSync: () => ["package.json"],
    }));

    const result = detectImportableFiles(".");

    expect(result.found).toContain("package.json");
    expect(result.importable).toBe(true);
  });

  it("detects Procfile as importable", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => true,
      readdirSync: () => ["Procfile"],
    }));

    const result = detectImportableFiles(".");

    expect(result.found).toContain("Procfile");
    expect(result.importable).toBe(true);
  });

  it("lists unsupported files like Helm as skipped", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => true,
      readdirSync: () => ["Chart.yaml", "values.yaml"],
    }));

    const result = detectImportableFiles(".");

    expect(result.importable).toBe(false);
    expect(result.skipped).toContain("Chart.yaml");
  });

  it("returns false when directory doesn't exist", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => false,
    }));

    const result = detectImportableFiles("/nonexistent");

    expect(result.importable).toBe(false);
    expect(result.found).toEqual([]);
  });

  it("returns false when only unsupported files exist", () => {
    vi.doMock("node:fs", () => ({
      existsSync: () => true,
      readdirSync: () => ["Dockerfile.prod", "helm", "kustomization.yaml"],
    }));

    const result = detectImportableFiles(".");

    expect(result.importable).toBe(false);
  });
});

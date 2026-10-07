import { describe, expect, it } from "vitest";
import { SERVICE_MANIFEST_SCHEMA_VERSION, validateServiceManifest } from "../service-manifest.js";

describe("service manifest compatibility", () => {
  it("requires schema version and reports missing fields by path", () => {
    const result = validateServiceManifest({ appName: "api" }, "services/shop/api/service.json");
    expect(result.errors).toEqual([
      "services/shop/api/service.json.appType: required field is missing",
      "services/shop/api/service.json.stack: required field is missing",
      "services/shop/api/service.json.schemaVersion: required field is missing",
    ]);
  });

  it("warns about extra fields while retaining their values", () => {
    const manifest = {
      appName: "api",
      appType: "backend",
      stack: "shop",
      schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
      customerMetadata: { owner: "team-a" },
    };
    const result = validateServiceManifest(manifest, "service.json");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(["service.json.customerMetadata: unknown field is preserved"]);
    expect(result.manifest?.customerMetadata).toEqual({ owner: "team-a" });
  });

  it("accepts a smoke block without calling it unknown, and reports a bad one as an error by path", () => {
    const base = {
      appName: "api",
      appType: "backend",
      stack: "shop",
      schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
    };
    const good = validateServiceManifest(
      { ...base, smoke: { via: "proxy", steps: [{ path: "/records", expect: 200 }] } },
      "service.json",
    );
    expect(good.errors).toEqual([]);
    expect(good.warnings).toEqual([]);

    const bad = validateServiceManifest(
      { ...base, smoke: { via: "container", steps: [{ path: "records" }] } },
      "service.json",
    );
    expect(bad.errors.join("\n")).toMatch(/service\.json\.smoke\.via/);
    expect(bad.errors.join("\n")).toMatch(/service\.json\.smoke\.steps\[0\]\.path/);
  });

  it("accepts dev.liveReload as a boolean and reports anything else as an error by path", () => {
    const base = {
      appName: "api",
      appType: "backend",
      stack: "shop",
      schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
    };
    const ok = validateServiceManifest(
      { ...base, language: "go", dev: { liveReload: true } },
      "service.json",
    );
    expect(ok.errors).toEqual([]);
    expect(ok.warnings).toEqual([]);

    const bad = validateServiceManifest(
      { ...base, language: "go", dev: { liveReload: "yes" } },
      "service.json",
    );
    expect(bad.errors.join("\n")).toMatch(/service\.json\.dev\.liveReload: expected true or false/);
  });

  it("warns that dev.liveReload only applies to Go services", () => {
    const base = {
      appName: "api",
      appType: "backend",
      stack: "shop",
      schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
    };
    const result = validateServiceManifest(
      { ...base, language: "python", dev: { liveReload: true } },
      "service.json",
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings.join("\n")).toMatch(/service\.json\.dev\.liveReload: .*only .*Go/);
  });

  it("warns specifically that a jwtSecret in service.json is ignored and must not be committed", () => {
    const result = validateServiceManifest(
      {
        appName: "api",
        appType: "backend",
        stack: "shop",
        schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
        jwtSecret: "committed-by-mistake",
      },
      "service.json",
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("service.json.jwtSecret");
    expect(result.warnings[0]).toMatch(/ignored/);
    expect(result.warnings[0]).toContain("JWT_SECRET");
    // The warning never repeats the secret itself.
    expect(result.warnings[0]).not.toContain("committed-by-mistake");
  });

  it("flags the deprecated dependencies and envVars fields, and says what replaces them", () => {
    const result = validateServiceManifest(
      {
        appName: "api",
        appType: "backend",
        stack: "shop",
        schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
        dependencies: ["orders"],
        envVars: { LOG_LEVEL: "debug" },
      },
      "service.json",
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      "service.json.dependencies: deprecated, use dependsOn (still read for now)",
      "service.json.envVars: deprecated, use params (still read when params is absent)",
    ]);
    // Deprecated is not removed: the values are kept so the engine can still fall back to them.
    expect(result.manifest?.dependencies).toEqual(["orders"]);
    expect(result.manifest?.envVars).toEqual({ LOG_LEVEL: "debug" });
  });

  it("does not flag the current fields", () => {
    const result = validateServiceManifest(
      {
        appName: "api",
        appType: "backend",
        stack: "shop",
        schemaVersion: SERVICE_MANIFEST_SCHEMA_VERSION,
        dependsOn: ["orders"],
        params: { LOG_LEVEL: "debug" },
      },
      "service.json",
    );
    expect(result.warnings).toEqual([]);
  });

  it("rejects unsupported schema versions", () => {
    const result = validateServiceManifest(
      { appName: "api", appType: "backend", stack: "shop", schemaVersion: 2 },
      "service.json",
    );
    expect(result.errors).toEqual([
      "service.json.schemaVersion: unsupported version 2 (supported: 1)",
    ]);
  });
});

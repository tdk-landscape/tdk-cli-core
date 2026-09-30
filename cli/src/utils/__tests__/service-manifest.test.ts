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

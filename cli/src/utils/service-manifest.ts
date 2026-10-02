import { existsSync, readFileSync } from "node:fs";

export const SERVICE_MANIFEST_SCHEMA_VERSION = 1;
export const SERVICE_MANIFEST_SCHEMA_URL = "https://tdk-landscape.github.io/schema.service.json";

const KNOWN_SERVICE_FIELDS = new Set([
  "$schema",
  "apiBasePath",
  "appName",
  "appType",
  "backendName",
  "basePath",
  "build",
  "databaseName",
  "dependencies",
  "dev",
  "dependsOn",
  "dockerfile",
  "enabled",
  "exposeViaProxy",
  "featuresEnabled",
  "framework",
  "healthCheckPath",
  "image",
  "language",
  "name",
  "nats",
  "params",
  "playwright",
  "port",
  "replicas",
  "restart",
  "runtime",
  "sablier",
  "schemaVersion",
  "secrets",
  "stack",
  "syncs",
  "traefik",
  "type",
]);

export interface ServiceManifestValidation {
  errors: string[];
  warnings: string[];
  manifest?: Record<string, unknown>;
}

export function validateServiceManifest(
  value: unknown,
  displayPath: string,
): ServiceManifestValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { errors: [`${displayPath}: expected a JSON object`], warnings: [] };
  }

  const manifest = value as Record<string, unknown>;
  const errors: string[] = [];
  for (const field of ["appName", "appType", "stack", "schemaVersion"] as const) {
    if (!(field in manifest)) errors.push(`${displayPath}.${field}: required field is missing`);
  }
  for (const field of ["appName", "appType", "stack"] as const) {
    if (field in manifest && typeof manifest[field] !== "string") {
      errors.push(`${displayPath}.${field}: expected a string`);
    }
  }
  if ("schemaVersion" in manifest && manifest.schemaVersion !== SERVICE_MANIFEST_SCHEMA_VERSION) {
    errors.push(
      `${displayPath}.schemaVersion: unsupported version ${String(manifest.schemaVersion)} (supported: ${SERVICE_MANIFEST_SCHEMA_VERSION})`,
    );
  }

  const warnings = Object.keys(manifest)
    .filter((field) => !KNOWN_SERVICE_FIELDS.has(field))
    .map((field) =>
      field === "jwtSecret"
        ? `${displayPath}.jwtSecret: ignored. A secret must not be committed: remove it and set JWT_SECRET in the project .env`
        : `${displayPath}.${field}: unknown field is preserved`,
    );
  return { errors, warnings, manifest };
}

export function validateServiceManifestFile(
  filePath: string,
  displayPath: string,
): ServiceManifestValidation {
  if (!existsSync(filePath)) {
    return { errors: [`${displayPath}: file is missing`], warnings: [] };
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
    return validateServiceManifest(parsed, displayPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { errors: [`${displayPath}: invalid JSON (${message})`], warnings: [] };
  }
}

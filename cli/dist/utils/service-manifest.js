import { existsSync, readFileSync } from "node:fs";
export const SERVICE_MANIFEST_SCHEMA_VERSION = 1;
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
    "name",
    "nats",
    "params",
    "playwright",
    "port",
    "replicas",
    "runtime",
    "sablier",
    "schemaVersion",
    "secrets",
    "stack",
    "syncs",
    "traefik",
    "type",
]);
export function validateServiceManifest(value, displayPath) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { errors: [`${displayPath}: expected a JSON object`], warnings: [] };
    }
    const manifest = value;
    const errors = [];
    for (const field of ["appName", "appType", "stack", "schemaVersion"]) {
        if (!(field in manifest))
            errors.push(`${displayPath}.${field}: required field is missing`);
    }
    for (const field of ["appName", "appType", "stack"]) {
        if (field in manifest && typeof manifest[field] !== "string") {
            errors.push(`${displayPath}.${field}: expected a string`);
        }
    }
    if ("schemaVersion" in manifest && manifest.schemaVersion !== SERVICE_MANIFEST_SCHEMA_VERSION) {
        errors.push(`${displayPath}.schemaVersion: unsupported version ${String(manifest.schemaVersion)} (supported: ${SERVICE_MANIFEST_SCHEMA_VERSION})`);
    }
    const warnings = Object.keys(manifest)
        .filter((field) => !KNOWN_SERVICE_FIELDS.has(field))
        .map((field) => `${displayPath}.${field}: unknown field is preserved`);
    return { errors, warnings, manifest };
}
export function validateServiceManifestFile(filePath, displayPath) {
    if (!existsSync(filePath)) {
        return { errors: [`${displayPath}: file is missing`], warnings: [] };
    }
    try {
        const parsed = JSON.parse(readFileSync(filePath, "utf-8"));
        return validateServiceManifest(parsed, displayPath);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { errors: [`${displayPath}: invalid JSON (${message})`], warnings: [] };
    }
}
//# sourceMappingURL=service-manifest.js.map
export declare const SERVICE_MANIFEST_SCHEMA_VERSION = 1;
export declare const SERVICE_MANIFEST_SCHEMA_URL = "https://tdk-landscape.github.io/schema.service.json";
export interface ServiceManifestValidation {
    errors: string[];
    warnings: string[];
    manifest?: Record<string, unknown>;
}
export declare function getInvalidServiceRoutePathFields(value: unknown): ("apiPath" | "basePath")[];
export declare function validateServiceManifest(value: unknown, displayPath: string): ServiceManifestValidation;
export declare function validateServiceManifestFile(filePath: string, displayPath: string): ServiceManifestValidation;
//# sourceMappingURL=service-manifest.d.ts.map
export const CREATABLE_RESOURCE_TYPES = ["backend", "frontend", "worker"];
export function isCreatableResourceType(value) {
    return (typeof value === "string" && CREATABLE_RESOURCE_TYPES.includes(value));
}
/**
 * Type guard to validate filename is a known master config file.
 * Eliminates the need for 'as MasterConfigFileName' assertion.
 */
export function isMasterConfigFileName(filename) {
    const validNames = [
        "TILT_TECH_STACK.star",
        "TILT_RESOURCE_DEFAULTS.star",
        "spec.master",
    ];
    return validNames.includes(filename);
}
//# sourceMappingURL=index.js.map
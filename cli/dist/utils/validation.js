import { OPTIONAL_INFRA_SERVICES } from "./constants.js";
export const KEBAB_CASE_REGEX = /^[a-z0-9-]+$/;
function isKebabCase(value) {
    return KEBAB_CASE_REGEX.test(value);
}
export function validateResourceName(name) {
    if (!name.trim()) {
        return { valid: false, error: "Resource name is required" };
    }
    if (!isKebabCase(name)) {
        return {
            valid: false,
            error: "Use lowercase letters, numbers, and hyphens only",
        };
    }
    return { valid: true };
}
export function createKebabCaseValidator(context) {
    return (input) => {
        if (!input.trim()) {
            return context === "resource" ? "Resource name is required" : "Stack name is required";
        }
        if (!isKebabCase(input)) {
            return context === "resource"
                ? "Use lowercase letters, numbers, and hyphens only"
                : "Use kebab-case (lowercase, numbers, hyphens only)";
        }
        return true;
    };
}
export function validateOptionalInfraService(service) {
    if (includes(OPTIONAL_INFRA_SERVICES, service)) {
        return { valid: true };
    }
    return {
        valid: false,
        error: `Invalid service. Must be one of: ${OPTIONAL_INFRA_SERVICES.join(", ")}`,
    };
}
export function isValidPort(port) {
    return Number.isInteger(port) && port > 0 && port <= 65535;
}
/**
 * Check a filesystem path segment for characters that are unsafe to use in a
 * path (null bytes, or characters that are invalid on common filesystems).
 * Does not check for path traversal (`..`) - callers that resolve the path
 * against a base directory should check that separately.
 */
export function isPathSafe(path) {
    return !path.includes("\0") && !/[<>:"|?*]/.test(path);
}
export function sanitizeForShell(value, replacement = "_") {
    return value.replace(/[^a-zA-Z0-9-]/g, replacement).substring(0, 100);
}
export function includes(array, value) {
    return array.includes(value);
}
//# sourceMappingURL=validation.js.map
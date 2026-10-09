// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { TECH_STACK_FILE } from "../utils/constants.js";
export const RESOURCE_CONFIG_APP_TYPES = [
    "backend",
    "frontend",
    "library",
    "sdk",
    "worker",
    "migrator",
    "mcp",
    "bring-your-own",
];
export const CREATABLE_RESOURCE_TYPES = [
    "backend",
    "frontend",
    "worker",
    "mcp",
    "bring-your-own",
];
export function isCreatableResourceType(value) {
    return (typeof value === "string" && CREATABLE_RESOURCE_TYPES.includes(value));
}
/**
 * Type guard to validate filename is a known master config file.
 * Eliminates the need for 'as MasterConfigFileName' assertion.
 */
export function isMasterConfigFileName(filename) {
    const validNames = [
        TECH_STACK_FILE,
        "TILT_RESOURCE_DEFAULTS.star",
        "spec.master",
    ];
    return validNames.includes(filename);
}
//# sourceMappingURL=index.js.map
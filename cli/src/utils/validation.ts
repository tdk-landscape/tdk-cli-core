import type { ValidationResult } from "../types/index.js";
import { OPTIONAL_INFRA_SERVICES } from "./constants.js";

export const KEBAB_CASE_REGEX = /^[a-z0-9-]+$/;

function isKebabCase(value: string): boolean {
  return KEBAB_CASE_REGEX.test(value);
}

export function validateResourceName(name: string): ValidationResult {
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

export function createKebabCaseValidator(context: "resource" | "stack") {
  return (input: string): true | string => {
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

export function validateOptionalInfraService(service: string): ValidationResult {
  if (includes(OPTIONAL_INFRA_SERVICES, service)) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `Invalid service. Must be one of: ${OPTIONAL_INFRA_SERVICES.join(", ")}`,
  };
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

export function sanitizeForShell(value: string, replacement: string = "_"): string {
  return value.replace(/[^a-zA-Z0-9-]/g, replacement).substring(0, 100);
}

export function includes<T extends readonly string[]>(array: T, value: string): value is T[number] {
  return (array as readonly string[]).includes(value);
}

import type { CheckResult } from "../types/index.js";
export declare function findPrivateStarlarkLoadExports(content: string): string[];
export declare function resolveStarlarkLoadTarget(file: string, modulePath: string, projectRoot: string): string | null;
export declare function findMissingRelativeStarlarkLoads(file: string, content: string, projectRoot: string): string[];
export declare function findRelativeStarlarkLoadTargets(file: string, content: string, projectRoot: string): string[];
export declare function collectReachableStarlarkFiles(entryFile: string, projectRoot: string): string[];
export declare function checkStarlarkLoadExports(): CheckResult;

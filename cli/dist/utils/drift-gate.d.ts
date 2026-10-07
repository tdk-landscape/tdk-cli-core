export interface DriftGateOptions {
    projectRoot: string;
    ignoreDrift?: boolean;
    quiet?: boolean;
}
/**
 * Check if generated files match service.json.
 * Returns true if verification passes or drift is ignored.
 * Returns false and exits with code 2 if drift is detected and --ignore-drift is not set.
 */
export declare function checkDriftGate(options: DriftGateOptions): boolean;
//# sourceMappingURL=drift-gate.d.ts.map
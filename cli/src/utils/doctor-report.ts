import type { CheckResult } from "../types/index.js";

export interface DoctorError {
  code: "USAGE" | "INTERNAL";
  message: string;
}

export interface DoctorReport {
  schemaVersion: 1;
  data: {
    ready: boolean;
    inProject: boolean;
    checks: CheckResult[];
  };
  errors: DoctorError[];
}

type DoctorCheck = () => CheckResult | Promise<CheckResult>;

/** Wait for concurrent probes to finish even if one throws, so they can release resources. */
export async function collectDoctorChecks(
  machineChecks: DoctorCheck[],
  projectChecks: DoctorCheck[],
): Promise<{ checks: CheckResult[]; errors: DoctorError[] }> {
  const checks: CheckResult[] = [];
  const errors: DoctorError[] = [];
  const append = (result: PromiseSettledResult<CheckResult>): void => {
    if (result.status === "fulfilled") checks.push(result.value);
    else
      errors.push({
        code: "INTERNAL",
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
  };
  for (const result of await Promise.allSettled(
    machineChecks.map((check) => Promise.resolve().then(check)),
  )) {
    append(result);
  }
  for (const check of projectChecks) {
    for (const result of await Promise.allSettled([Promise.resolve().then(check)])) append(result);
  }
  return { checks, errors };
}

/** Produce the same readiness decision for human and machine consumers. */
export function createDoctorReport(
  checks: CheckResult[],
  inProject: boolean,
  errors: DoctorError[] = [],
): DoctorReport {
  return {
    schemaVersion: 1,
    data: {
      ready:
        errors.length === 0 &&
        checks.every((check) => check.didPass || check.isSkipped || check.isWarning),
      inProject,
      checks,
    },
    errors,
  };
}

/** 0: ready (warnings permitted), 1: blocking findings, 2: usage/internal failure. */
export function getDoctorExitCode(report: DoctorReport): 0 | 1 | 2 {
  return report.errors.length > 0 ? 2 : report.data.ready ? 0 : 1;
}

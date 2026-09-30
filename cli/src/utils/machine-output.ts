import { TdkError } from "./errors.js";

export interface MachineError {
  code: string;
  message: string;
}

export interface MachineEnvelope<T> {
  schemaVersion: 1;
  data: T | null;
  errors: MachineError[];
}

export function createMachineEnvelope<T>(
  data: T | null,
  errors: MachineError[] = [],
): MachineEnvelope<T> {
  return { schemaVersion: 1, data, errors };
}

export function toMachineError(error: unknown): { error: MachineError; exitCode: 1 | 2 } {
  if (error instanceof TdkError) {
    return { error: { code: "COMMAND_FAILED", message: error.message }, exitCode: 1 };
  }
  return {
    error: {
      code: "INTERNAL",
      message: error instanceof Error ? error.message : String(error),
    },
    exitCode: 2,
  };
}

/** Keep machine stdout parseable when a command fails before it has data to return. */
export function writeMachineError(error: unknown): never {
  const result = toMachineError(error);
  console.log(JSON.stringify(createMachineEnvelope(null, [result.error])));
  console.error(result.error.message);
  process.exit(result.exitCode);
}

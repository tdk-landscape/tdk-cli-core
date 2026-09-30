import { TdkError } from "./errors.js";
export function createMachineEnvelope(data, errors = []) {
    return { schemaVersion: 1, data, errors };
}
export function toMachineError(error) {
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
export function writeMachineError(error) {
    const result = toMachineError(error);
    console.log(JSON.stringify(createMachineEnvelope(null, [result.error])));
    console.error(result.error.message);
    process.exit(result.exitCode);
}
//# sourceMappingURL=machine-output.js.map
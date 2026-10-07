export interface MachineError {
    code: string;
    message: string;
    suggestions?: string[];
}
export interface MachineEnvelope<T> {
    schemaVersion: 1;
    data: T | null;
    errors: MachineError[];
}
export declare function createMachineEnvelope<T>(data: T | null, errors?: MachineError[]): MachineEnvelope<T>;
export declare function toMachineError(error: unknown): {
    error: MachineError;
    exitCode: number;
};
/** Keep machine stdout parseable when a command fails before it has data to return. */
export declare function writeMachineError(error: unknown): never;
//# sourceMappingURL=machine-output.d.ts.map
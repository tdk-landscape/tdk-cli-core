import type { TiltCommandResult } from "../types/index.js";
export declare function runTilt(command: string, args?: string[], options?: {
    verbose?: boolean;
    quiet?: boolean;
    inheritStdio?: boolean;
    timeoutMs?: number;
}): Promise<TiltCommandResult>;
export declare function isTiltAvailable(): Promise<boolean>;
export declare function getTiltfilePath(): string;
export declare function buildTiltUpArgs(serviceNames: string[], options?: {
    verbose?: boolean;
    quiet?: boolean;
    force?: boolean;
    watch?: boolean;
}): string[];
export declare function buildTiltDownArgs(options?: {
    force?: boolean;
}): string[];
//# sourceMappingURL=tilt.d.ts.map
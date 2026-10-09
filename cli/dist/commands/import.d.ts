import { type SpawnOptions, spawn } from "node:child_process";
import { Command } from "commander";
/**
 * The importer lives in its own repo so detectors can ship without a CLI release. Until it is
 * published to npm it is run from git; `TDK_IMPORT_PACKAGE` overrides the package spec.
 */
export declare const IMPORT_PACKAGE = "github:tdk-landscape/tdk-import";
type SpawnFn = (command: string, args: string[], options: SpawnOptions) => ReturnType<typeof spawn>;
export declare function importInvocation(args: string[], env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): {
    command: string;
    args: string[];
    shell: boolean;
};
/** Runs tdk-import with the caller's terminal and resolves to its exit code. */
export declare function runImport(args: string[], spawnFn?: SpawnFn): Promise<number>;
export declare const importCommand: Command;
export {};

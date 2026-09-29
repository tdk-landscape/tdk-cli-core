import { Command } from "commander";
interface InstallInfo {
    method: "npm" | "bun" | "git" | "binary" | "unknown";
    path?: string;
    version?: string;
}
export declare function classifyRunningInstall(execPath: string, scriptPath: string, platformName?: NodeJS.Platform): InstallInfo | null;
export declare function windowsNpmUpgradeMessage(platformName: string, installInfo: InstallInfo): string | null;
export interface BinaryRelease {
    tag: string;
    assetName: string;
    downloadUrl: string;
    engineDownloadUrl: string;
    checksumsUrl: string;
}
/** Parses `shasum -a 256` / `sha256sum` output ("<hash>  <name>" or "<hash> *<name>"). */
export declare function parseChecksums(text: string): Map<string, string>;
export declare function isWritable(path: string): boolean;
export declare function upgradeViaBinary(tdkPath: string, release: BinaryRelease): Promise<boolean>;
export declare const upgradeCommand: Command;
export {};
//# sourceMappingURL=upgrade.d.ts.map
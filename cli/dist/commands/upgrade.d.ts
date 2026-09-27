import { Command } from "commander";
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
//# sourceMappingURL=upgrade.d.ts.map
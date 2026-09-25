import { Command } from "commander";
export interface BinaryRelease {
    tag: string;
    assetName: string;
    downloadUrl: string;
    engineDownloadUrl: string;
}
export declare function isWritable(path: string): boolean;
export declare function upgradeViaBinary(tdkPath: string, release: BinaryRelease): Promise<boolean>;
export declare const upgradeCommand: Command;
//# sourceMappingURL=upgrade.d.ts.map
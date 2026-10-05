/**
 * A repo can pin the oldest CLI it works with: `"minTdkVersion": "1.3.80"` in .tdk/project.json.
 * Shared by `tdk doctor` and `tdk up` so both say the same thing.
 */
export type TdkVersionFloor = {
    status: "none";
} | {
    status: "ok";
    required: string;
} | {
    status: "too-old";
    required: string;
    message: string;
    fix: string;
} | {
    status: "malformed";
    message: string;
    fix: string;
};
export declare function evaluateTdkVersionFloor(projectRoot: string, currentVersion: string): TdkVersionFloor;
//# sourceMappingURL=tdk-version.d.ts.map
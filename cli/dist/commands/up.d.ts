import { Command } from "commander";
export declare function formatUpSuccess(port: number, appUrls?: string[]): string[];
export declare function nativeWindowsUpRefusal(platform: string, allowNativeWindows?: string): string | null;
/** Why `tdk up` cannot work on this host, or null when it may proceed. Docker reachability is only probed in container hosts. */
export declare function hostUpRefusal(host?: import("../utils/agent-host.js").HostInfo, dockerReachable?: () => Promise<boolean>): Promise<string | null>;
/** Exit status for `tdk up` when generated files no longer match service.json / project.json. */
export declare const DRIFT_EXIT_CODE = 2;
/**
 * Generated service files edited by hand. Only these block `tdk up`: when service.json itself changed, `tdk up` regenerates
 * the outputs, so stale outputs are the normal edit-then-up loop and not drift.
 */
export declare function driftReport(projectRoot: string): string[] | null;
/**
 * Runs before Tilt is started: exits with DRIFT_EXIT_CODE on drift unless `ignoreDrift` is set. With `ignoreDrift` the
 * warning is printed every time, whether or not anything drifted, because the check is skipped and cannot tell.
 */
export declare function enforceDriftGate(projectRoot: string, options: {
    ignoreDrift?: boolean;
    onDrift?: (message: string) => void;
}, exit?: (code: number) => never): void;
export declare const upCommand: Command;
//# sourceMappingURL=up.d.ts.map
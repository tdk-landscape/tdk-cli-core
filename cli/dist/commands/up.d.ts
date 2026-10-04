import { Command } from "commander";
export declare function formatUpSuccess(port: number, appUrls?: string[]): string[];
export declare function nativeWindowsUpRefusal(platform: string, allowNativeWindows?: string): string | null;
/** Why `tdk up` cannot work on this host, or null when it may proceed. Docker reachability is only probed in container hosts. */
export declare function hostUpRefusal(host?: import("../utils/agent-host.js").HostInfo, dockerReachable?: () => Promise<boolean>): Promise<string | null>;
export declare const upCommand: Command;
//# sourceMappingURL=up.d.ts.map
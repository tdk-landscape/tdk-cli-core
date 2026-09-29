export type PreflightItem = {
    id: "node" | "docker" | "compose" | "tilt" | "bun" | "ports" | "nats" | "prisma";
    ok: boolean;
    message: string;
    fix?: string;
};
export type PreflightResult = {
    ok: boolean;
    inProject: boolean;
    items: PreflightItem[];
    header: string;
    footer: string;
};
export declare function nodeTooOld(version: string): boolean;
export declare function runColdPreflight(opts?: {
    cwd?: string;
}): Promise<PreflightResult>;
export declare function formatColdPreflight(result: PreflightResult): string;
export declare function assertMachineReadyOrExit(): Promise<void>;
//# sourceMappingURL=cold-preflight.d.ts.map
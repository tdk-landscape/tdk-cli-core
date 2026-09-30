export interface HostPortPlan {
    ingressHttp: number;
    ingressHttps: number;
    postgres: number;
    requested: {
        ingressHttp: number;
        ingressHttps: number;
        postgres: number;
    };
    explicit: {
        ingressHttp: boolean;
        ingressHttps: boolean;
        postgres: boolean;
    };
    reason: {
        ingressHttp: string;
        ingressHttps: string;
        postgres: string;
    };
}
export interface HostPortPlanOptions {
    env?: NodeJS.ProcessEnv;
    isAvailable?: (port: number) => Promise<boolean>;
    ranges?: Partial<Record<keyof HostPortPlan["explicit"], {
        start: number;
        end: number;
    }>>;
}
export declare const DEFAULT_HOST_PORT_RANGES: {
    readonly ingressHttp: {
        readonly start: 8080;
        readonly end: 8180;
    };
    readonly ingressHttps: {
        readonly start: 8443;
        readonly end: 8543;
    };
    readonly postgres: {
        readonly start: 15432;
        readonly end: 15532;
    };
};
export declare function isHostPortAvailable(port: number): Promise<boolean>;
export declare function createHostPortPlan(options?: HostPortPlanOptions): Promise<HostPortPlan>;
export declare function formatHostPortPlan(plan: HostPortPlan): string;
//# sourceMappingURL=host-port-plan.d.ts.map
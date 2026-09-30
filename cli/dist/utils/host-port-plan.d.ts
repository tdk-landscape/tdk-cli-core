export interface HostPortPlan {
    ingressHttp: number;
    ingressHttps: number;
    postgres: number;
    explicit: {
        ingressHttp: boolean;
        ingressHttps: boolean;
        postgres: boolean;
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
export declare function createHostPortPlan(options?: HostPortPlanOptions): Promise<HostPortPlan>;
//# sourceMappingURL=host-port-plan.d.ts.map
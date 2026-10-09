/**
 * True for a resource that runs as an HTTP API service behind the Traefik API host: a backend, or an `mcp` server (a Model Context
 * Protocol endpoint, which the engine builds, routes and health-checks exactly like a backend).
 */
export declare function isApiServiceType(appType: string | undefined): boolean;

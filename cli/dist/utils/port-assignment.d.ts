import type { DiscoveredResource, PortAssignableResourceType } from "../types/index.js";
export declare function checkPortStatus(port: number): Promise<"running" | "stopped" | "unknown">;
export declare function findAvailablePort(basePort: number, maxAttempts?: number): Promise<number | null>;
export declare function getUsedPorts(resources: DiscoveredResource[]): Set<number>;
export declare function assignPort(resourceType: PortAssignableResourceType, existingResources: DiscoveredResource[]): number;
//# sourceMappingURL=port-assignment.d.ts.map
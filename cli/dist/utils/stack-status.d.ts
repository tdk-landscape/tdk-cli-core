import type { ResourceStatus, StackHealthStatus } from "../types/index.js";
/**
 * A stack with no known service status has not been checked, so it is "unknown", not "error". Once any service has a
 * status, the share of ready services decides it.
 */
export declare function deriveStackStatus(statuses: ResourceStatus[]): StackHealthStatus;

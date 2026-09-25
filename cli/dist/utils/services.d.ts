import type { DiscoveredResource, DiscoveredStack, ResourceMetadata, StackMetadata } from "../types/index.js";
export declare function discoverResourcesFromRoot(projectRoot: string): DiscoveredResource[];
export declare function discoverResources(): DiscoveredResource[];
/**
 * Unique, sorted `stack` values across discovered service.json files under `projectRoot`.
 * Tilt's discovery groups services by this same field (see tdk-cli-extensions
 * discovery_orchestrator.star), so these are the names that must appear in a
 * stack's `services` list in .tdk/project.json for that group to be enabled.
 */
export declare function discoverStackNames(projectRoot: string): string[];
export declare function getAllStacks(resources?: DiscoveredResource[]): string[];
export declare function discoverStacks(): DiscoveredStack[];
export declare function getResourcesForStack(stackName: string): DiscoveredResource[];
export declare function stackExists(stackName: string): boolean;
export declare function clearMetadataCache(): void;
export declare function getResourceMetadata(resource: DiscoveredResource): ResourceMetadata;
export declare function getStackMetadata(stack: DiscoveredStack): StackMetadata;
//# sourceMappingURL=services.d.ts.map
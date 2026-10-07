import { createCacheValidator } from "./cache.js";
import { findProjectRoot } from "./paths.js";
import { discoverResources, discoverResourcesWithProblems, discoverStacks, getAllStacks, warnAboutSkippedFiles, } from "./services.js";
let cachedContext = null;
const cacheValidator = createCacheValidator(1000);
export function clearDiscoveryCache() {
    cachedContext = null;
    cacheValidator.reset();
}
function isCacheValid() {
    return cachedContext !== null && cacheValidator.isValid();
}
export function createDiscoveryContext(forceRefresh = false) {
    if (!forceRefresh && isCacheValid() && cachedContext) {
        return cachedContext;
    }
    const projectRoot = findProjectRoot();
    const { resources, problems } = projectRoot
        ? discoverResourcesWithProblems(projectRoot)
        : { resources: discoverResources(), problems: [] };
    const stacks = discoverStacks(resources);
    const stackNames = getAllStacks(resources);
    warnAboutSkippedFiles(problems);
    const unassignedResources = resources.filter((r) => !r.stack);
    const resourcesByStack = new Map();
    for (const resource of resources) {
        if (resource.stack) {
            const stackResources = resourcesByStack.get(resource.stack) || [];
            stackResources.push(resource);
            resourcesByStack.set(resource.stack, stackResources);
        }
    }
    const context = {
        resources,
        problems,
        stacks,
        stackNames,
        unassignedResources,
        resourcesByStack,
    };
    cachedContext = context;
    cacheValidator.markUpdated();
    return context;
}
//# sourceMappingURL=discovery-context.js.map
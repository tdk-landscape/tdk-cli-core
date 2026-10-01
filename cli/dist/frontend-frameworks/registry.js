import { TdkError } from "../utils/errors.js";
import { preactFrontendProvider } from "./preact.js";
import { reactFrontendProvider } from "./react.js";
import { svelteFrontendProvider } from "./svelte.js";
import { vueFrontendProvider } from "./vue.js";
export const DEFAULT_FRONTEND_FRAMEWORK = "react";
export const FRONTEND_FRAMEWORKS = {
    react: reactFrontendProvider,
    vue: vueFrontendProvider,
    svelte: svelteFrontendProvider,
    preact: preactFrontendProvider,
};
export function getFrontendFramework(frameworkId) {
    const id = (frameworkId ?? DEFAULT_FRONTEND_FRAMEWORK).trim().toLowerCase();
    const provider = Object.hasOwn(FRONTEND_FRAMEWORKS, id) ? FRONTEND_FRAMEWORKS[id] : undefined;
    if (!provider) {
        const supportedIds = Object.keys(FRONTEND_FRAMEWORKS).join(", ");
        throw new TdkError(`Unknown frontend framework "${frameworkId}". Supported frameworks: ${supportedIds}.`, [`Use one of: ${supportedIds}`, `Omit --framework to use ${DEFAULT_FRONTEND_FRAMEWORK}`]);
    }
    return provider;
}
export function resolveFrontendFramework(resourceType, frameworkId) {
    if (resourceType !== "frontend") {
        if (frameworkId !== undefined) {
            throw new TdkError("--framework can only be used with --type frontend.", [
                "Add --type frontend, or drop --framework for this resource type",
            ]);
        }
        return undefined;
    }
    return getFrontendFramework(frameworkId);
}
//# sourceMappingURL=registry.js.map
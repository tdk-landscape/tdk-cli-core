import { reactFrontendProvider } from "./react.js";
import type { FrontendFrameworkProvider } from "./types.js";
import { vueFrontendProvider } from "./vue.js";

export const DEFAULT_FRONTEND_FRAMEWORK = "react";

export const FRONTEND_FRAMEWORKS: Record<string, FrontendFrameworkProvider> = {
  react: reactFrontendProvider,
  vue: vueFrontendProvider,
};

export function getFrontendFramework(frameworkId?: string): FrontendFrameworkProvider {
  const id = frameworkId ?? DEFAULT_FRONTEND_FRAMEWORK;
  const provider = Object.hasOwn(FRONTEND_FRAMEWORKS, id) ? FRONTEND_FRAMEWORKS[id] : undefined;

  if (!provider) {
    const supportedIds = Object.keys(FRONTEND_FRAMEWORKS).join(", ");
    throw new Error(`Unknown frontend framework "${id}". Supported frameworks: ${supportedIds}.`);
  }

  return provider;
}

export function resolveFrontendFramework(
  resourceType: string,
  frameworkId?: string,
): FrontendFrameworkProvider | undefined {
  if (resourceType !== "frontend") {
    if (frameworkId !== undefined) {
      throw new Error("--framework can only be used with --type frontend.");
    }
    return undefined;
  }

  return getFrontendFramework(frameworkId);
}

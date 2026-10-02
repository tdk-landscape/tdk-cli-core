import { TdkError } from "../utils/errors.js";
import { litFrontendProvider } from "./lit.js";
import { preactFrontendProvider } from "./preact.js";
import { reactFrontendProvider } from "./react.js";
import { solidFrontendProvider } from "./solid.js";
import { svelteFrontendProvider } from "./svelte.js";
import type { FrontendFrameworkProvider } from "./types.js";
import { vueFrontendProvider } from "./vue.js";

export const DEFAULT_FRONTEND_FRAMEWORK = "react";

export const FRONTEND_FRAMEWORKS: Record<string, FrontendFrameworkProvider> = {
  react: reactFrontendProvider,
  vue: vueFrontendProvider,
  svelte: svelteFrontendProvider,
  preact: preactFrontendProvider,
  lit: litFrontendProvider,
  solid: solidFrontendProvider,
};

export function getFrontendFramework(frameworkId?: string): FrontendFrameworkProvider {
  const id = (frameworkId ?? DEFAULT_FRONTEND_FRAMEWORK).trim().toLowerCase();
  const provider = Object.hasOwn(FRONTEND_FRAMEWORKS, id) ? FRONTEND_FRAMEWORKS[id] : undefined;

  if (!provider) {
    const supportedIds = Object.keys(FRONTEND_FRAMEWORKS).join(", ");
    throw new TdkError(
      `Unknown frontend framework "${frameworkId}". Supported frameworks: ${supportedIds}.`,
      [`Use one of: ${supportedIds}`, `Omit --framework to use ${DEFAULT_FRONTEND_FRAMEWORK}`],
    );
  }

  return provider;
}

export function resolveFrontendFramework(
  resourceType: string,
  frameworkId?: string,
): FrontendFrameworkProvider | undefined {
  if (resourceType !== "frontend") {
    // Backends take their own framework ids (see backend-frameworks/registry.ts).
    if (frameworkId !== undefined && resourceType !== "backend") {
      throw new TdkError("--framework can only be used with --type frontend or --type backend.", [
        "Add --type frontend or --type backend, or drop --framework for this resource type",
      ]);
    }
    return undefined;
  }

  return getFrontendFramework(frameworkId);
}

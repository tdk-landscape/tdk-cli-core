import { getBackendIndexTemplate } from "../backend-languages/bun.js";
import { TdkError } from "../utils/errors.js";
import { elysiaBackendProvider } from "./elysia.js";
import { expressBackendProvider } from "./express.js";
import type { BackendFrameworkProvider } from "./types.js";

/** Hono is the historical default; omitting --framework keeps the exact historical output. */
export const DEFAULT_BACKEND_FRAMEWORK = "hono";

export const honoBackendProvider: BackendFrameworkProvider = {
  id: "hono",
  label: "Bun + Hono",
  dependencies: { hono: "^4.0.0" },
  devDependencies: {},
  createIndex: getBackendIndexTemplate,
};

export const BACKEND_FRAMEWORKS: Record<string, BackendFrameworkProvider> = {
  hono: honoBackendProvider,
  express: expressBackendProvider,
  elysia: elysiaBackendProvider,
};

export function getBackendFramework(frameworkId?: string): BackendFrameworkProvider {
  const id = (frameworkId ?? DEFAULT_BACKEND_FRAMEWORK).trim().toLowerCase();
  const provider = Object.hasOwn(BACKEND_FRAMEWORKS, id) ? BACKEND_FRAMEWORKS[id] : undefined;

  if (!provider) {
    const supportedIds = Object.keys(BACKEND_FRAMEWORKS).join(", ");
    throw new TdkError(
      `Unknown backend framework "${frameworkId}". Supported frameworks: ${supportedIds}.`,
      [`Use one of: ${supportedIds}`, `Omit --framework to use ${DEFAULT_BACKEND_FRAMEWORK}`],
    );
  }

  return provider;
}

/**
 * Returns the provider for an explicit `--framework` on a backend, or undefined when none was given
 * (the historical Hono scaffold). Python owns its runtime, so a framework cannot be combined with it.
 */
export function resolveBackendFramework(
  resourceType: string,
  frameworkId?: string,
  language?: { id: string; createFiles?: unknown },
): BackendFrameworkProvider | undefined {
  if (resourceType !== "backend" || frameworkId === undefined) return undefined;

  if (language?.createFiles) {
    throw new TdkError(`--framework cannot be combined with --language ${language.id}.`, [
      `The ${language.id} provider owns its runtime and framework`,
      "Drop --framework, or use --language bun",
    ]);
  }

  return getBackendFramework(frameworkId);
}

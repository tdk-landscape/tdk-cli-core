import type { BackendLanguageProvider } from "./types.js";
export declare const DEFAULT_BACKEND_LANGUAGE = "bun";
export declare const BACKEND_LANGUAGES: Record<string, BackendLanguageProvider>;
export declare function getBackendLanguage(languageId?: string): BackendLanguageProvider;
/** Returns the provider for a backend, or undefined for other types. Rejects --language elsewhere. */
export declare function resolveBackendLanguage(resourceType: string, languageId?: string): BackendLanguageProvider | undefined;

import type { BackendLanguageProvider } from "./types.js";
/**
 * Go has no reload process inside the image, so the dev command is only what a developer would run by
 * hand. Tilt rebuilds the image when a watched file changes (the engine returns no live-update rules).
 */
export declare const GO_DEV_COMMAND = "go run .";
export declare const goBackendProvider: BackendLanguageProvider;
//# sourceMappingURL=go.d.ts.map
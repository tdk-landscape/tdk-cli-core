import type { BackendLanguageProvider } from "./types.js";
/**
 * Rust is compiled into the image and has no reload process, so the dev command is only what a developer
 * would run by hand. Tilt rebuilds the image when a watched file changes (the engine returns no live-update rules).
 */
export declare const RUST_DEV_COMMAND = "cargo run";
export declare const rustBackendProvider: BackendLanguageProvider;
//# sourceMappingURL=rust.d.ts.map
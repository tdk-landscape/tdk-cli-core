import type { FileType } from "../types/index.js";
type TUIColor = string | undefined;
export interface TUITheme {
    accent: TUIColor;
    border: TUIColor;
    muted: TUIColor;
    foreground: TUIColor;
    success: TUIColor;
    warning: TUIColor;
    error: TUIColor;
    info: TUIColor;
    secondary: TUIColor;
    selectedBackground: TUIColor;
    selectedForeground: TUIColor;
    selectionBackground: TUIColor;
    selectionForeground: TUIColor;
    dimMuted: boolean;
    highContrast: boolean;
    ascii: boolean;
    bannerStart: string;
    bannerEnd: string;
    selectionMarker: string;
    separator: string;
    fileColors: Record<FileType, TUIColor>;
}
type TUIEnvironment = {
    NO_COLOR?: string;
    TERM?: string;
};
/** Build the TUI palette from the requested theme and terminal environment. */
export declare function createTUITheme(highContrast: boolean, environment?: TUIEnvironment): TUITheme;
/** Map a formatter status color to the active theme palette. */
export declare function getTUIStatusColor(theme: TUITheme, color: string | undefined): TUIColor;
/** Return a status marker suited to the active terminal character set. */
export declare function getTUIStatusIcon(theme: TUITheme, icon: string, color: string | undefined): string;
/** Return a tab section heading suited to the active terminal character set. */
export declare function sectionTitle(theme: TUITheme, title: string): string;
export declare const TUIThemeContext: import("react").Context<TUITheme>;
/** Read the theme provided to the current TUI subtree. */
export declare function useTUITheme(): TUITheme;
export {};

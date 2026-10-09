export type TabBarDensity = "compact" | "standard" | "wide";
export declare function getTerminalRuleWidth(terminalWidth: number): number;
export declare function getTabBarDensity(terminalWidth: number): TabBarDensity;
/**
 * Convert an SGR mouse row (1-based) to an Ink layout row (0-based).
 * The UI uses Ink's alternate screen with no Static content, so the live region starts at row 1.
 */
export declare function getListRowFromMouseY(mouseY: number, listTop: number): number;

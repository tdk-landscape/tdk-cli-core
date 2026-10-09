import type React from "react";
import type { BaseTooltipProps } from "../types/index.js";
/**
 * Info tooltip variant with predefined accessibility styling.
 * Uses an ℹ prefix ([i] in ASCII mode) and adds margin for better visibility.
 */
export declare const AccessibleTooltip: React.FC<Pick<BaseTooltipProps, "content" | "shortcut" | "visible">>;

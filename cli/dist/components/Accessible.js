import { jsx as _jsx } from "react/jsx-runtime";
import { BaseTooltip } from "./BaseTooltip.js";
import { useTUITheme } from "./ui-theme.js";
/**
 * Info tooltip variant with predefined accessibility styling.
 * Uses an ℹ prefix ([i] in ASCII mode) and adds margin for better visibility.
 */
export const AccessibleTooltip = ({ content, shortcut, visible }) => {
    const theme = useTUITheme();
    return (_jsx(BaseTooltip, { content: content, shortcut: shortcut, visible: visible, prefix: theme.ascii ? "[i] " : "ℹ ", marginTop: 1 }));
};

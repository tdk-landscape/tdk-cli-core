import { jsx as _jsx } from "react/jsx-runtime";
import { BaseTooltip } from "./BaseTooltip.js";
/**
 * Info tooltip variant with predefined accessibility styling.
 * Uses ℹ prefix and adds margin for better visibility.
 */
export const AccessibleTooltip = ({ content, shortcut, visible }) => {
    return (_jsx(BaseTooltip, { content: content, shortcut: shortcut, visible: visible, prefix: "\u2139 ", marginTop: 1 }));
};
//# sourceMappingURL=Accessible.js.map
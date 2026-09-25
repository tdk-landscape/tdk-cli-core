import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
export const BaseTooltip = ({ content, shortcut, visible, maxWidth = 40, wrapText = false, prefix = "", marginTop = 0, }) => {
    if (!visible)
        return null;
    // Wrap text to maxWidth if requested
    const lines = wrapText ? wrapContent(content, maxWidth) : [content];
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "yellow", paddingX: 1, paddingY: 1, backgroundColor: "black", marginTop: marginTop, children: [lines.map((line, i) => (_jsxs(Text, { color: "yellow", children: [prefix, line] }, i))), shortcut && (_jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: "gray", children: "Press " }), _jsx(Text, { color: "cyan", bold: true, children: shortcut.startsWith("[") ? shortcut : `[${shortcut}]` }), _jsx(Text, { color: "gray", children: " to use" })] }))] }));
};
function wrapContent(content, maxWidth) {
    const words = content.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
        if ((currentLine + word).length > maxWidth - 2) {
            lines.push(currentLine.trim());
            currentLine = `${word} `;
        }
        else {
            currentLine += `${word} `;
        }
    }
    if (currentLine) {
        lines.push(currentLine.trim());
    }
    return lines;
}
//# sourceMappingURL=BaseTooltip.js.map
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
export const TUIHeader = ({ projectRoot, resourceCount, terminalWidth, version, }) => {
    const compact = terminalWidth < 80;
    const title = compact ? `TDK v${version}` : `▓▒░ TDK NEON EDITION v${version} ░▒▓`;
    const resourceLabel = `${resourceCount} resource${resourceCount === 1 ? "" : "s"} discovered`;
    const paddingX = terminalWidth >= 28 ? 1 : 0;
    const contentWidth = Math.max(1, terminalWidth - paddingX * 2);
    if (compact) {
        const splitHeading = title.length + " | ".length + resourceLabel.length > contentWidth;
        return (_jsxs(Box, { flexDirection: "column", paddingX: paddingX, width: terminalWidth, children: [splitHeading ? (_jsxs(_Fragment, { children: [_jsx(Box, { width: contentWidth, children: _jsx(Text, { color: "cyan", bold: true, wrap: "truncate-end", children: title }) }), _jsx(Box, { width: contentWidth, children: _jsx(Text, { color: "green", wrap: "truncate-end", children: resourceLabel }) })] })) : (_jsx(Box, { width: contentWidth, children: _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { color: "cyan", bold: true, children: title }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: "green", children: resourceLabel })] }) })), _jsx(Box, { width: contentWidth, children: _jsx(Text, { color: "white", wrap: "truncate-end", children: projectRoot }) })] }));
    }
    const separatorsWidth = " | ".length * 2;
    const headingWidth = title.length + resourceLabel.length + separatorsWidth;
    if (headingWidth >= contentWidth) {
        return (_jsxs(Box, { flexDirection: "column", paddingX: paddingX, width: terminalWidth, children: [_jsx(Box, { width: contentWidth, children: _jsx(Text, { color: "cyan", bold: true, wrap: "truncate-end", children: title }) }), _jsx(Box, { width: contentWidth, children: _jsx(Text, { color: "green", wrap: "truncate-end", children: resourceLabel }) }), _jsx(Box, { width: contentWidth, children: _jsx(Text, { color: "white", wrap: "truncate-end", children: projectRoot }) })] }));
    }
    const rootWidth = contentWidth - headingWidth;
    return (_jsxs(Box, { flexDirection: "row", paddingX: paddingX, width: terminalWidth, children: [_jsx(Text, { color: "cyan", bold: true, children: title }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Box, { flexShrink: 0, width: rootWidth, children: _jsx(Text, { color: "white", wrap: "truncate-end", children: projectRoot }) }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: "green", children: resourceLabel })] }));
};
//# sourceMappingURL=TUIHeader.js.map
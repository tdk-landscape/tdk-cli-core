import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
const TABS = [
    { id: "overview", label: "OVERVIEW", shortcut: "1" },
    { id: "resources", label: "RESOURCES", shortcut: "2" },
    { id: "events", label: "EVENTS", shortcut: "3" },
    { id: "files", label: "FILES", shortcut: "4" },
    { id: "config", label: "CONFIG", shortcut: "5" },
];
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
export const TabBar = ({ activeTab, onTabChange, compact = false }) => {
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "gray", children: "─".repeat(compact ? 60 : 80) }) }), _jsx(Box, { flexDirection: "row", justifyContent: "space-between", paddingX: 1, children: TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (_jsx(Box, { children: isActive ? (_jsx(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 1, backgroundColor: "black", children: _jsxs(Text, { children: [_jsx(Text, { color: "cyan", children: "\u2593\u2592\u2591" }), _jsxs(Text, { color: "cyan", bold: true, children: [" ", "[", tab.shortcut, "] ", tab.label, " "] }), _jsx(Text, { color: "cyan", children: "\u2591\u2592\u2593" })] }) })) : (_jsx(Box, { paddingX: 1, children: _jsxs(Text, { color: "gray", dimColor: true, children: ["[", tab.shortcut, "] ", compact ? tab.label.slice(0, 4) : tab.label] }) })) }, tab.id));
                }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "─".repeat(compact ? 60 : 80) }) })] }));
};
//# sourceMappingURL=TabBar.js.map
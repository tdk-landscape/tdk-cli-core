import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { useState } from "react";
import { formatBytes } from "../utils/formatting.js";
const FILE_ICONS = {
    docker: "🐳",
    tilt: "⚙️",
    config: "🔧",
    prisma: "🗄️",
    generated: "📄",
    unknown: "📃",
};
const FILE_COLORS = {
    docker: "blue",
    tilt: "cyan",
    config: "yellow",
    prisma: "magenta",
    generated: "gray",
    unknown: "white",
};
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
export const FileTree = ({ nodes, onSelect, selectedPath }) => {
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const _toggleNode = (path) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        }
        else {
            newExpanded.add(path);
        }
        setExpandedNodes(newExpanded);
    };
    const renderNode = (node, depth = 0) => {
        const isExpanded = expandedNodes.has(node.path);
        const isSelected = selectedPath === node.path;
        const indent = "  ".repeat(depth);
        if (node.type === "directory") {
            return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { color: isSelected ? "cyan" : "white", bold: isSelected, backgroundColor: isSelected ? "blue" : undefined, children: [indent, isExpanded ? "▼" : "▶", " ", node.name] }) }), isExpanded && node.children?.map((child) => renderNode(child, depth + 1))] }, node.path));
        }
        const icon = node.fileType ? FILE_ICONS[node.fileType] : FILE_ICONS.unknown;
        const color = node.fileType ? FILE_COLORS[node.fileType] : FILE_COLORS.unknown;
        return (_jsxs(Box, { children: [_jsxs(Text, { color: isSelected ? "cyan" : color, bold: isSelected, backgroundColor: isSelected ? "blue" : undefined, children: [indent, " ", icon, " ", node.name] }), node.size && (_jsxs(Text, { color: "gray", dimColor: true, children: [" ", "(", formatBytes(node.size), ")"] }))] }, node.path));
    };
    return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: nodes.map((node) => renderNode(node, 0)) }));
};
//# sourceMappingURL=FileTree.js.map
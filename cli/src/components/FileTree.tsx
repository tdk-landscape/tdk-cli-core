import { Box, Text } from "ink";
import type React from "react";
import { useState } from "react";
import type { FileNode, FileTreeProps, FileType } from "../types/index.js";
import { formatBytes } from "../utils/formatting.js";

const FILE_ICONS: Record<FileType, string> = {
  docker: "🐳",
  tilt: "⚙️",
  config: "🔧",
  prisma: "🗄️",
  generated: "📄",
  unknown: "📃",
};

const FILE_COLORS: Record<FileType, string> = {
  docker: "blue",
  tilt: "cyan",
  config: "yellow",
  prisma: "magenta",
  generated: "gray",
  unknown: "white",
};

// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
export const FileTree: React.FC<FileTreeProps> = ({ nodes, onSelect, selectedPath }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const _toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.path);
    const isSelected = selectedPath === node.path;
    const indent = "  ".repeat(depth);

    if (node.type === "directory") {
      return (
        <Box key={node.path} flexDirection="column">
          <Box>
            <Text
              color={isSelected ? "cyan" : "white"}
              bold={isSelected}
              backgroundColor={isSelected ? "blue" : undefined}
            >
              {indent}
              {isExpanded ? "▼" : "▶"} {node.name}
            </Text>
          </Box>
          {isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
        </Box>
      );
    }

    const icon = node.fileType ? FILE_ICONS[node.fileType] : FILE_ICONS.unknown;
    const color = node.fileType ? FILE_COLORS[node.fileType] : FILE_COLORS.unknown;

    return (
      <Box key={node.path}>
        <Text
          color={isSelected ? "cyan" : color}
          bold={isSelected}
          backgroundColor={isSelected ? "blue" : undefined}
        >
          {indent} {icon} {node.name}
        </Text>
        {node.size && (
          <Text color="gray" dimColor>
            {" "}
            ({formatBytes(node.size)})
          </Text>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      {nodes.map((node) => renderNode(node, 0))}
    </Box>
  );
};

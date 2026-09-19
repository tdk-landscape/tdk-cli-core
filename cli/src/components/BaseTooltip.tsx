import { Box, Text } from "ink";
import type React from "react";
import type { BaseTooltipProps } from "../types/index.js";

export const BaseTooltip: React.FC<BaseTooltipProps> = ({
  content,
  shortcut,
  visible,
  maxWidth = 40,
  wrapText = false,
  prefix = "",
  marginTop = 0,
}) => {
  if (!visible) return null;

  // Wrap text to maxWidth if requested
  const lines: string[] = wrapText ? wrapContent(content, maxWidth) : [content];

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="yellow"
      paddingX={1}
      paddingY={1}
      backgroundColor="black"
      marginTop={marginTop}
    >
      {lines.map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static color-chip list, stable order
        <Text key={i} color="yellow">
          {prefix}
          {line}
        </Text>
      ))}
      {shortcut && (
        <Box marginTop={1}>
          <Text color="gray">Press </Text>
          <Text color="cyan" bold>
            {shortcut.startsWith("[") ? shortcut : `[${shortcut}]`}
          </Text>
          <Text color="gray"> to use</Text>
        </Box>
      )}
    </Box>
  );
};

function wrapContent(content: string, maxWidth: number): string[] {
  const words = content.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxWidth - 2) {
      lines.push(currentLine.trim());
      currentLine = `${word} `;
    } else {
      currentLine += `${word} `;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}

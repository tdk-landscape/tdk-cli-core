import { Box, Text } from "ink";
import type React from "react";

interface TUIHeaderProps {
  projectRoot: string;
  resourceCount: number;
  terminalWidth: number;
  version: string;
}

export const TUIHeader: React.FC<TUIHeaderProps> = ({
  projectRoot,
  resourceCount,
  terminalWidth,
  version,
}) => {
  const compact = terminalWidth < 80;
  const title = compact ? `TDK v${version}` : `▓▒░ TDK NEON EDITION v${version} ░▒▓`;
  const resourceLabel = `${resourceCount} resource${resourceCount === 1 ? "" : "s"} discovered`;
  const paddingX = terminalWidth >= 28 ? 1 : 0;
  const contentWidth = Math.max(1, terminalWidth - paddingX * 2);

  if (compact) {
    const splitHeading = title.length + " | ".length + resourceLabel.length > contentWidth;

    return (
      <Box flexDirection="column" paddingX={paddingX} width={terminalWidth}>
        {splitHeading ? (
          <>
            <Box width={contentWidth}>
              <Text color="cyan" bold wrap="truncate-end">
                {title}
              </Text>
            </Box>
            <Box width={contentWidth}>
              <Text color="green" wrap="truncate-end">
                {resourceLabel}
              </Text>
            </Box>
          </>
        ) : (
          <Box width={contentWidth}>
            <Text wrap="truncate-end">
              <Text color="cyan" bold>
                {title}
              </Text>
              <Text color="gray"> | </Text>
              <Text color="green">{resourceLabel}</Text>
            </Text>
          </Box>
        )}
        <Box width={contentWidth}>
          <Text color="white" wrap="truncate-end">
            {projectRoot}
          </Text>
        </Box>
      </Box>
    );
  }

  const separatorsWidth = " | ".length * 2;
  const headingWidth = title.length + resourceLabel.length + separatorsWidth;

  if (headingWidth >= contentWidth) {
    return (
      <Box flexDirection="column" paddingX={paddingX} width={terminalWidth}>
        <Box width={contentWidth}>
          <Text color="cyan" bold wrap="truncate-end">
            {title}
          </Text>
        </Box>
        <Box width={contentWidth}>
          <Text color="green" wrap="truncate-end">
            {resourceLabel}
          </Text>
        </Box>
        <Box width={contentWidth}>
          <Text color="white" wrap="truncate-end">
            {projectRoot}
          </Text>
        </Box>
      </Box>
    );
  }

  const rootWidth = contentWidth - headingWidth;

  return (
    <Box flexDirection="row" paddingX={paddingX} width={terminalWidth}>
      <Text color="cyan" bold>
        {title}
      </Text>
      <Text color="gray"> | </Text>
      <Box flexShrink={0} width={rootWidth}>
        <Text color="white" wrap="truncate-end">
          {projectRoot}
        </Text>
      </Box>
      <Text color="gray"> | </Text>
      <Text color="green">{resourceLabel}</Text>
    </Box>
  );
};

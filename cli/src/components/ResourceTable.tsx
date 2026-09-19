import { Box, Text } from "ink";
import type React from "react";
import type { ResourceTableProps } from "../types/index.js";
import { formatShortDate, getStatusColor, getStatusIcon, truncate } from "../utils/formatting.js";

export const ResourceTable: React.FC<ResourceTableProps> = ({ resources, maxWidth = 100 }) => {
  if (resources.length === 0) {
    return (
      <Box paddingY={1}>
        <Text color="gray">No resources found</Text>
      </Box>
    );
  }

  const narrowMode = maxWidth < 80;

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" borderStyle="single" borderColor="gray" paddingX={1}>
        <Box width={narrowMode ? 20 : 25}>
          <Text bold>Logical ID</Text>
        </Box>
        {!narrowMode && (
          <Box width={20}>
            <Text bold>Physical ID</Text>
          </Box>
        )}
        <Box width={12}>
          <Text bold>Type</Text>
        </Box>
        <Box width={15}>
          <Text bold>Status</Text>
        </Box>
        {!narrowMode && (
          <Box width={20}>
            <Text bold>Created</Text>
          </Box>
        )}
      </Box>

      {resources.map((resource, index) => {
        const statusColor = getStatusColor(resource.status);
        const statusIcon = getStatusIcon(resource.status);
        const _isEven = index % 2 === 0;

        return (
          <Box key={resource.name} flexDirection="row" paddingX={1}>
            <Box width={narrowMode ? 20 : 25}>
              <Text>{truncate(resource.name, narrowMode ? 18 : 23)}</Text>
            </Box>
            {!narrowMode && (
              <Box width={20}>
                <Text color="gray">
                  {resource.stack && resource.stack !== "unknown"
                    ? truncate(`${resource.stack}/${resource.name}`, 18)
                    : truncate(resource.name, 18)}
                </Text>
              </Box>
            )}
            <Box width={12}>
              <Text color="cyan">{resource.type}</Text>
            </Box>
            <Box width={15}>
              <Text color={statusColor}>
                {statusIcon} {resource.status}
              </Text>
            </Box>
            {!narrowMode && (
              <Box width={20}>
                <Text color="gray">{formatShortDate(resource.createdAt)}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

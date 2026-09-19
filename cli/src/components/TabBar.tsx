import { Box, Text } from "ink";
import type React from "react";
import type { Tab, TabBarProps } from "../types/index.js";

const TABS: Tab[] = [
  { id: "overview", label: "OVERVIEW", shortcut: "1" },
  { id: "resources", label: "RESOURCES", shortcut: "2" },
  { id: "events", label: "EVENTS", shortcut: "3" },
  { id: "files", label: "FILES", shortcut: "4" },
  { id: "config", label: "CONFIG", shortcut: "5" },
];

// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, compact = false }) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="gray">{"─".repeat(compact ? 60 : 80)}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Box key={tab.id}>
              {isActive ? (
                <Box borderStyle="single" borderColor="cyan" paddingX={1} backgroundColor="black">
                  <Text>
                    <Text color="cyan">▓▒░</Text>
                    <Text color="cyan" bold>
                      {" "}
                      [{tab.shortcut}] {tab.label}{" "}
                    </Text>
                    <Text color="cyan">░▒▓</Text>
                  </Text>
                </Box>
              ) : (
                <Box paddingX={1}>
                  <Text color="gray" dimColor>
                    [{tab.shortcut}] {compact ? tab.label.slice(0, 4) : tab.label}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">{"─".repeat(compact ? 60 : 80)}</Text>
      </Box>
    </Box>
  );
};

import { Command } from "commander";
import { Box, render, Text, useApp, useInput, useStdin, useStdout } from "ink";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DetailPanel,
  FileTree,
  ResourceSelectInput,
  ResourceTable,
  TabBar,
} from "../components/index.js";
import type {
  DiscoveredResource,
  ErrorScreenProps,
  FileNode,
  HelpPanelProps,
  LoadingScreenProps,
  SelectItem,
  TabId,
} from "../types/index.js";
import { errorFactories, requireProjectRoot } from "../utils/errors.js";
import { findProjectRoot } from "../utils/paths.js";
import {
  clearMetadataCache,
  discoverResources,
  discoverStacks,
  getResourceMetadata,
  getStackMetadata,
} from "../utils/services.js";
import { isTiltAvailable } from "../utils/tilt.js";

// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => (
  <Box
    borderStyle="single"
    borderColor="cyan"
    paddingX={2}
    paddingY={1}
    flexDirection="column"
    width={60}
  >
    <Text bold color="cyan">
      Keyboard Shortcuts
    </Text>
    <Box marginY={1} flexDirection="column">
      <Text bold underline>
        Navigation
      </Text>
      <Text> ↑/↓ Navigate list items</Text>
      <Text> Enter Select item / Open detail</Text>
      <Text> Space Toggle expand (tree view)</Text>
      <Text> Tab Next tab</Text>
      <Text> 1-5 Direct tab access</Text>

      <Box marginTop={1}>
        <Text bold underline>
          Actions
        </Text>
      </Box>
      <Text> a Toggle all/pre-alpha services</Text>
      <Text> m Toggle mouse support</Text>
      <Text> t Toggle tooltips</Text>
      <Text> e Toggle enabled/disabled services</Text>
      <Text> r Refresh data</Text>
      <Text> / Search/filter</Text>
      <Text> ? Show this help</Text>
      <Text> q/Esc Quit / Back</Text>
    </Box>
    <Box marginTop={1}>
      <Text color="gray" dimColor>
        Press any key to close...
      </Text>
    </Box>
  </Box>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message }) => (
  <Box flexDirection="column" padding={2}>
    <Text bold color="cyan">
      ▓▒░ TDK NEON EDITION ░▒▓
    </Text>
    <Box marginY={1} />
    <Text>Loading: {message}</Text>
    <Box marginY={1} borderStyle="single" borderColor="gray" width={50}>
      <Box width={progress / 2} backgroundColor="cyan">
        <Text>{" ".repeat(progress / 2)}</Text>
      </Box>
      <Text> {progress}%</Text>
    </Box>
  </Box>
);

// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry }) => (
  <Box flexDirection="column" padding={2} alignItems="center">
    <Text bold color="red">
      Connection Error
    </Text>
    <Box marginY={1} />
    <Text color="red">✗ {error}</Text>
    <Box marginY={1} />
    <Text color="gray">Troubleshooting:</Text>
    <Text color="gray"> 1. Is Tilt running? Run: tilt up</Text>
    <Text color="gray"> 2. Check Tiltfile exists</Text>
    <Text color="gray"> 3. Try: tdk status --verbose</Text>
    <Box marginY={1} />
    <Text color="cyan">Press [r] to retry or [q] to quit</Text>
  </Box>
);

const EmptyState: React.FC = () => (
  <Box flexDirection="column" padding={2} alignItems="center">
    <Text bold color="yellow">
      No Services Found
    </Text>
    <Box marginY={1} />
    <Text color="gray">◉ No service.json files found</Text>
    <Box marginY={1} />
    <Text>To get started:</Text>
    <Text> 1. Run: tdk init</Text>
    <Text> 2. Or create services manually</Text>
    <Box marginY={1} />
    <Text color="gray">Press [q] to quit</Text>
  </Box>
);

const TUIApp: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { stdin, setRawMode } = useStdin();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [terminalWidth, setTerminalWidth] = useState(stdout.columns || 120);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mouseEnabled, setMouseEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltips, setShowTooltips] = useState(true);
  const [showEnabledOnly, setShowEnabledOnly] = useState(true);

  const projectRoot = findProjectRoot() || "unknown";

  const { stacks, services } = useMemo(
    () => ({
      stacks: discoverStacks(),
      services: discoverResources(),
    }),
    [],
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (services.length === 0) {
      setError('No services found. Run "tdk init" to get started.');
    } else {
      setError(null);
    }
  }, [services.length]);

  const selectedStackData = useMemo(() => {
    if (!selectedStack) return null;
    const stack = stacks.find((s) => s.name === selectedStack);
    if (!stack) return null;
    return {
      stack,
      metadata: getStackMetadata(stack),
    };
  }, [selectedStack, stacks]);

  const selectedServiceData = useMemo(() => {
    if (!selectedService) return null;
    const service = services.find((s: DiscoveredResource) => s.name === selectedService);
    if (!service) return null;
    return {
      service,
      metadata: getResourceMetadata(service),
    };
  }, [selectedService, services]);

  const filteredStacks = useMemo(() => {
    if (!searchQuery) return stacks;
    return stacks.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.resources.some((svc: { name: string }) =>
          svc.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [stacks, searchQuery]);

  const filteredServices = useMemo(() => {
    let filtered = services;
    if (showEnabledOnly) {
      filtered = filtered.filter((s: DiscoveredResource) => s.config?.enabled !== false);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (s: DiscoveredResource) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.stack || "").toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return filtered;
  }, [services, searchQuery, showEnabledOnly]);

  const getItems = useCallback(() => {
    if (activeTab === "overview") {
      return filteredStacks.map((stack) => ({
        label: `${stack.name} (${stack.resources.length} resources)`,
        value: stack.name,
      }));
    }

    if (activeTab === "resources") {
      if (selectedStackData) {
        return selectedStackData.stack.resources.map((s) => {
          const stackLabel = s.stack && s.stack !== "unknown" ? ` [${s.stack}]` : "";
          const enabledLabel = s.config?.enabled === false ? " [DISABLED]" : "";
          return {
            label: `${s.name}${stackLabel}${enabledLabel}`,
            value: s.name,
          };
        });
      }
      return filteredStacks.map((stack) => ({
        label: `${stack.name} (${stack.resources.length} resources)`,
        value: stack.name,
      }));
    }

    if (activeTab === "files") {
      if (selectedServiceData) {
        return selectedServiceData.metadata.autogeneratedFiles.map((f) => ({
          label: `${f.name} (${f.type})`,
          value: f.path,
        }));
      }
      return filteredServices.map((s: DiscoveredResource) => {
        const stackPrefix = s.stack && s.stack !== "unknown" ? `${s.stack}/` : "";
        const enabledLabel = s.config?.enabled === false ? " [DISABLED]" : "";
        return {
          label: `${stackPrefix}${s.name}${enabledLabel}`,
          value: s.name,
        };
      });
    }

    if (activeTab === "config") {
      return filteredServices.map((s: DiscoveredResource) => {
        const stackPrefix = s.stack && s.stack !== "unknown" ? `${s.stack}/` : "";
        const stackLabel = s.stack ? ` [${s.stack}]` : "";
        const enabledLabel = s.config?.enabled === false ? " [DISABLED]" : "";
        return {
          label: `${stackPrefix}${s.name}${stackLabel}${enabledLabel}`,
          value: s.name,
        };
      });
    }

    return [];
  }, [activeTab, filteredStacks, filteredServices, selectedStackData, selectedServiceData]);

  const items = getItems();

  useEffect(() => {
    if (highlightedIndex >= items.length && items.length > 0) {
      setHighlightedIndex(items.length - 1);
    } else if (items.length === 0) {
      setHighlightedIndex(0);
    }
  }, [highlightedIndex, items.length]);

  const handleSelect = useCallback(
    (item: SelectItem) => {
      if (activeTab === "overview") {
        setSelectedStack(item.value);
        setSelectedService(null);
        setMessage(`Selected stack: ${item.value}`);
        setTimeout(() => setMessage(""), 2000);
      } else if (activeTab === "resources") {
        if (selectedStack && !selectedService) {
          setSelectedService(item.value);
          setMessage(`Selected service: ${item.value}`);
          setTimeout(() => setMessage(""), 2000);
        } else {
          setSelectedStack(item.value);
          setSelectedService(null);
        }
      } else if (activeTab === "files") {
        if (selectedService) {
          setSelectedFile(item.value);
          setMessage(`Selected file: ${item.label}`);
          setTimeout(() => setMessage(""), 2000);
        } else {
          setSelectedService(item.value);
          setMessage(`Selected service: ${item.value}`);
          setTimeout(() => setMessage(""), 2000);
        }
      } else if (activeTab === "config") {
        setSelectedService(item.value);
        setMessage(`Viewing config for: ${item.value}`);
        setTimeout(() => setMessage(""), 2000);
      }
    },
    [activeTab, selectedStack, selectedService],
  );

  useEffect(() => {
    setRawMode(true);

    stdout.write("\x1b[?1000h");
    stdout.write("\x1b[?1006h");

    return () => {
      setRawMode(false);
      stdout.write("\x1b[?1000l");
      stdout.write("\x1b[?1006l");
    };
  }, [setRawMode, stdout]);

  useEffect(() => {
    if (!mouseEnabled) return;

    const handleMouseData = (data: Buffer) => {
      const str = data.toString();

      // Parse SGR 1006 mouse protocol: ESC[<btn;x;yM or ESC[<btn;x;ym
      // biome-ignore lint/suspicious/noControlCharactersInRegex: \\x1b ESC is intentional (ANSI SGR/CSI sequence parsing)
      const sgrMatch = str.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
      if (sgrMatch) {
        const btn = parseInt(sgrMatch[1], 10);
        const _x = parseInt(sgrMatch[2], 10);
        const y = parseInt(sgrMatch[3], 10);
        const release = sgrMatch[4] === "m";

        // Check if it's a left click (btn & 0b11 == 0 means left button)
        const isLeftClick = (btn & 0b11) === 0;

        if (isLeftClick && !release) {
          // Calculate row in the list (header takes ~6 lines)
          const listRow = y - 7; // Adjust for header, tabs, and borders

          if (listRow >= 0 && listRow < items.length) {
            setHighlightedIndex(listRow);
            const item = items[listRow];
            if (item) {
              handleSelect(item);
            }
          }
        }
        return;
      }
    };

    stdin.on("data", handleMouseData);
    return () => {
      stdin.off("data", handleMouseData);
      stdin.removeAllListeners("data");
    };
  }, [stdin, items, mouseEnabled, handleSelect]);

  const handleResize = useCallback(() => {
    setTerminalWidth(stdout.columns || 120);
  }, [stdout.columns]);

  useEffect(() => {
    stdout.on("resize", handleResize);
    return () => {
      stdout.off("resize", handleResize);
    };
  }, [stdout, handleResize]);

  useInput((input, key) => {
    if (error) {
      if (input === "r" || input === "R") {
        setError(null);
        setLoading(true);
        return;
      }
      if (input === "q" || key.escape) {
        exit();
        return;
      }
      return;
    }

    if (showHelp) {
      setShowHelp(false);
      return;
    }

    if (isSearching) {
      if (key.return) {
        setIsSearching(false);
        return;
      }
      if (key.escape) {
        setIsSearching(false);
        setSearchQuery("");
        return;
      }
      if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchQuery((prev) => prev + input);
        return;
      }
      return;
    }

    if (input === "q" && !key.ctrl && !key.meta) {
      exit();
      return;
    }

    if (key.escape) {
      if (selectedFile) {
        setSelectedFile(null);
        return;
      }
      if (selectedService) {
        setSelectedService(null);
        return;
      }
      if (selectedStack) {
        setSelectedStack(null);
        return;
      }
      exit();
      return;
    }

    if (input === "?") {
      setShowHelp(true);
      return;
    }

    if (input === "r") {
      clearMetadataCache();
      setMessage("Data refreshed");
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (input === "/") {
      setIsSearching(true);
      setSearchQuery("");
      setMessage("Search: ");
      return;
    }

    if (input === "m") {
      setMouseEnabled((prev) => {
        const newState = !prev;
        setMessage(newState ? "Mouse support enabled" : "Mouse support disabled");
        return newState;
      });
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (input === "t") {
      setShowTooltips((prev) => {
        const newState = !prev;
        setMessage(newState ? "Tooltips enabled" : "Tooltips disabled");
        return newState;
      });
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (input === "e") {
      setShowEnabledOnly((prev) => {
        const newState = !prev;
        setMessage(
          newState ? "Showing enabled services only" : "Showing all services (including disabled)",
        );
        return newState;
      });
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (key.tab) {
      const tabs: TabId[] = ["overview", "resources", "events", "files", "config"];
      const currentIdx = tabs.indexOf(activeTab);
      const nextIdx = key.shift
        ? (currentIdx - 1 + tabs.length) % tabs.length
        : (currentIdx + 1) % tabs.length;
      setActiveTab(tabs[nextIdx]);
      return;
    }

    if (/^[1-5]$/.test(input)) {
      const tabMap: Record<string, TabId> = {
        "1": "overview",
        "2": "resources",
        "3": "events",
        "4": "files",
        "5": "config",
      };
      setActiveTab(tabMap[input]);
      return;
    }

    if (key.upArrow) {
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
    if (key.downArrow) {
      setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    }
    if (key.return || input === " ") {
      const currentItem = items[highlightedIndex];
      if (currentItem) {
        handleSelect(currentItem);
      }
      return;
    }
  });

  const fileTreeNodes: FileNode[] = useMemo(() => {
    if (selectedServiceData) {
      return [
        {
          name: selectedServiceData.service.name,
          path: selectedServiceData.service.path,
          type: "directory",
          children: selectedServiceData.metadata.autogeneratedFiles.map((f) => ({
            name: f.name,
            path: f.path,
            type: "file",
            fileType: f.type,
            size: f.size,
            lastModified: f.lastModified,
          })),
        },
      ];
    }
    return services.map((s: DiscoveredResource) => ({
      name: s.name,
      path: s.path,
      type: "directory",
      children: [],
    }));
  }, [selectedServiceData, services]);

  const showSidebar = terminalWidth > 100;
  const compactTabBar = terminalWidth < 100;
  const compact = terminalWidth < 80;

  if (loading) {
    return <LoadingScreen progress={100} message="Initializing..." />;
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
        }}
      />
    );
  }

  if (services.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box flexDirection="column" height={stdout.rows || 24}>
      <Box paddingX={1} paddingY={0}>
        <Text>
          <Text color="cyan" bold>
            ▓▒░ TDK NEON EDITION ░▒▓
          </Text>
          <Text color="gray"> │ </Text>
          <Text color="white">{projectRoot}</Text>
          <Text color="gray"> │ </Text>
          <Text color="green">{services.length} services ready</Text>
        </Text>
      </Box>

      <Box paddingX={1}>
        <Text color="gray">{"─".repeat(compact ? 60 : Math.min(terminalWidth - 4, 100))}</Text>
      </Box>

      {isSearching && (
        <Box paddingX={1} height={1}>
          <Text color="yellow">Search: {searchQuery}_</Text>
        </Box>
      )}

      {!isSearching && message && (
        <Box paddingX={1} height={1}>
          <Text color="cyan">▓▒░ {message} ░▒▓</Text>
        </Box>
      )}

      {!isSearching && !message && showTooltips && !showHelp && (
        <Box paddingX={1} height={1}>
          <Text color="gray" dimColor>
            {activeTab === "overview" && selectedStack
              ? `Stack "${selectedStack}" selected. [Enter] view │ [Esc] back │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
              : activeTab === "overview" && !selectedStack
                ? `[↑/↓] Navigate │ [Enter] Select │ [a] Pre-alpha │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                : activeTab === "resources"
                  ? `[Tab] Tabs │ [r] Refresh │ [/] Search │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                  : activeTab === "events"
                    ? `Event timeline │ [Tab] Switch tabs │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                    : activeTab === "files" && selectedService
                      ? `Service "${selectedService}" │ [Space] Expand │ [Esc] Back │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                      : activeTab === "files"
                        ? `Select service to view files │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                        : activeTab === "config"
                          ? `View configurations │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                          : `[Tab] Next │ [1-5] Tabs │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help │ [q] Quit`}
          </Text>
        </Box>
      )}

      {showHelp && (
        <Box paddingX={1} flexGrow={1}>
          <HelpPanel onClose={() => setShowHelp(false)} />
        </Box>
      )}

      {!showHelp && (
        <>
          <Box marginTop={1}>
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} compact={compactTabBar} />
          </Box>

          <Box flexDirection="row" paddingX={1} flexGrow={1}>
            <Box
              flexDirection="column"
              flexGrow={1}
              width={showSidebar ? terminalWidth - 45 : terminalWidth - 4}
            >
              {activeTab === "overview" && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">
                      ┌─ Stacks ─
                    </Text>
                  </Box>
                  <Box marginTop={1} flexGrow={1}>
                    <ResourceSelectInput
                      items={items}
                      onSelect={handleSelect}
                      highlightedIndex={highlightedIndex}
                    />
                  </Box>
                </>
              )}

              {activeTab === "resources" && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">
                      ┌─ Resources ─
                    </Text>
                  </Box>
                  {selectedStackData ? (
                    <>
                      <Text color="gray">Stack: {selectedStackData.stack.name}</Text>
                      <Box marginTop={1}>
                        <ResourceTable
                          resources={selectedStackData.metadata.resources}
                          maxWidth={terminalWidth - (showSidebar ? 50 : 10)}
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Text color="gray">Select a stack to view resources</Text>
                      <Box marginTop={1}>
                        <ResourceSelectInput
                          items={items}
                          onSelect={handleSelect}
                          highlightedIndex={highlightedIndex}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}

              {activeTab === "events" && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">
                      ┌─ Events ─
                    </Text>
                  </Box>
                  <Box marginTop={1}>
                    <Text color="gray">Events tab not yet implemented</Text>
                  </Box>
                </>
              )}

              {activeTab === "files" && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">
                      ┌─ Autogenerated Files ─
                    </Text>
                  </Box>
                  {selectedServiceData ? (
                    <>
                      <Text color="gray">Service: {selectedServiceData.service.name}</Text>
                      <Box marginTop={1}>
                        <FileTree nodes={fileTreeNodes} selectedPath={selectedFile || undefined} />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Text color="gray">Select a service to view files</Text>
                      <Box marginTop={1}>
                        <ResourceSelectInput
                          items={items}
                          onSelect={handleSelect}
                          highlightedIndex={highlightedIndex}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}

              {activeTab === "config" && (
                <>
                  <Box marginBottom={1}>
                    <Text bold color="gray">
                      ┌─ Configuration ─
                    </Text>
                  </Box>
                  {selectedServiceData ? (
                    <Box marginTop={1} flexDirection="column">
                      <Text color="cyan">{selectedServiceData.service.configPath}</Text>
                      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
                        <Text color="gray" wrap="wrap">
                          {JSON.stringify(selectedServiceData.service.config, null, 2).slice(
                            0,
                            1000,
                          )}
                        </Text>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Text color="gray">Select a service to view configuration</Text>
                      <Box marginTop={1}>
                        <ResourceSelectInput
                          items={items}
                          onSelect={handleSelect}
                          highlightedIndex={highlightedIndex}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>

            {showSidebar && (
              <Box marginLeft={2}>
                <DetailPanel
                  stack={selectedStackData?.stack || null}
                  service={selectedServiceData?.service || null}
                  stackMetadata={selectedStackData?.metadata || null}
                  visible={!!selectedStack || !!selectedService}
                />
              </Box>
            )}
          </Box>

          <Box
            borderStyle="single"
            borderColor="gray"
            paddingX={1}
            height={3}
            flexDirection="column"
            marginTop={1}
          >
            <Box justifyContent="space-between">
              <Text color="cyan" bold>
                ▓▒░ {activeTab}
              </Text>
              <Text color="green">
                ● {services.filter((s: DiscoveredResource) => s.stack).length} in stack
              </Text>
              <Text color="yellow">
                ○ {services.filter((s: DiscoveredResource) => !s.stack).length} no stack
              </Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Stacks: {stacks.length}</Text>
              <Text color="gray">Services: {services.length}</Text>
              <Text color="gray">
                🖱️ {mouseEnabled ? "ON" : "OFF"} │ ℹ️ {showTooltips ? "ON" : "OFF"} │
                <Text color={showEnabledOnly ? "green" : "yellow"}>
                  {showEnabledOnly ? "✓ enabled" : "✓ all"}
                </Text>
                {" │ "}
                [?] Help │ [q] Quit
              </Text>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export const uiCommand = new Command("ui")
  .description("Interactive TUI for managing stacks and services (Neon Edition)")
  .alias("interactive")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("--no-animations", "Disable animations")
  .option("--high-contrast", "Enable high contrast mode")
  .action(async () => {
    const tiltAvailable = await isTiltAvailable();
    if (!tiltAvailable) {
      errorFactories.tiltNotInstalled().exit();
    }

    requireProjectRoot();
    render(<TUIApp />);
  });

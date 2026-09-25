import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Command } from "commander";
import { Box, render, Text, useApp, useInput, useStdin, useStdout } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DetailPanel, FileTree, ResourceSelectInput, ResourceTable, TabBar, } from "../components/index.js";
import { errorFactories, requireProjectRoot } from "../utils/errors.js";
import { findProjectRoot } from "../utils/paths.js";
import { clearMetadataCache, discoverResources, discoverStacks, getResourceMetadata, getStackMetadata, } from "../utils/services.js";
import { isTiltAvailable } from "../utils/tilt.js";
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const HelpPanel = ({ onClose }) => (_jsxs(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 2, paddingY: 1, flexDirection: "column", width: 60, children: [_jsx(Text, { bold: true, color: "cyan", children: "Keyboard Shortcuts" }), _jsxs(Box, { marginY: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, underline: true, children: "Navigation" }), _jsx(Text, { children: " \u2191/\u2193 Navigate list items" }), _jsx(Text, { children: " Enter Select item / Open detail" }), _jsx(Text, { children: " Space Toggle expand (tree view)" }), _jsx(Text, { children: " Tab Next tab" }), _jsx(Text, { children: " 1-5 Direct tab access" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { bold: true, underline: true, children: "Actions" }) }), _jsx(Text, { children: " a Toggle all/pre-alpha services" }), _jsx(Text, { children: " m Toggle mouse support" }), _jsx(Text, { children: " t Toggle tooltips" }), _jsx(Text, { children: " e Toggle enabled/disabled services" }), _jsx(Text, { children: " r Refresh data" }), _jsx(Text, { children: " / Search/filter" }), _jsx(Text, { children: " ? Show this help" }), _jsx(Text, { children: " q/Esc Quit / Back" })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: "Press any key to close..." }) })] }));
const LoadingScreen = ({ progress, message }) => (_jsxs(Box, { flexDirection: "column", padding: 2, children: [_jsx(Text, { bold: true, color: "cyan", children: "\u2593\u2592\u2591 TDK NEON EDITION \u2591\u2592\u2593" }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { children: ["Loading: ", message] }), _jsxs(Box, { marginY: 1, borderStyle: "single", borderColor: "gray", width: 50, children: [_jsx(Box, { width: progress / 2, backgroundColor: "cyan", children: _jsx(Text, { children: " ".repeat(progress / 2) }) }), _jsxs(Text, { children: [" ", progress, "%"] })] })] }));
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const ErrorScreen = ({ error, onRetry }) => (_jsxs(Box, { flexDirection: "column", padding: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: "red", children: "Connection Error" }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { color: "red", children: ["\u2717 ", error] }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "gray", children: "Troubleshooting:" }), _jsx(Text, { color: "gray", children: " 1. Is Tilt running? Run: tilt up" }), _jsx(Text, { color: "gray", children: " 2. Check Tiltfile exists" }), _jsx(Text, { color: "gray", children: " 3. Try: tdk status --verbose" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "cyan", children: "Press [r] to retry or [q] to quit" })] }));
const EmptyState = () => (_jsxs(Box, { flexDirection: "column", padding: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: "yellow", children: "No Services Found" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "gray", children: "\u25C9 No service.json files found" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { children: "To get started:" }), _jsx(Text, { children: " 1. Run: tdk init" }), _jsx(Text, { children: " 2. Or create services manually" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "gray", children: "Press [q] to quit" })] }));
const TUIApp = () => {
    const { exit } = useApp();
    const { stdout } = useStdout();
    const { stdin, setRawMode } = useStdin();
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedStack, setSelectedStack] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [message, setMessage] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [showHelp, setShowHelp] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [terminalWidth, setTerminalWidth] = useState(stdout.columns || 120);
    const [selectedFile, setSelectedFile] = useState(null);
    const [mouseEnabled, setMouseEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTooltips, setShowTooltips] = useState(true);
    const [showEnabledOnly, setShowEnabledOnly] = useState(true);
    const projectRoot = findProjectRoot() || "unknown";
    const { stacks, services } = useMemo(() => ({
        stacks: discoverStacks(),
        services: discoverResources(),
    }), []);
    useEffect(() => {
        setLoading(false);
    }, []);
    useEffect(() => {
        if (services.length === 0) {
            setError('No services found. Run "tdk init" to get started.');
        }
        else {
            setError(null);
        }
    }, [services.length]);
    const selectedStackData = useMemo(() => {
        if (!selectedStack)
            return null;
        const stack = stacks.find((s) => s.name === selectedStack);
        if (!stack)
            return null;
        return {
            stack,
            metadata: getStackMetadata(stack),
        };
    }, [selectedStack, stacks]);
    const selectedServiceData = useMemo(() => {
        if (!selectedService)
            return null;
        const service = services.find((s) => s.name === selectedService);
        if (!service)
            return null;
        return {
            service,
            metadata: getResourceMetadata(service),
        };
    }, [selectedService, services]);
    const filteredStacks = useMemo(() => {
        if (!searchQuery)
            return stacks;
        return stacks.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.resources.some((svc) => svc.name.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [stacks, searchQuery]);
    const filteredServices = useMemo(() => {
        let filtered = services;
        if (showEnabledOnly) {
            filtered = filtered.filter((s) => s.config?.enabled !== false);
        }
        if (searchQuery) {
            filtered = filtered.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.stack || "").toLowerCase().includes(searchQuery.toLowerCase()));
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
            return filteredServices.map((s) => {
                const stackPrefix = s.stack && s.stack !== "unknown" ? `${s.stack}/` : "";
                const enabledLabel = s.config?.enabled === false ? " [DISABLED]" : "";
                return {
                    label: `${stackPrefix}${s.name}${enabledLabel}`,
                    value: s.name,
                };
            });
        }
        if (activeTab === "config") {
            return filteredServices.map((s) => {
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
        }
        else if (items.length === 0) {
            setHighlightedIndex(0);
        }
    }, [highlightedIndex, items.length]);
    const handleSelect = useCallback((item) => {
        if (activeTab === "overview") {
            setSelectedStack(item.value);
            setSelectedService(null);
            setMessage(`Selected stack: ${item.value}`);
            setTimeout(() => setMessage(""), 2000);
        }
        else if (activeTab === "resources") {
            if (selectedStack && !selectedService) {
                setSelectedService(item.value);
                setMessage(`Selected service: ${item.value}`);
                setTimeout(() => setMessage(""), 2000);
            }
            else {
                setSelectedStack(item.value);
                setSelectedService(null);
            }
        }
        else if (activeTab === "files") {
            if (selectedService) {
                setSelectedFile(item.value);
                setMessage(`Selected file: ${item.label}`);
                setTimeout(() => setMessage(""), 2000);
            }
            else {
                setSelectedService(item.value);
                setMessage(`Selected service: ${item.value}`);
                setTimeout(() => setMessage(""), 2000);
            }
        }
        else if (activeTab === "config") {
            setSelectedService(item.value);
            setMessage(`Viewing config for: ${item.value}`);
            setTimeout(() => setMessage(""), 2000);
        }
    }, [activeTab, selectedStack, selectedService]);
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
        if (!mouseEnabled)
            return;
        const handleMouseData = (data) => {
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
                setMessage(newState ? "Showing enabled services only" : "Showing all services (including disabled)");
                return newState;
            });
            setTimeout(() => setMessage(""), 1500);
            return;
        }
        if (key.tab) {
            const tabs = ["overview", "resources", "events", "files", "config"];
            const currentIdx = tabs.indexOf(activeTab);
            const nextIdx = key.shift
                ? (currentIdx - 1 + tabs.length) % tabs.length
                : (currentIdx + 1) % tabs.length;
            setActiveTab(tabs[nextIdx]);
            return;
        }
        if (/^[1-5]$/.test(input)) {
            const tabMap = {
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
    const fileTreeNodes = useMemo(() => {
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
        return services.map((s) => ({
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
        return _jsx(LoadingScreen, { progress: 100, message: "Initializing..." });
    }
    if (error) {
        return (_jsx(ErrorScreen, { error: error, onRetry: () => {
                setError(null);
                setLoading(true);
            } }));
    }
    if (services.length === 0) {
        return _jsx(EmptyState, {});
    }
    return (_jsxs(Box, { flexDirection: "column", height: stdout.rows || 24, children: [_jsx(Box, { paddingX: 1, paddingY: 0, children: _jsxs(Text, { children: [_jsx(Text, { color: "cyan", bold: true, children: "\u2593\u2592\u2591 TDK NEON EDITION \u2591\u2592\u2593" }), _jsx(Text, { color: "gray", children: " \u2502 " }), _jsx(Text, { color: "white", children: projectRoot }), _jsx(Text, { color: "gray", children: " \u2502 " }), _jsxs(Text, { color: "green", children: [services.length, " services ready"] })] }) }), _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: "gray", children: "─".repeat(compact ? 60 : Math.min(terminalWidth - 4, 100)) }) }), isSearching && (_jsx(Box, { paddingX: 1, height: 1, children: _jsxs(Text, { color: "yellow", children: ["Search: ", searchQuery, "_"] }) })), !isSearching && message && (_jsx(Box, { paddingX: 1, height: 1, children: _jsxs(Text, { color: "cyan", children: ["\u2593\u2592\u2591 ", message, " \u2591\u2592\u2593"] }) })), !isSearching && !message && showTooltips && !showHelp && (_jsx(Box, { paddingX: 1, height: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: activeTab === "overview" && selectedStack
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
                                                : `[Tab] Next │ [1-5] Tabs │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help │ [q] Quit` }) })), showHelp && (_jsx(Box, { paddingX: 1, flexGrow: 1, children: _jsx(HelpPanel, { onClose: () => setShowHelp(false) }) })), !showHelp && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(TabBar, { activeTab: activeTab, onTabChange: setActiveTab, compact: compactTabBar }) }), _jsxs(Box, { flexDirection: "row", paddingX: 1, flexGrow: 1, children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, width: showSidebar ? terminalWidth - 45 : terminalWidth - 4, children: [activeTab === "overview" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Stacks \u2500" }) }), _jsx(Box, { marginTop: 1, flexGrow: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex }) })] })), activeTab === "resources" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Resources \u2500" }) }), selectedStackData ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "gray", children: ["Stack: ", selectedStackData.stack.name] }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceTable, { resources: selectedStackData.metadata.resources, maxWidth: terminalWidth - (showSidebar ? 50 : 10) }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select a stack to view resources" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex }) })] }))] })), activeTab === "events" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Events \u2500" }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Events tab not yet implemented" }) })] })), activeTab === "files" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Autogenerated Files \u2500" }) }), selectedServiceData ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "gray", children: ["Service: ", selectedServiceData.service.name] }), _jsx(Box, { marginTop: 1, children: _jsx(FileTree, { nodes: fileTreeNodes, selectedPath: selectedFile || undefined }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select a service to view files" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex }) })] }))] })), activeTab === "config" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Configuration \u2500" }) }), selectedServiceData ? (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: selectedServiceData.service.configPath }), _jsx(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsx(Text, { color: "gray", wrap: "wrap", children: JSON.stringify(selectedServiceData.service.config, null, 2).slice(0, 1000) }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select a service to view configuration" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex }) })] }))] }))] }), showSidebar && (_jsx(Box, { marginLeft: 2, children: _jsx(DetailPanel, { stack: selectedStackData?.stack || null, service: selectedServiceData?.service || null, stackMetadata: selectedStackData?.metadata || null, visible: !!selectedStack || !!selectedService }) }))] }), _jsxs(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, height: 3, flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { color: "cyan", bold: true, children: ["\u2593\u2592\u2591 ", activeTab] }), _jsxs(Text, { color: "green", children: ["\u25CF ", services.filter((s) => s.stack).length, " in stack"] }), _jsxs(Text, { color: "yellow", children: ["\u25CB ", services.filter((s) => !s.stack).length, " no stack"] })] }), _jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { color: "gray", children: ["Stacks: ", stacks.length] }), _jsxs(Text, { color: "gray", children: ["Services: ", services.length] }), _jsxs(Text, { color: "gray", children: ["\uD83D\uDDB1\uFE0F ", mouseEnabled ? "ON" : "OFF", " \u2502 \u2139\uFE0F ", showTooltips ? "ON" : "OFF", " \u2502", _jsx(Text, { color: showEnabledOnly ? "green" : "yellow", children: showEnabledOnly ? "✓ enabled" : "✓ all" }), " │ ", "[?] Help \u2502 [q] Quit"] })] })] })] }))] }));
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
    render(_jsx(TUIApp, {}));
});
//# sourceMappingURL=ui.js.map
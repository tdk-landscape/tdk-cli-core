import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Command } from "commander";
import { Box, render, Text, useApp, useInput, useStdin, useStdout } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DetailPanel, FileTree, ResourceSelectInput, ResourceTable, TabBar, TUIHeader, } from "../components/index.js";
import { errorFactories, requireProjectRoot } from "../utils/errors.js";
import { findProjectRoot, getPackageVersion } from "../utils/paths.js";
import { describeSearch } from "../utils/search-status.js";
import { clearMetadataCache, discoverResources, discoverStacks, getResourceMetadata, getStackMetadata, } from "../utils/services.js";
import { createStatusMessageController } from "../utils/status-message.js";
import { getListRowFromMouseY, getTerminalRuleWidth } from "../utils/terminal-layout.js";
import { isTiltAvailable } from "../utils/tilt.js";
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const HelpPanel = ({ onClose }) => (_jsxs(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 2, paddingY: 1, flexDirection: "column", width: 60, children: [_jsx(Text, { bold: true, color: "cyan", children: "Keyboard Shortcuts" }), _jsxs(Box, { marginY: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, underline: true, children: "Navigation" }), _jsx(Text, { children: " \u2191/\u2193 or j/k Navigate list items" }), _jsx(Text, { children: " g/G or Home/End First/last item" }), _jsx(Text, { children: " PgUp/PgDn Move one page" }), _jsx(Text, { children: " Enter Select item / Open detail" }), _jsx(Text, { children: " Space Toggle expand (tree view)" }), _jsx(Text, { children: " Tab Next tab" }), _jsx(Text, { children: " 1-5 Direct tab access" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { bold: true, underline: true, children: "Actions" }) }), _jsx(Text, { children: " m Toggle mouse support" }), _jsx(Text, { children: " t Toggle tooltips" }), _jsx(Text, { children: " e Toggle enabled/disabled services" }), _jsx(Text, { children: " r Refresh data" }), _jsx(Text, { children: " / Search/filter" }), _jsx(Text, { children: " ? Show this help" }), _jsx(Text, { children: " q Quit \u2502 Esc Back" })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: "Press any key to close..." }) })] }));
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export const LoadingScreen = ({ message = "Discovering resources...", animated = true, }) => {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        if (!animated)
            return;
        const timer = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 80);
        return () => clearInterval(timer);
    }, [animated]);
    return (_jsxs(Box, { flexDirection: "column", padding: 2, children: [_jsx(Text, { bold: true, color: "cyan", children: "\u2593\u2592\u2591 TDK NEON EDITION \u2591\u2592\u2593" }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { children: [animated && _jsxs(Text, { color: "cyan", children: [SPINNER_FRAMES[frame], " "] }), message] })] }));
};
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const ErrorScreen = ({ error, onRetry }) => (_jsxs(Box, { flexDirection: "column", padding: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: "red", children: "Could Not Load Services" }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { color: "red", children: ["\u2717 ", error] }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "gray", children: "Troubleshooting:" }), _jsx(Text, { color: "gray", children: " 1. Check that every service.json is valid JSON" }), _jsx(Text, { color: "gray", children: " 2. Run tdk from your project (the folder with the Tiltfile)" }), _jsx(Text, { color: "gray", children: " 3. Try: tdk status --verbose" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "cyan", children: "Press [r] to retry or [q] to quit" })] }));
const EmptyState = ({ message }) => (_jsxs(Box, { flexDirection: "column", padding: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: "yellow", children: "No Services Found" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "gray", children: "\u25C9 No service.json files found" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { children: "To get started:" }), _jsx(Text, { children: " 1. Run: tdk project" }), _jsx(Text, { children: " 2. Run: tdk resource api --type backend" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: "cyan", children: "Press [r] to refresh or [q] to quit" }), message && (_jsx(Box, { paddingX: 1, height: 1, children: _jsxs(Text, { color: "cyan", children: ["\u2593\u2592\u2591 ", message, " \u2591\u2592\u2593"] }) }))] }));
export const TUIApp = ({ animated = true }) => {
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
    const [terminalRows, setTerminalRows] = useState(stdout.rows || 24);
    const [selectedFile, setSelectedFile] = useState(null);
    const [mouseEnabled, setMouseEnabled] = useState(true);
    const [listTop, setListTop] = useState(null);
    const [listStart, setListStart] = useState(0);
    // Reserve the header, tab bar, hints and footer; keep the cursor visible.
    const pageSize = Math.max(1, terminalRows - 14);
    const handleListLayout = useCallback((top, firstVisible = 0) => {
        setListTop(top);
        setListStart(firstVisible);
    }, []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTooltips, setShowTooltips] = useState(true);
    const [showEnabledOnly, setShowEnabledOnly] = useState(true);
    const statusMessage = useMemo(() => createStatusMessageController(setMessage), []);
    useEffect(() => () => statusMessage.dispose(), [statusMessage]);
    const projectRoot = findProjectRoot() || "unknown";
    const [{ stacks, services }, setDiscovered] = useState({ stacks: [], services: [] });
    // Re-read service.json files from disk. An empty project is not an error:
    // it renders EmptyState. Only a failed discovery shows ErrorScreen.
    const refresh = useCallback(() => {
        clearMetadataCache();
        try {
            setDiscovered({ stacks: discoverStacks(), services: discoverResources() });
            setError(null);
            return true;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return false;
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        refresh();
    }, [refresh]);
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
    const items = useMemo(getItems, [getItems]);
    const selectableListVisible = !loading &&
        !error &&
        !showHelp &&
        (activeTab === "overview" ||
            (activeTab === "resources" && !selectedStackData) ||
            (activeTab === "files" && !selectedServiceData) ||
            (activeTab === "config" && !selectedServiceData));
    // Only the stack and service lists are filtered by the query; drilled-in views are not.
    const searchList = activeTab === "overview" || (activeTab === "resources" && !selectedStackData)
        ? { total: stacks.length }
        : (activeTab === "files" && !selectedServiceData) || activeTab === "config"
            ? { total: services.length }
            : null;
    const searchStatus = searchList
        ? describeSearch(searchQuery, items.length, searchList.total)
        : null;
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
            statusMessage.show(`Selected stack: ${item.value}`, 2000);
        }
        else if (activeTab === "resources") {
            if (selectedStack && !selectedService) {
                setSelectedService(item.value);
                statusMessage.show(`Selected service: ${item.value}`, 2000);
            }
            else {
                setSelectedStack(item.value);
                setSelectedService(null);
            }
        }
        else if (activeTab === "files") {
            if (selectedService) {
                setSelectedFile(item.value);
                statusMessage.show(`Selected file: ${item.label}`, 2000);
            }
            else {
                setSelectedService(item.value);
                statusMessage.show(`Selected service: ${item.value}`, 2000);
            }
        }
        else if (activeTab === "config") {
            setSelectedService(item.value);
            statusMessage.show(`Viewing config for: ${item.value}`, 2000);
        }
    }, [activeTab, selectedStack, selectedService, statusMessage]);
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
                    const listRow = selectableListVisible && listTop !== null ? getListRowFromMouseY(y, listTop) : -1;
                    const itemIndex = listStart + listRow;
                    if (listRow >= 0 && listRow < pageSize && itemIndex < items.length) {
                        setHighlightedIndex(itemIndex);
                        const item = items[itemIndex];
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
    }, [
        stdin,
        items,
        listTop,
        listStart,
        pageSize,
        selectableListVisible,
        mouseEnabled,
        handleSelect,
    ]);
    const handleResize = useCallback(() => {
        setTerminalWidth(stdout.columns || 120);
        setTerminalRows(stdout.rows || 24);
    }, [stdout]);
    useEffect(() => {
        stdout.on("resize", handleResize);
        return () => {
            stdout.off("resize", handleResize);
        };
    }, [stdout, handleResize]);
    useInput((input, key) => {
        if (error) {
            if (input === "r" || input === "R") {
                refresh();
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
            statusMessage.show("Press q to quit", 2000);
            return;
        }
        if (input === "?") {
            setShowHelp(true);
            return;
        }
        if (input === "r") {
            if (refresh()) {
                statusMessage.show("Data refreshed", 1500);
            }
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
                statusMessage.show(newState ? "Mouse support enabled" : "Mouse support disabled");
                return newState;
            });
            return;
        }
        if (input === "t") {
            setShowTooltips((prev) => {
                const newState = !prev;
                statusMessage.show(newState ? "Tooltips enabled" : "Tooltips disabled");
                return newState;
            });
            return;
        }
        if (input === "e") {
            setShowEnabledOnly((prev) => {
                const newState = !prev;
                statusMessage.show(newState ? "Showing enabled services only" : "Showing all services (including disabled)", 1500);
                return newState;
            });
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
        const plainKey = !key.ctrl && !key.meta;
        if (items.length > 0 && (key.upArrow || (plainKey && input === "k"))) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        }
        if (items.length > 0 && (key.downArrow || (plainKey && input === "j"))) {
            setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        }
        if (key.home || (plainKey && input === "g"))
            setHighlightedIndex(0);
        if (key.end || (plainKey && input === "G"))
            setHighlightedIndex(Math.max(0, items.length - 1));
        if (key.pageUp)
            setHighlightedIndex((prev) => Math.max(0, prev - pageSize));
        if (key.pageDown)
            setHighlightedIndex((prev) => Math.min(Math.max(0, items.length - 1), prev + pageSize));
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
    const mainPanelWidth = showSidebar ? terminalWidth - 45 : terminalWidth - 4;
    if (loading) {
        return _jsx(LoadingScreen, { message: "Discovering resources...", animated: animated });
    }
    if (error) {
        return _jsx(ErrorScreen, { error: error, onRetry: refresh });
    }
    const header = (_jsxs(_Fragment, { children: [_jsx(TUIHeader, { projectRoot: projectRoot, resourceCount: services.length, terminalWidth: terminalWidth, version: getPackageVersion() }), _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: "gray", children: "─".repeat(getTerminalRuleWidth(terminalWidth)) }) })] }));
    if (services.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", height: stdout.rows || 24, children: [header, _jsx(EmptyState, { message: message })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", height: stdout.rows || 24, children: [header, isSearching && (_jsxs(Box, { paddingX: 1, height: 1, children: [_jsxs(Text, { color: "yellow", children: ["Search: ", searchQuery, "_"] }), searchStatus && _jsx(Text, { color: "gray", dimColor: true, children: `   ${searchStatus.summary}` })] })), searchStatus?.emptyMessage && (_jsx(Box, { paddingX: 1, height: 1, children: _jsx(Text, { color: "gray", children: searchStatus.emptyMessage }) })), !isSearching && message && (_jsx(Box, { paddingX: 1, height: 1, children: _jsxs(Text, { color: "cyan", children: ["\u2593\u2592\u2591 ", message, " \u2591\u2592\u2593"] }) })), !isSearching && !message && showTooltips && !showHelp && (_jsx(Box, { paddingX: 1, height: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: activeTab === "overview" && selectedStack
                        ? `Stack "${selectedStack}" selected. [Enter] view │ [Esc] back │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
                        : activeTab === "overview" && !selectedStack
                            ? `[↑/↓] Navigate │ [Enter] Select │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help`
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
                                                : `[Tab] Next │ [1-5] Tabs │ [e] ${showEnabledOnly ? "show all" : "enabled only"} │ [?] help │ [q] Quit` }) })), showHelp && (_jsx(Box, { paddingX: 1, flexGrow: 1, children: _jsx(HelpPanel, { onClose: () => setShowHelp(false) }) })), !showHelp && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(TabBar, { activeTab: activeTab, onTabChange: setActiveTab, terminalWidth: terminalWidth }) }), _jsxs(Box, { flexDirection: "row", paddingX: 1, flexGrow: 1, children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, width: mainPanelWidth, children: [activeTab === "overview" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Stacks \u2500" }) }), _jsx(Box, { marginTop: 1, flexGrow: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] })), activeTab === "resources" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Resources \u2500" }) }), selectedStackData ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "gray", children: ["Stack: ", selectedStackData.stack.name] }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceTable, { resources: selectedStackData.metadata.resources, maxWidth: terminalWidth - (showSidebar ? 50 : 10) }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select a stack to view resources" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] }))] })), activeTab === "events" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Events \u2500" }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Events tab not yet implemented" }) })] })), activeTab === "files" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Autogenerated Files \u2500" }) }), selectedServiceData ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "gray", children: ["Service: ", selectedServiceData.service.name] }), _jsx(Box, { marginTop: 1, children: _jsx(FileTree, { nodes: fileTreeNodes, selectedPath: selectedFile || undefined }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select a service to view files" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] }))] })), activeTab === "config" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: "\u250C\u2500 Configuration \u2500" }) }), selectedServiceData ? (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: selectedServiceData.service.configPath }), _jsx(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsx(Text, { color: "gray", wrap: "wrap", children: JSON.stringify(selectedServiceData.service.config, null, 2).slice(0, 1000) }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select a service to view configuration" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] }))] }))] }), showSidebar && (_jsx(Box, { marginLeft: 2, children: _jsx(DetailPanel, { stack: selectedStackData?.stack || null, service: selectedServiceData?.service || null, stackMetadata: selectedStackData?.metadata || null, visible: !!selectedStack || !!selectedService }) }))] }), _jsxs(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, height: 3, flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { color: "cyan", bold: true, children: ["\u2593\u2592\u2591 ", activeTab] }), _jsxs(Text, { color: "green", children: ["\u25CF ", services.filter((s) => s.stack).length, " in stack"] }), _jsxs(Text, { color: "yellow", children: ["\u25CB ", services.filter((s) => !s.stack).length, " no stack"] })] }), _jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { color: "gray", children: ["Stacks: ", stacks.length] }), _jsxs(Text, { color: "gray", children: ["Services: ", services.length] }), _jsxs(Text, { color: "gray", children: ["\uD83D\uDDB1\uFE0F ", mouseEnabled ? "ON" : "OFF", " \u2502 \u2139\uFE0F ", showTooltips ? "ON" : "OFF", " \u2502", _jsx(Text, { color: showEnabledOnly ? "green" : "yellow", children: showEnabledOnly ? "✓ enabled" : "✓ all" }), " │ ", "[?] Help \u2502 [q] Quit"] })] })] })] }))] }));
};
export const uiCommand = new Command("ui")
    .description("Interactive TUI for managing stacks and services (Neon Edition)")
    .alias("interactive")
    .option("-v, --verbose", "Enable verbose output", false)
    .option("--no-animations", "Disable animations")
    .option("--high-contrast", "Enable high contrast mode")
    .action(async (options) => {
    const tiltAvailable = await isTiltAvailable();
    if (!tiltAvailable) {
        errorFactories.tiltNotInstalled().exit();
    }
    requireProjectRoot();
    // The app has no Static content, so its live layout starts at row 1 in the alternate screen.
    render(_jsx(TUIApp, { animated: options.animations }), { alternateScreen: true });
});
//# sourceMappingURL=ui.js.map
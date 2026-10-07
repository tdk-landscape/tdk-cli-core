import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Command } from "commander";
import { Box, render, Text, useApp, useInput, useStdin, useStdout } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DetailPanel, FileTree, ResourceSelectInput, ResourceTable, ServiceIssues, TabBar, TUIHeader, } from "../components/index.js";
import { TABS } from "../components/TabBar.js";
import { createTUITheme, TUIThemeContext, useTUITheme } from "../components/ui-theme.js";
import { errorFactories, requireProjectRoot } from "../utils/errors.js";
import { findProjectRoot, getPackageVersion } from "../utils/paths.js";
import { describeSearch } from "../utils/search-status.js";
import { clearMetadataCache, discoverResources, discoverStacks, getResourceMetadata, getStackMetadata, } from "../utils/services.js";
import { createStatusMessageController } from "../utils/status-message.js";
import { getListRowFromMouseY, getTerminalRuleWidth } from "../utils/terminal-layout.js";
import { isTiltAvailable } from "../utils/tilt.js";
import { applyServiceStates, fetchServiceStates, } from "../utils/ui-service-state.js";
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const HelpPanel = ({ onClose }) => {
    const theme = useTUITheme();
    return (_jsxs(Box, { ...(theme.ascii ? {} : { borderStyle: "single", borderColor: theme.accent }), paddingX: 2, paddingY: 1, flexDirection: "column", width: 60, children: [_jsx(Text, { bold: true, color: theme.accent, children: "Keyboard Shortcuts" }), _jsxs(Box, { marginY: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, underline: true, color: theme.foreground, children: "Navigation" }), _jsx(Text, { color: theme.foreground, children: theme.ascii
                            ? " [UP/DOWN] or j/k Navigate list items"
                            : " \u2191/\u2193 or j/k Navigate list items" }), _jsx(Text, { color: theme.foreground, children: " g/G or Home/End First/last item" }), _jsx(Text, { color: theme.foreground, children: " PgUp/PgDn Move one page" }), _jsx(Text, { color: theme.foreground, children: " Enter Select item / Open detail" }), _jsx(Text, { color: theme.foreground, children: " Tab Next tab" }), _jsxs(Text, { color: theme.foreground, children: [" ", TABS[0].shortcut, "-", TABS[TABS.length - 1].shortcut, " Direct tab access"] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { bold: true, underline: true, color: theme.foreground, children: "Actions" }) }), _jsx(Text, { color: theme.foreground, children: " m Toggle mouse support" }), _jsx(Text, { color: theme.foreground, children: " t Toggle tooltips" }), _jsx(Text, { color: theme.foreground, children: " e Toggle enabled/disabled services" }), _jsx(Text, { color: theme.foreground, children: " r Refresh data" }), _jsx(Text, { color: theme.foreground, children: " / Search/filter" }), _jsx(Text, { color: theme.foreground, children: " ? Show this help" }), _jsx(Text, { color: theme.foreground, children: theme.ascii ? " q Quit | Esc Back" : " q Quit \u2502 Esc Back" })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.muted, dimColor: theme.dimMuted, children: "Press any key to close..." }) })] }));
};
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const ASCII_SPINNER_FRAMES = ["-", "/", "|", "\\"];
export const LoadingScreen = ({ message = "Discovering resources...", animated = true, }) => {
    const theme = useTUITheme();
    const spinnerFrames = theme.ascii ? ASCII_SPINNER_FRAMES : SPINNER_FRAMES;
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        if (!animated)
            return;
        const timer = setInterval(() => setFrame((f) => (f + 1) % spinnerFrames.length), 80);
        return () => clearInterval(timer);
    }, [animated, spinnerFrames.length]);
    return (_jsxs(Box, { flexDirection: "column", padding: 2, children: [_jsxs(Text, { bold: true, color: theme.accent, children: [theme.bannerStart, " TDK NEON EDITION ", theme.bannerEnd] }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { color: theme.foreground, children: [animated && _jsxs(Text, { color: theme.accent, children: [spinnerFrames[frame], " "] }), message] })] }));
};
// biome-ignore lint/correctness/noUnusedFunctionParameters: reserved callback prop kept in the component API
const ErrorScreen = ({ error, onRetry }) => {
    const theme = useTUITheme();
    return (_jsxs(Box, { flexDirection: "column", padding: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: theme.error, children: "Could Not Load Services" }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { color: theme.error, children: [theme.ascii ? "[x]" : "\u2717", " ", error] }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: theme.muted, children: "Troubleshooting:" }), _jsx(Text, { color: theme.muted, children: " 1. Check that every service.json is valid JSON" }), _jsx(Text, { color: theme.muted, children: " 2. Run tdk from your project (the folder with the Tiltfile)" }), _jsx(Text, { color: theme.muted, children: " 3. Try: tdk status --verbose" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: theme.accent, children: "Press [r] to retry or [q] to quit" })] }));
};
const EmptyState = ({ message }) => {
    const theme = useTUITheme();
    return (_jsxs(Box, { flexDirection: "column", padding: 2, alignItems: "center", children: [_jsx(Text, { bold: true, color: theme.warning, children: "No Services Found" }), _jsx(Box, { marginY: 1 }), _jsxs(Text, { color: theme.muted, children: [theme.ascii ? "[*]" : "\u25c9", " No service.json files found"] }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: theme.foreground, children: "To get started:" }), _jsx(Text, { color: theme.foreground, children: " 1. Run: tdk project" }), _jsx(Text, { color: theme.foreground, children: " 2. Run: tdk resource api --type backend" }), _jsx(Box, { marginY: 1 }), _jsx(Text, { color: theme.accent, children: "Press [r] to refresh or [q] to quit" }), message && (_jsx(Box, { paddingX: 1, height: 1, children: _jsxs(Text, { color: theme.accent, children: [theme.bannerStart, " ", message, " ", theme.bannerEnd] }) }))] }));
};
export const TUIApp = ({ animated = true }) => {
    const theme = useTUITheme();
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
    // What the running Tilt says about each service: the same answer `tdk status` gives. Empty while no Tilt answers.
    const [serviceStates, setServiceStates] = useState({});
    useEffect(() => {
        let cancelled = false;
        const tiltPort = Number.parseInt(process.env.TILT_PORT ?? "", 10);
        const poll = async () => {
            const next = await fetchServiceStates(services, Number.isInteger(tiltPort) ? tiltPort : 10350);
            if (cancelled)
                return;
            setServiceStates((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
        };
        void poll();
        const timer = setInterval(() => void poll(), 5000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [services]);
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
            metadata: applyServiceStates(getStackMetadata(stack), serviceStates),
        };
    }, [selectedStack, stacks, serviceStates]);
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
            const tabs = TABS.map((tab) => tab.id);
            const currentIdx = tabs.indexOf(activeTab);
            const nextIdx = key.shift
                ? (currentIdx - 1 + tabs.length) % tabs.length
                : (currentIdx + 1) % tabs.length;
            setActiveTab(tabs[nextIdx]);
            return;
        }
        const shortcutTab = TABS.find((tab) => tab.shortcut === input);
        if (shortcutTab) {
            setActiveTab(shortcutTab.id);
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
    const header = (_jsxs(_Fragment, { children: [_jsx(TUIHeader, { projectRoot: projectRoot, resourceCount: services.length, terminalWidth: terminalWidth, version: getPackageVersion() }), _jsx(Box, { paddingX: 1, children: _jsx(Text, { color: theme.muted, children: (theme.ascii ? "-" : "\u2500").repeat(getTerminalRuleWidth(terminalWidth)) }) })] }));
    if (services.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", height: stdout.rows || 24, children: [header, _jsx(EmptyState, { message: message })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", height: stdout.rows || 24, children: [header, isSearching && (_jsxs(Box, { paddingX: 1, height: 1, children: [_jsxs(Text, { color: theme.warning, children: ["Search: ", searchQuery, "_"] }), searchStatus && (_jsx(Text, { color: theme.muted, dimColor: theme.dimMuted, children: `   ${searchStatus.summary}` }))] })), searchStatus?.emptyMessage && (_jsx(Box, { paddingX: 1, height: 1, children: _jsx(Text, { color: theme.muted, children: searchStatus.emptyMessage }) })), !isSearching && message && (_jsx(Box, { paddingX: 1, height: 1, children: _jsxs(Text, { color: theme.accent, children: [theme.bannerStart, " ", message, " ", theme.bannerEnd] }) })), !isSearching && !message && showTooltips && !showHelp && (_jsx(Box, { paddingX: 1, height: 1, children: _jsx(Text, { color: theme.muted, dimColor: theme.dimMuted, children: createHelpHint(activeTab, selectedStack, selectedService, showEnabledOnly, theme.ascii) }) })), showHelp && (_jsx(Box, { paddingX: 1, flexGrow: 1, children: _jsx(HelpPanel, { onClose: () => setShowHelp(false) }) })), !showHelp && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(TabBar, { activeTab: activeTab, onTabChange: setActiveTab, terminalWidth: terminalWidth }) }), _jsxs(Box, { flexDirection: "row", paddingX: 1, flexGrow: 1, children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, width: mainPanelWidth, children: [activeTab === "overview" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.muted, children: theme.ascii ? "[ Stacks ]" : "┌─ Stacks ─" }) }), _jsx(Box, { marginTop: 1, flexGrow: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] })), activeTab === "resources" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.muted, children: theme.ascii ? "[ Resources ]" : "┌─ Resources ─" }) }), selectedStackData ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: theme.muted, children: ["Stack: ", selectedStackData.stack.name] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(ResourceTable, { resources: selectedStackData.metadata.resources, maxWidth: terminalWidth - (showSidebar ? 50 : 10) }), _jsx(ServiceIssues, { resources: selectedStackData.metadata.resources })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.muted, children: "Select a stack to view resources" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] }))] })), activeTab === "files" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.muted, children: theme.ascii ? "[ Autogenerated Files ]" : "┌─ Autogenerated Files ─" }) }), selectedServiceData ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: theme.muted, children: ["Service: ", selectedServiceData.service.name] }), _jsx(Box, { marginTop: 1, children: _jsx(FileTree, { nodes: fileTreeNodes, selectedPath: selectedFile || undefined }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.muted, children: "Select a service to view files" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] }))] })), activeTab === "config" && (_jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.muted, children: theme.ascii ? "[ Configuration ]" : "┌─ Configuration ─" }) }), selectedServiceData ? (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.accent, children: selectedServiceData.service.configPath }), _jsx(Box, { marginTop: 1, ...(theme.ascii
                                                            ? {}
                                                            : { borderStyle: "single", borderColor: theme.border }), paddingX: 1, children: _jsx(Text, { color: theme.muted, wrap: "wrap", children: JSON.stringify(selectedServiceData.service.config, null, 2).slice(0, 1000) }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.muted, children: "Select a service to view configuration" }), _jsx(Box, { marginTop: 1, children: _jsx(ResourceSelectInput, { items: items, onSelect: handleSelect, highlightedIndex: highlightedIndex, isActive: !isSearching, maxVisibleItems: pageSize, width: mainPanelWidth, onLayout: handleListLayout }) })] }))] }))] }), showSidebar && (_jsx(Box, { marginLeft: 2, children: _jsx(DetailPanel, { stack: selectedStackData?.stack || null, service: selectedServiceData?.service || null, stackMetadata: selectedStackData?.metadata || null, visible: !!selectedStack || !!selectedService }) }))] }), _jsxs(Box, { ...(theme.ascii ? {} : { borderStyle: "single", borderColor: theme.border }), paddingX: 1, height: 3, flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { color: theme.accent, bold: true, children: [theme.bannerStart, " ", activeTab] }), _jsxs(Text, { color: theme.success, children: [theme.ascii ? "[+]" : "\u25cf", " ", services.filter((s) => s.stack).length, " in stack"] }), _jsxs(Text, { color: theme.warning, children: [theme.ascii ? "-" : "\u25cb", " ", services.filter((s) => !s.stack).length, " no stack"] })] }), _jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { color: theme.muted, children: ["Stacks: ", stacks.length] }), _jsxs(Text, { color: theme.muted, children: ["Services: ", services.length] }), _jsxs(Text, { color: theme.muted, children: [theme.ascii ? "Mouse" : "🖱️", " ", mouseEnabled ? "ON" : "OFF", theme.ascii ? " | " : " \u2502 ", theme.ascii ? "Info" : "ℹ️", " ", showTooltips ? "ON" : "OFF", theme.ascii ? " | " : " \u2502 ", _jsx(Text, { color: showEnabledOnly ? theme.success : theme.warning, children: showEnabledOnly
                                                    ? theme.ascii
                                                        ? "[+] enabled"
                                                        : "\u2713 enabled"
                                                    : theme.ascii
                                                        ? "[+] all"
                                                        : "\u2713 all" }), theme.ascii ? " | " : " \u2502 ", "[?] Help", theme.ascii ? " | " : " \u2502 ", "[q] Quit"] })] })] })] }))] }));
};
/** Compose footer guidance for the current tab and terminal character set. */
function createHelpHint(activeTab, selectedStack, selectedService, showEnabledOnly, ascii) {
    const separator = ascii ? " | " : " \u2502 ";
    const enabledHint = `[e] ${showEnabledOnly ? "show all" : "enabled only"}`;
    const common = [enabledHint, "[?] help"];
    const tabRange = `${TABS[0].shortcut}-${TABS[TABS.length - 1].shortcut}`;
    if (activeTab === "overview") {
        const introduction = selectedStack
            ? `Stack "${selectedStack}" selected. [Enter] view`
            : `${ascii ? "[UP/DOWN]" : "[\u2191/\u2193]"} Navigate`;
        const controls = selectedStack ? ["[Esc] back", ...common] : ["[Enter] Select", ...common];
        return [introduction, ...controls].join(separator);
    }
    if (activeTab === "resources") {
        return ["[Tab] Tabs", "[r] Refresh", "[/] Search", ...common].join(separator);
    }
    if (activeTab === "files" && selectedService) {
        return [`Service "${selectedService}"`, "[Esc] Back", ...common].join(separator);
    }
    if (activeTab === "files") {
        return ["Select service to view files", ...common].join(separator);
    }
    if (activeTab === "config") {
        return ["View configurations", ...common].join(separator);
    }
    return ["[Tab] Next", `[${tabRange}] Tabs`, ...common, "[q] Quit"].join(separator);
}
const TUIRoot = ({ animated, highContrast, }) => (_jsx(TUIThemeContext.Provider, { value: createTUITheme(Boolean(highContrast)), children: _jsx(TUIApp, { animated: animated }) }));
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
    render(_jsx(TUIRoot, { animated: options.animations, highContrast: options.highContrast }), {
        alternateScreen: true,
    });
});
//# sourceMappingURL=ui.js.map
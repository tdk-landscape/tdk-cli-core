import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
// Keys match what ink-select-input handled: up/down or k/j (wrapping), 1-9 to pick, Enter to select.
export const ResourceSelectInput = ({ items, onSelect, highlightedIndex, }) => {
    const [selected, setSelected] = useState(() => Math.max(0, Math.min(highlightedIndex, items.length - 1)));
    const itemKeys = items.map((item) => item.value).join("\0");
    // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the item list changes
    useEffect(() => setSelected(0), [itemKeys]);
    useInput((input, key) => {
        if (items.length === 0)
            return;
        if (input === "k" || key.upArrow)
            setSelected((i) => (i === 0 ? items.length - 1 : i - 1));
        if (input === "j" || key.downArrow)
            setSelected((i) => (i === items.length - 1 ? 0 : i + 1));
        if (/^[1-9]$/.test(input)) {
            const item = items[Number(input) - 1];
            if (item)
                onSelect(item);
        }
        if (key.return)
            onSelect(items[selected]);
    });
    return (_jsx(Box, { flexDirection: "column", children: items.map((item, index) => {
            const isSelected = index === selected;
            return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? "cyan" : undefined, children: isSelected ? "▓▒░ " : "    " }), _jsx(Text, { color: isSelected ? "cyan" : "white", bold: isSelected, backgroundColor: isSelected ? "black" : undefined, children: item.label })] }, item.value));
        }) }));
};
//# sourceMappingURL=ResourceSelectInput.js.map
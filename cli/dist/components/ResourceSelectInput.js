import { jsx as _jsx } from "react/jsx-runtime";
import { Text } from "ink";
import SelectInput from "ink-select-input";
export const ResourceSelectInput = ({ items, onSelect, highlightedIndex, }) => {
    return (_jsx(SelectInput, { items: items, onSelect: onSelect, initialIndex: highlightedIndex, indicatorComponent: ({ isSelected }) => (_jsx(Text, { color: isSelected ? "cyan" : undefined, children: isSelected ? "▓▒░ " : "    " })), itemComponent: ({ isSelected, label }) => (_jsx(Text, { color: isSelected ? "cyan" : "white", bold: isSelected, backgroundColor: isSelected ? "black" : undefined, children: label })) }));
};
//# sourceMappingURL=ResourceSelectInput.js.map
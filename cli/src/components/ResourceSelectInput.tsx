import { Box, measureElement, Text, useInput } from "ink";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ResourceSelectInputProps } from "../types/index.js";

// Keys match what ink-select-input handled: up/down or k/j (wrapping), 1-9 to pick, Enter to select.
export const ResourceSelectInput: React.FC<ResourceSelectInputProps> = ({
  items,
  onSelect,
  highlightedIndex,
  width,
  onLayout,
  isActive = true,
  maxVisibleItems = items.length,
}) => {
  const listRef = useRef<Parameters<typeof measureElement>[0] | null>(null);
  const [selected, setSelected] = useState(() =>
    Math.max(0, Math.min(highlightedIndex, items.length - 1)),
  );

  const visibleCount = Math.max(1, maxVisibleItems);
  const firstVisible = Math.min(
    Math.max(0, selected - visibleCount + 1),
    Math.max(0, items.length - visibleCount),
  );

  useLayoutEffect(() => {
    if (listRef.current) onLayout?.(measureElement(listRef.current).y, firstVisible);
  });

  useEffect(() => {
    setSelected(Math.max(0, Math.min(highlightedIndex, items.length - 1)));
  }, [highlightedIndex, items]);

  useInput(
    (input, key) => {
      if (items.length === 0) return;
      const plainKey = !key.ctrl && !key.meta;
      if ((plainKey && input === "k") || key.upArrow)
        setSelected((i) => (i === 0 ? items.length - 1 : i - 1));
      if ((plainKey && input === "j") || key.downArrow)
        setSelected((i) => (i === items.length - 1 ? 0 : i + 1));
      if (/^[1-9]$/.test(input)) {
        const item = items[Number(input) - 1];
        if (item) onSelect(item);
      }
      if (key.return) onSelect(items[selected]);
    },
    { isActive },
  );

  return (
    <Box ref={listRef} flexDirection="column" width={width}>
      {items.slice(firstVisible, firstVisible + visibleCount).map((item, index) => {
        const isSelected = firstVisible + index === selected;
        return (
          <Box key={item.value} width={width}>
            <Text wrap="truncate-end">
              <Text color={isSelected ? "cyan" : undefined}>
                {isSelected ? "\u2593\u2592\u2591 " : "    "}
              </Text>
              <Text
                color={isSelected ? "cyan" : "white"}
                bold={isSelected}
                backgroundColor={isSelected ? "black" : undefined}
              >
                {item.label}
              </Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

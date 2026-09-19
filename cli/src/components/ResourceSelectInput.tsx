import { Text } from "ink";
import SelectInput from "ink-select-input";
import type React from "react";
import type { ResourceSelectInputProps } from "../types/index.js";

export const ResourceSelectInput: React.FC<ResourceSelectInputProps> = ({
  items,
  onSelect,
  highlightedIndex,
}) => {
  return (
    <SelectInput
      items={items}
      onSelect={onSelect}
      initialIndex={highlightedIndex}
      indicatorComponent={({ isSelected }) => (
        <Text color={isSelected ? "cyan" : undefined}>{isSelected ? "▓▒░ " : "    "}</Text>
      )}
      itemComponent={({ isSelected, label }) => (
        <Text
          color={isSelected ? "cyan" : "white"}
          bold={isSelected}
          backgroundColor={isSelected ? "black" : undefined}
        >
          {label}
        </Text>
      )}
    />
  );
};

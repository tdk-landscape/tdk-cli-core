import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const ui = readFileSync(join(repoRoot, "cli", "src", "commands", "ui.tsx"), "utf-8");
const tabBar = readFileSync(join(repoRoot, "cli", "src", "components", "TabBar.tsx"), "utf-8");
const types = readFileSync(join(repoRoot, "cli", "src", "types", "index.ts"), "utf-8");
describe("tdk ui Events tab", () => {
  it("hides the unfinished timeline from the tab bar and content", () => {
    expect(tabBar).not.toContain('{ id: "events"');
    expect(ui).not.toContain('activeTab === "events"');
    expect(ui).not.toContain('"3": "events"');
    expect(ui).not.toContain("Events tab not yet implemented");
    expect(ui).not.toContain("Event timeline");
  });
  it("keeps the visible tabs directly reachable from one shared tab list", () => {
    expect(tabBar).toContain("export const TABS: Tab[] = [");
    expect(tabBar).toContain('{ id: "files", label: "FILES", shortcut: "3" }');
    expect(tabBar).toContain('{ id: "config", label: "CONFIG", shortcut: "4" }');
    expect(ui).toContain('import { TABS } from "../components/TabBar.js"');
    expect(ui).toContain("const tabs = TABS.map((tab) => tab.id)");
    expect(ui).toContain("const shortcutTab = TABS.find((tab) => tab.shortcut === input)");
    expect(ui).toContain("{TABS[0].shortcut}-{TABS[TABS.length - 1].shortcut} Direct tab access");
    expect(types).toContain('export type TabId = "overview" | "resources" | "files" | "config";');
  });
});

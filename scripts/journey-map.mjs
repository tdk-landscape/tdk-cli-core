// Draws docs/journey/map.svg: one island per "island: ..." label, one tick per quest (issue).
// A filled tick is a closed issue, a hollow tick is an open one. Needs the `gh` CLI.
// Run: node scripts/journey-map.mjs [owner/repo]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const repo = process.argv[2] ?? "tdk-landscape/tdk-cli-core";
const out = new URL("../docs/journey/map.svg", import.meta.url);

const ISLANDS = [
  { label: "island: CLI Cove", name: "CLI Cove", icon: "🏝️", color: "#1d76db", x: 155, y: 340 },
  { label: "island: Docs Harbor", name: "Docs Harbor", icon: "⚓", color: "#0075ca", x: 250, y: 150 },
  { label: "island: Test Atoll", name: "Test Atoll", icon: "🧪", color: "#d4a72c", x: 345, y: 340 },
  { label: "island: UI Lagoon", name: "UI Lagoon", icon: "🌊", color: "#8a63d2", x: 440, y: 150 },
  { label: "island: Doctor Reef", name: "Doctor Reef", icon: "🪸", color: "#0e8a16", x: 630, y: 150 },
  { label: "island: Launch Port", name: "Launch Port", icon: "🚢", color: "#2496ed", x: 535, y: 340 },
  { label: "island: Engine Volcano", name: "Engine Volcano", icon: "🌋", color: "#e36209", x: 725, y: 340 },
];
const RANKS = [
  ["8 kyu", "🌱"],
  ["7 kyu", "🌿"],
  ["6 kyu", "🪵"],
  ["5 kyu", "⚓"],
  ["4 kyu", "🧭"],
  ["1 dan", "🏔️"],
];

function quests(label) {
  const json = execFileSync(
    "gh",
    ["issue", "list", "-R", repo, "--label", label, "--state", "all", "--limit", "200", "--json", "state,labels"],
    { encoding: "utf8" },
  );
  return JSON.parse(json).filter((i) => !i.labels.some((l) => l.name === "tracking"));
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let islands = "";
let totalDone = 0;
let total = 0;

for (const isl of ISLANDS) {
  const q = quests(isl.label);
  const done = q.filter((i) => i.state === "CLOSED").length;
  totalDone += done;
  total += q.length;
  const ticks = q
    .slice(0, 24)
    .map((i, n) => {
      const cx = isl.x - 66 + (n % 12) * 12;
      const cy = isl.y + 80 + Math.floor(n / 12) * 12;
      return i.state === "CLOSED"
        ? `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${isl.color}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="${isl.color}" stroke-width="1.5"/>`;
    })
    .join("");
  islands += `
  <g>
    <ellipse cx="${isl.x}" cy="${isl.y + 6}" rx="82" ry="46" fill="#000" opacity=".10"/>
    <ellipse cx="${isl.x}" cy="${isl.y}" rx="80" ry="44" fill="#f4e3b0" stroke="${isl.color}" stroke-width="3"/>
    <ellipse cx="${isl.x}" cy="${isl.y - 6}" rx="56" ry="26" fill="#9bd68a" opacity=".85"/>
    <text x="${isl.x}" y="${isl.y + 8}" font-size="34" text-anchor="middle">${isl.icon}</text>
    <text x="${isl.x}" y="${isl.y + 66}" font-size="15" font-weight="700" text-anchor="middle" fill="#12304a">${esc(isl.name)}</text>
    ${ticks}
    <text x="${isl.x}" y="${isl.y + 114}" font-size="12" text-anchor="middle" fill="#12304a">${done}/${q.length} quests done</text>
  </g>`;
}

const ORDER = ["CLI Cove", "Docs Harbor", "Test Atoll", "UI Lagoon", "Launch Port", "Doctor Reef", "Engine Volcano"];
const byName = Object.fromEntries(ISLANDS.map((i) => [i.name, i]));
const route = ORDER.map((n) => `${byName[n].x},${byName[n].y}`);
const path = `M50,250 C80,300 ${route[0]} ${route[0]}` + route.slice(1).map((r) => ` S ${r} ${r}`).join("");

const ladder = RANKS.map(
  ([r, icon], n) =>
    `<g><circle cx="${100 + n * 136}" cy="545" r="22" fill="#fff" stroke="#12304a" stroke-width="2"/><text x="${100 + n * 136}" y="552" font-size="20" text-anchor="middle">${icon}</text><text x="${100 + n * 136}" y="588" font-size="12" font-weight="700" text-anchor="middle" fill="#12304a">${r}</text></g>`,
).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 620" width="880" height="620" role="img" aria-label="TDK contributor journey map: ${totalDone} of ${total} quests done across seven islands">
  <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#6bb7e8"/></linearGradient></defs>
  <rect width="880" height="620" rx="18" fill="url(#sea)"/>
  <text x="440" y="44" font-size="26" font-weight="800" text-anchor="middle" fill="#12304a">🗺️ The TDK Journey</text>
  <text x="440" y="68" font-size="13" text-anchor="middle" fill="#12304a">Pick an island, finish a quest, rank up. Filled dot = merged, hollow dot = open. ${totalDone}/${total} done.</text>
  <path d="${path}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>
  <text x="50" y="215" font-size="30" text-anchor="middle">🚩</text>
  <text x="50" y="250" font-size="12" font-weight="700" text-anchor="middle" fill="#12304a">Start here</text>
  ${islands}
  <text x="440" y="500" font-size="14" font-weight="700" text-anchor="middle" fill="#12304a">Your rank ladder (Codewars style)</text>
  <line x1="100" y1="545" x2="780" y2="545" stroke="#12304a" stroke-width="2" stroke-dasharray="4 6"/>
  ${ladder}
</svg>
`;
writeFileSync(out, svg);
console.log(`wrote docs/journey/map.svg (${totalDone}/${total} quests done)`);

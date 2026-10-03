// Draws docs/journey/map.svg: one island per "island: ..." label, one tick per quest (issue).
// A filled tick is a closed issue, a hollow tick is an open one. Needs the `gh` CLI.
// Run: node scripts/journey-map.mjs [owner/repo]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const repo = process.argv[2] ?? "tdk-landscape/tdk-cli-core";
const out = new URL("../docs/journey/map.svg", import.meta.url);

const ISLANDS = [
  { label: "island: CLI Cove", name: "CLI Cove", icon: "🏝️", color: "#1d76db", x: 170, y: 190 },
  {
    label: "island: Docs Harbor",
    name: "Docs Harbor",
    icon: "⚓",
    color: "#0075ca",
    x: 375,
    y: 190,
  },
  { label: "island: UI Lagoon", name: "UI Lagoon", icon: "🌊", color: "#8a63d2", x: 580, y: 190 },
  {
    label: "island: Doctor Reef",
    name: "Doctor Reef",
    icon: "🪸",
    color: "#0e8a16",
    x: 785,
    y: 190,
  },
  {
    label: "island: Engine Volcano",
    name: "Engine Volcano",
    icon: "🌋",
    color: "#e36209",
    x: 785,
    y: 395,
  },
  {
    label: "island: Launch Port",
    name: "Launch Port",
    icon: "🚢",
    color: "#2496ed",
    x: 580,
    y: 395,
  },
  { label: "island: Test Atoll", name: "Test Atoll", icon: "🧪", color: "#d4a72c", x: 375, y: 395 },
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
    [
      "issue",
      "list",
      "-R",
      repo,
      "--label",
      label,
      "--state",
      "all",
      "--limit",
      "200",
      "--json",
      "state,labels",
    ],
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
      const cx = isl.x - 82 + (n % 12) * 15;
      const cy = isl.y + 96 + Math.floor(n / 12) * 15;
      return i.state === "CLOSED"
        ? `<circle cx="${cx}" cy="${cy}" r="6" fill="${isl.color}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="5.5" fill="none" stroke="${isl.color}" stroke-width="2"/>`;
    })
    .join("");
  islands += `
  <g>
    <ellipse cx="${isl.x}" cy="${isl.y + 7}" rx="96" ry="54" fill="#000" opacity=".10"/>
    <ellipse cx="${isl.x}" cy="${isl.y}" rx="94" ry="52" fill="#f4e3b0" stroke="${isl.color}" stroke-width="3"/>
    <ellipse cx="${isl.x}" cy="${isl.y - 6}" rx="66" ry="32" fill="#9bd68a" opacity=".85"/>
    <text x="${isl.x}" y="${isl.y + 14}" font-size="46" text-anchor="middle">${isl.icon}</text>
    <text x="${isl.x}" y="${isl.y + 82}" font-size="22" font-weight="700" text-anchor="middle" fill="#12304a">${esc(isl.name)}</text>
    ${ticks}
    <text x="${isl.x}" y="${isl.y + 136}" font-size="17" text-anchor="middle" fill="#12304a">${done}/${q.length} quests done</text>
  </g>`;
}

const FLAG = { x: 170, y: 395 };
const stops = [FLAG, ...ISLANDS.map((i) => ({ x: i.x, y: i.y }))];
// The first leg curves around the left side of CLI Cove so it does not run through the island's label.
const path = `M${FLAG.x},${FLAG.y - 10} C30,${FLAG.y} 20,${ISLANDS[0].y} ${ISLANDS[0].x},${ISLANDS[0].y} ${stops
  .slice(2)
  .map((p) => `L${p.x},${p.y}`)
  .join(" ")}`;

const ladder = RANKS.map(
  ([r, icon], n) =>
    `<g><circle cx="${130 + n * 128}" cy="640" r="27" fill="#fff" stroke="#12304a" stroke-width="2"/><text x="${130 + n * 128}" y="649" font-size="26" text-anchor="middle">${icon}</text><text x="${130 + n * 128}" y="692" font-size="18" font-weight="700" text-anchor="middle" fill="#12304a">${r}</text></g>`,
).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 720" width="900" height="720" role="img" aria-label="TDK contributor journey map: ${totalDone} of ${total} quests done across seven islands">
  <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#6bb7e8"/></linearGradient></defs>
  <rect width="900" height="720" rx="18" fill="url(#sea)"/>
  <text x="450" y="52" font-size="36" font-weight="800" text-anchor="middle" fill="#12304a">🗺️ The TDK Journey</text>
  <text x="450" y="84" font-size="19" text-anchor="middle" fill="#12304a">Filled dot = merged, hollow dot = open · ${totalDone}/${total} quests done</text>
  <path d="${path}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="4 11" stroke-linecap="round"/>
  <text x="${FLAG.x}" y="${FLAG.y - 4}" font-size="46" text-anchor="middle">🚩</text>
  <text x="${FLAG.x}" y="${FLAG.y + 34}" font-size="20" font-weight="700" text-anchor="middle" fill="#12304a">Start here</text>
  ${islands}
  <text x="450" y="590" font-size="22" font-weight="700" text-anchor="middle" fill="#12304a">Your rank ladder (Codewars style)</text>
  <line x1="130" y1="640" x2="770" y2="640" stroke="#12304a" stroke-width="2" stroke-dasharray="4 6"/>
  ${ladder}
</svg>
`;
writeFileSync(out, svg);
console.log(`wrote docs/journey/map.svg (${totalDone}/${total} quests done)`);

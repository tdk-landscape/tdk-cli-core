// Draws docs/journey/map.svg: one island per "island: ..." label, one tick per quest (issue).
// A filled tick is a closed issue, a hollow tick is an open one. Needs the `gh` CLI.
// Run: node scripts/journey-map.mjs [owner/repo]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const repo = process.argv[2] ?? "tdk-landscape/tdk-cli-core";
const out = new URL("../docs/journey/map.svg", import.meta.url);

const ISLANDS = [
  { label: "island: CLI Cove", name: "CLI Cove", icon: "🏝️", color: "#1d76db", x: 150, y: 400 },
  { label: "island: Docs Harbor", name: "Docs Harbor", icon: "⚓", color: "#0075ca", x: 330, y: 200 },
  { label: "island: Test Atoll", name: "Test Atoll", icon: "🧪", color: "#d4a72c", x: 330, y: 470 },
  { label: "island: UI Lagoon", name: "UI Lagoon", icon: "🌊", color: "#8a63d2", x: 540, y: 330 },
  { label: "island: Doctor Reef", name: "Doctor Reef", icon: "🪸", color: "#0e8a16", x: 720, y: 180 },
  { label: "island: Launch Port", name: "Launch Port", icon: "🚢", color: "#2496ed", x: 740, y: 470 },
  { label: "island: Engine Volcano", name: "Engine Volcano", icon: "🌋", color: "#e36209", x: 880, y: 330 },
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

const route = ISLANDS.map((i) => `${i.x},${i.y}`);
const path = `M60,300 C100,330 ${route[0]} ${route[0]} S ${route[1]} ${route[1]} S ${route[3]} ${route[3]} S ${route[4]} ${route[4]} S ${route[6]} ${route[6]} S ${route[5]} ${route[5]}`;

const ladder = RANKS.map(
  ([r, icon], n) =>
    `<g><circle cx="${150 + n * 140}" cy="676" r="22" fill="#fff" stroke="#12304a" stroke-width="2"/><text x="${150 + n * 140}" y="683" font-size="20" text-anchor="middle">${icon}</text><text x="${150 + n * 140}" y="718" font-size="12" font-weight="700" text-anchor="middle" fill="#12304a">${r}</text></g>`,
).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 740" width="1000" height="740" role="img" aria-label="TDK contributor journey map: ${totalDone} of ${total} quests done across seven islands">
  <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#6bb7e8"/></linearGradient></defs>
  <rect width="1000" height="740" rx="18" fill="url(#sea)"/>
  <text x="500" y="46" font-size="26" font-weight="800" text-anchor="middle" fill="#12304a">🗺️ The TDK Journey</text>
  <text x="500" y="70" font-size="13" text-anchor="middle" fill="#12304a">Pick an island, finish a quest, rank up. Filled dot = merged, hollow dot = open. ${totalDone}/${total} done.</text>
  <path d="${path}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>
  <text x="60" y="290" font-size="30" text-anchor="middle">🚩</text>
  <text x="60" y="326" font-size="12" font-weight="700" text-anchor="middle" fill="#12304a">Start here</text>
  ${islands}
  <text x="500" y="640" font-size="14" font-weight="700" text-anchor="middle" fill="#12304a">Your rank ladder (Codewars style)</text>
  <line x1="150" y1="676" x2="850" y2="676" stroke="#12304a" stroke-width="2" stroke-dasharray="4 6"/>
  ${ladder}
</svg>
`;
writeFileSync(out, svg);
console.log(`wrote docs/journey/map.svg (${totalDone}/${total} quests done)`);

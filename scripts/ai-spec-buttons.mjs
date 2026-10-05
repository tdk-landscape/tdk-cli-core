#!/usr/bin/env node
// Pure transform for AI "Write spec" buttons on issue bodies. This is the
// only implementation; .github/workflows/ai-spec-buttons.yml checks the
// default branch out (persist-credentials: false) and runs this file.
//
// Env: ISSUE_TITLE, ISSUE_URL, ISSUE_LABELS, BODY_FILE, OUT_FILE
// Or:  node scripts/ai-spec-buttons.mjs --title T --url U --labels a,b --body-file X --out-file Y
import { readFileSync, writeFileSync } from "node:fs";

export const MARKER = "<!-- ai-spec-buttons -->";

// Chat reads the issue from the URL; prompts never embed the body.
export const OPENSPEC_PROMPT_PREFIX = [
  "Write an OpenSpec change for this issue. Use the linked issue URL to read the title and body on GitHub. Do not invent requirements. Gaps are open questions.",
  "",
  "Create openspec/changes/<issue-slug>/ with:",
  "- proposal.md (Why, What Changes, Impact)",
  "- specs/<capability>/spec.md",
  "- design.md only if the issue names a technical choice",
  "- tasks.md",
  "",
  "spec.md uses ## Requirements, ### Requirement: <name>, one SHALL, and #### Scenario: with GIVEN / WHEN / THEN. I will ask follow-up questions. Do not post anything back to GitHub.",
].join("\n");

export const PRIMITIVE_PROMPT_PREFIX = [
  "Write a short spec for this issue. Use the linked issue URL to read the title and body on GitHub. Do not invent facts. Gaps are open questions. Do not use OpenSpec. Do not post anything back to GitHub.",
  "",
  "# Spec",
  "## Problem",
  "## Expected",
  "## Out of scope",
  "## Done when",
].join("\n");

export const PROMPTS = {
  openspec: OPENSPEC_PROMPT_PREFIX,
  primitive: PRIMITIVE_PROMPT_PREFIX,
};

export const TAIL_LINES = {
  openspec: "drafts an OpenSpec change from this issue",
  primitive: "drafts a short spec from this issue",
};

// GitHub issue-form bodies render labels as `### Heading`. Require two
// headings from the same template so a bug/feature body that casually
// mentions one phrase is not classified as social/license skip.
export const SKIP_TEMPLATE_SIGNATURES = {
  "adoption-question": [
    "### What would you like to know?",
    "### How do you run your services locally today?",
  ],
  "i-booted-tdk": [
    "### Minutes until first healthy URL",
    "### Commands you ran",
  ],
  "we-use-tdk": [
    "### Anything a maintainer should know",
    "### I am allowed to list this organization",
  ],
  "premium_license": [
    "### Which paid features do you need?",
    "### What are you building with TDK?",
  ],
};

// Template title prefixes (set by issue forms). Catches a template body if
// a heading is renamed before signatures are updated.
export const SKIP_TITLE_PREFIXES = [
  "adopt: ",
  "boot: ",
  "adopter: ",
  "premium license request: ",
];

export function normalizeTitle(raw) {
  return (raw ?? "").replace(/\r?\n/g, " ").trim();
}

export function parseLabels(raw) {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function matchesSkipTemplate(bodyText) {
  return Object.values(SKIP_TEMPLATE_SIGNATURES).some(
    (sigs) => sigs.filter((sig) => bodyText.includes(sig)).length >= 2,
  );
}

export function matchesSkipTitle(title) {
  const t = (title ?? "").trim().toLowerCase();
  return SKIP_TITLE_PREFIXES.some((prefix) => t.startsWith(prefix));
}

/**
 * Kind resolution:
 * - skip: `question` label, social/license template title, or two `### `
 *   form headings from one of those templates
 * - openspec: `enhancement` label (wins over other labels), or feature form heading
 * - primitive: `bug`/`documentation` labels, or bug/docs form headings
 * - skip: anything with no kind signal (blank / unlabeled issues)
 */
export function resolveKind(body, labelsRaw, rawTitle) {
  const labels = parseLabels(labelsRaw);
  const bodyText = body ?? "";
  const title = normalizeTitle(rawTitle);

  if (labels.has("question")) return "skip";
  if (matchesSkipTitle(title)) return "skip";
  if (matchesSkipTemplate(bodyText)) return "skip";

  // Feature wins when enhancement coexists with another work label.
  if (labels.has("enhancement")) return "openspec";
  if (bodyText.includes("### What problem are you trying to solve?")) {
    return "openspec";
  }

  if (labels.has("bug") || labels.has("documentation")) return "primitive";
  if (
    bodyText.includes("### What happened?") ||
    bodyText.includes("### What is wrong or missing?")
  ) {
    return "primitive";
  }

  // No kind signal: leave blank / unlabeled issues alone.
  return "skip";
}

export function buildPrompt(kind, title, issueUrl) {
  const prefix = PROMPTS[kind] ?? PROMPTS.primitive;
  return `${prefix}\n\n"${title}"\n${issueUrl}`;
}

// Pill SVGs live in the repo. Image URLs must use `main` (not the PR branch):
// the issues workflow checks out the default branch, and a branch raw URL
// 404s after merge. Shields has no size+round knob; these are 196×52 / 204×52
// with canvas padding so feDropShadow is not clipped by rx=18.
export const BADGE_BASE =
  "https://github.com/tdk-landscape/tdk-cli-core/raw/main/.github/badges";
export const BADGE_URLS = {
  grok: `${BADGE_BASE}/write-spec-grok.svg`,
  claude: `${BADGE_BASE}/write-spec-claude.svg`,
  codex: `${BADGE_BASE}/write-spec-codex.svg`,
};

export function buildButtonsHtml(kind, title, issueUrl) {
  const q = encodeURIComponent(buildPrompt(kind, title, issueUrl));
  const grok = `https://grok.com/?q=${q}`;
  const claude = `https://claude.ai/new?q=${q}`;
  const codex = `https://chatgpt.com/?q=${q}`;
  return [
    `[![Write spec in Grok](${BADGE_URLS.grok})](${grok})`,
    `[![Write spec in Claude](${BADGE_URLS.claude})](${claude})`,
    `[![Write spec in Codex](${BADGE_URLS.codex})](${codex})`,
  ].join(" ");
}

/** Generated section only (marker through buttons). Does not include author text. */
export function buildGeneratedSection(kind, title, issueUrl) {
  const tail = TAIL_LINES[kind] ?? TAIL_LINES.primitive;
  return [
    MARKER,
    "",
    "---",
    "",
    `**Write spec** — open an AI chat that ${tail} via the linked URL. Nothing is posted back to GitHub automatically.`,
    "",
    buildButtonsHtml(kind, title, issueUrl),
    "",
  ].join("\n");
}

/**
 * Append generated section after author bytes without rewriting them.
 * Only adds a deterministic separator; never trims or normalizes author content.
 */
export function joinAuthorAndSection(authorBody, section) {
  if (authorBody === "") return section;
  if (authorBody.endsWith("\n\n")) return `${authorBody}${section}`;
  if (authorBody.endsWith("\n")) return `${authorBody}\n${section}`;
  return `${authorBody}\n\n${section}`;
}

/**
 * @returns {{ action: "skip" | "patch", body: string, reason: string, kind: string }}
 *   - skip when kind is skip (leave any existing marker in place)
 *   - append when the marker is missing
 *   - regenerate the generated tail when title/URL/kind drift
 *   - skip when the tail already matches
 */
export function transformBody(body, rawTitle, issueUrl, labelsRaw) {
  const title = normalizeTitle(rawTitle);
  const url = (issueUrl ?? "").trim();
  const kind = resolveKind(body, labelsRaw, title);

  if (kind === "skip") {
    return { action: "skip", body, reason: "kind is skip", kind };
  }

  if (!title || !url) {
    return { action: "skip", body, reason: "missing title or issue url", kind };
  }

  const section = buildGeneratedSection(kind, title, url);
  const idx = body.indexOf(MARKER);

  if (idx === -1) {
    return {
      action: "patch",
      body: joinAuthorAndSection(body, section),
      reason: `append spec buttons (${kind})`,
      kind,
    };
  }

  const authorPart = body.slice(0, idx);
  const existing = body.slice(idx);
  const existingNorm = existing.replace(/\s+$/, "");
  const sectionNorm = section.replace(/\s+$/, "");
  if (existingNorm === sectionNorm) {
    return {
      action: "skip",
      body,
      reason: "marker present and prompt matches",
      kind,
    };
  }
  return {
    action: "patch",
    body: joinAuthorAndSection(authorPart, section),
    reason: `regenerate spec buttons for current title/url/kind (${kind})`,
    kind,
  };
}

function parseArgs(argv) {
  const out = {
    title: process.env.ISSUE_TITLE,
    url: process.env.ISSUE_URL,
    labels: process.env.ISSUE_LABELS,
    bodyFile: process.env.BODY_FILE,
    outFile: process.env.OUT_FILE,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title") out.title = argv[++i];
    else if (a === "--url") out.url = argv[++i];
    else if (a === "--labels") out.labels = argv[++i];
    else if (a === "--body-file") out.bodyFile = argv[++i];
    else if (a === "--out-file") out.outFile = argv[++i];
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.bodyFile && opts.outFile) {
  const body = readFileSync(opts.bodyFile, "utf8");
  const result = transformBody(
    body,
    opts.title ?? "",
    opts.url ?? "",
    opts.labels ?? "",
  );
  writeFileSync(opts.outFile, result.body, "utf8");
  console.log(`${result.action}: ${result.reason}`);
}

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

// Distinctive issue-form field headings. These mark social / license bodies
// that must not get Write spec buttons.
const SKIP_BODY_SIGNATURES = [
  // adoption-question.yml
  "What would you like to know?",
  "How do you run your services locally today?",
  // i-booted-tdk.yml
  "Minutes until first healthy URL",
  "Commands you ran",
  // we-use-tdk.yml
  "Anything a maintainer should know",
  "I am allowed to list this organization",
  // premium_license.yml
  "Which paid features do you need?",
  "What are you building with TDK?",
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

/**
 * Kind resolution:
 * - skip: `question` label, or body from adoption/boot/adopter/premium templates
 * - openspec: `enhancement` label (wins over other labels), or feature body phrase
 * - primitive: `bug`/`documentation` labels, bug/docs body phrases, or no signal
 */
export function resolveKind(body, labelsRaw) {
  const labels = parseLabels(labelsRaw);
  const bodyText = body ?? "";

  if (labels.has("question")) return "skip";
  if (SKIP_BODY_SIGNATURES.some((sig) => bodyText.includes(sig))) return "skip";

  // Feature wins when enhancement coexists with another work label.
  if (labels.has("enhancement")) return "openspec";
  if (bodyText.includes("What problem are you trying to solve?")) return "openspec";

  if (labels.has("bug") || labels.has("documentation")) return "primitive";
  if (
    bodyText.includes("What happened?") ||
    bodyText.includes("What is wrong or missing?")
  ) {
    return "primitive";
  }

  return "primitive";
}

export function buildPrompt(kind, title, issueUrl) {
  const prefix = PROMPTS[kind] ?? PROMPTS.primitive;
  return `${prefix}\n\n"${title}"\n${issueUrl}`;
}

export function buildButtonsHtml(kind, title, issueUrl) {
  const q = encodeURIComponent(buildPrompt(kind, title, issueUrl));
  const badge = (left, right, color, logo) =>
    `https://img.shields.io/badge/${encodeURIComponent(left)}-${encodeURIComponent(right)}-${color}?style=for-the-badge&logo=${logo}&logoColor=white`;
  const grok = `https://grok.com/?q=${q}`;
  const claude = `https://claude.ai/new?q=${q}`;
  const codex = `https://chatgpt.com/?q=${q}`;
  return [
    `[![Write spec in Grok](${badge("Write spec in", "Grok", "111111", "x")})](${grok})`,
    `[![Write spec in Claude](${badge("Write spec in", "Claude", "D97757", "anthropic")})](${claude})`,
    `[![Write spec in Codex](${badge("Write spec in", "Codex", "10A37F", "openai")})](${codex})`,
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
  const kind = resolveKind(body, labelsRaw);

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

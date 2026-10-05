#!/usr/bin/env node
// Pure transform for AI "Write spec" buttons on issue bodies. This is the
// only implementation; .github/workflows/ai-spec-buttons.yml checks the
// default branch out (persist-credentials: false) and runs this file.
//
// Env: ISSUE_TITLE, ISSUE_URL, BODY_FILE, OUT_FILE
// Or:  node scripts/ai-spec-buttons.mjs --title T --url U --body-file X --out-file Y
import { readFileSync, writeFileSync } from "node:fs";

export const MARKER = "<!-- ai-spec-buttons -->";
// Chat reads the issue from the URL; the prompt never embeds the body.
export const PROMPT_PREFIX = [
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

export function normalizeTitle(raw) {
  return (raw ?? "").replace(/\r?\n/g, " ").trim();
}

export function buildPrompt(title, issueUrl) {
  return `${PROMPT_PREFIX}\n\n"${title}"\n${issueUrl}`;
}

export function buildButtonsHtml(title, issueUrl) {
  const q = encodeURIComponent(buildPrompt(title, issueUrl));
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
export function buildGeneratedSection(title, issueUrl) {
  return [
    MARKER,
    "",
    "---",
    "",
    "**Write spec** — open an AI chat that drafts an OpenSpec change from this issue via the linked URL. Nothing is posted back to GitHub automatically.",
    "",
    buildButtonsHtml(title, issueUrl),
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
 * @returns {{ action: "skip" | "patch", body: string, reason: string }}
 *   - append when the marker is missing
 *   - regenerate the generated tail when title/URL (or prompt wording) drift
 *   - skip when the tail already matches the current title/URL
 */
export function transformBody(body, rawTitle, issueUrl) {
  const title = normalizeTitle(rawTitle);
  const url = (issueUrl ?? "").trim();

  if (!title || !url) {
    return { action: "skip", body, reason: "missing title or issue url" };
  }

  const section = buildGeneratedSection(title, url);
  const idx = body.indexOf(MARKER);

  if (idx === -1) {
    return {
      action: "patch",
      body: joinAuthorAndSection(body, section),
      reason: "append spec buttons",
    };
  }

  const authorPart = body.slice(0, idx);
  const existing = body.slice(idx);
  const existingNorm = existing.replace(/\s+$/, "");
  const sectionNorm = section.replace(/\s+$/, "");
  if (existingNorm === sectionNorm) {
    return { action: "skip", body, reason: "marker present and prompt matches" };
  }
  return {
    action: "patch",
    body: joinAuthorAndSection(authorPart, section),
    reason: "regenerate spec buttons for current title/url",
  };
}

function parseArgs(argv) {
  const out = {
    title: process.env.ISSUE_TITLE,
    url: process.env.ISSUE_URL,
    bodyFile: process.env.BODY_FILE,
    outFile: process.env.OUT_FILE,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title") out.title = argv[++i];
    else if (a === "--url") out.url = argv[++i];
    else if (a === "--body-file") out.bodyFile = argv[++i];
    else if (a === "--out-file") out.outFile = argv[++i];
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.bodyFile && opts.outFile) {
  const body = readFileSync(opts.bodyFile, "utf8");
  const result = transformBody(body, opts.title ?? "", opts.url ?? "");
  writeFileSync(opts.outFile, result.body, "utf8");
  console.log(`${result.action}: ${result.reason}`);
}

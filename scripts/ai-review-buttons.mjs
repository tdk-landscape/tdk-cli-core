#!/usr/bin/env node
// Pure transform for AI review buttons on PR bodies. This is the only
// implementation; .github/workflows/ai-review-buttons.yml checks the repo out
// (persist-credentials: false) and runs this file.
//
// Env: PR_TITLE, PR_URL, BODY_FILE, OUT_FILE
// Or:  node scripts/ai-review-buttons.mjs --title T --url U --body-file X --out-file Y
import { readFileSync, writeFileSync } from "node:fs";

export const MARKER = "<!-- ai-review-buttons -->";
export const LEGACY_MARKER = "<!-- grok-review-button -->";
export const MARKERS = [MARKER, LEGACY_MARKER];
// Softened: the query only carries title + PR URL; it does not embed the diff.
export const PROMPT_PREFIX =
  "Review this pull request. Use the linked PR URL to read the description and diff on GitHub, then give the most important takeaways: intent, risks, missing tests, and concrete review comments. I will ask follow-up questions.";

export function normalizeTitle(raw) {
  return (raw ?? "").replace(/\r?\n/g, " ").trim();
}

export function buildPrompt(title, prUrl) {
  return `${PROMPT_PREFIX}\n\n"${title}"\n${prUrl}`;
}

export function buildButtonsHtml(title, prUrl) {
  const q = encodeURIComponent(buildPrompt(title, prUrl));
  const badge = (left, right, color, logo) =>
    `https://img.shields.io/badge/${encodeURIComponent(left)}-${encodeURIComponent(right)}-${color}?style=for-the-badge&logo=${logo}&logoColor=white`;
  const grok = `https://grok.com/?q=${q}`;
  const claude = `https://claude.ai/new?q=${q}`;
  const codex = `https://chatgpt.com/?q=${q}`;
  return [
    `[![Review PR in Grok](${badge("Review PR in", "Grok", "111111", "x")})](${grok})`,
    `[![Review PR in Claude](${badge("Review PR in", "Claude", "D97757", "anthropic")})](${claude})`,
    `[![Review PR in Codex](${badge("Review PR in", "Codex", "10A37F", "openai")})](${codex})`,
  ].join(" ");
}

/** Generated section only (marker through buttons). Does not include author text. */
export function buildGeneratedSection(title, prUrl) {
  return [
    MARKER,
    "",
    "---",
    "",
    "**AI review** — open an AI chat that reviews this PR via the linked URL (intent, risks, missing tests, concrete comments). Nothing is posted back to GitHub automatically.",
    "",
    buildButtonsHtml(title, prUrl),
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

function markerIndex(body) {
  let idx = -1;
  for (const m of MARKERS) {
    const i = body.indexOf(m);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  return idx;
}

/**
 * @returns {{ action: "skip" | "patch", body: string, reason: string }}
 *   - append when the marker is missing
 *   - regenerate the generated tail when title/URL (or prompt wording) drift
 *   - skip when the tail already matches the current title/URL
 */
export function transformBody(body, rawTitle, prUrl) {
  const title = normalizeTitle(rawTitle);
  const url = (prUrl ?? "").trim();

  if (!title || !url) {
    return { action: "skip", body, reason: "missing title or pr url" };
  }

  const section = buildGeneratedSection(title, url);
  const idx = markerIndex(body);

  if (idx === -1) {
    return {
      action: "patch",
      body: joinAuthorAndSection(body, section),
      reason: "append review buttons",
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
    reason: "regenerate review buttons for current title/url",
  };
}

function parseArgs(argv) {
  const out = {
    title: process.env.PR_TITLE,
    url: process.env.PR_URL,
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

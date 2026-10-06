#!/usr/bin/env node
// Pure transform for AI review buttons on PR bodies. This is the only
// implementation; .github/workflows/ai-review-buttons.yml checks the default
// branch out (persist-credentials: false) and runs this file.
//
// Env: PR_URL, BODY_FILE, OUT_FILE
// Or:  node scripts/ai-review-buttons.mjs --url U --body-file X --out-file Y
import { readFileSync, writeFileSync } from "node:fs";

export const MARKER = "<!-- ai-review-buttons -->";
export const LEGACY_MARKER = "<!-- grok-review-button -->";
export const MARKERS = [MARKER, LEGACY_MARKER];

// One line, reused for all three chat links. Chat reads the PR from the URL.
export function buildPrompt(prUrl) {
  return `Review this pull request. Read the title and diff at ${prUrl}.`;
}

// Circle SVGs live in the repo. Image URLs must use `main` (not the PR branch):
// a branch raw URL 404s after merge. Shared with scripts/ai-spec-buttons.mjs.
export const BADGE_BASE =
  "https://github.com/tdk-landscape/tdk-cli-core/raw/main/.github/badges";
export const BADGE_URLS = {
  grok: `${BADGE_BASE}/grok.svg`,
  claude: `${BADGE_BASE}/claude.svg`,
  codex: `${BADGE_BASE}/codex.svg`,
};

export function buildButtonsHtml(prUrl) {
  const q = encodeURIComponent(buildPrompt(prUrl));
  const grok = `https://grok.com/?q=${q}`;
  const claude = `https://claude.ai/new?q=${q}`;
  const codex = `https://chatgpt.com/?q=${q}`;
  return [
    `[![Grok](${BADGE_URLS.grok})](${grok})`,
    `[![Claude](${BADGE_URLS.claude})](${claude})`,
    `[![Codex](${BADGE_URLS.codex})](${codex})`,
  ].join("\n");
}

/** Generated section only (marker through buttons). Does not include author text. */
export function buildGeneratedSection(prUrl) {
  return [
    MARKER,
    "",
    "---",
    "",
    "**Review this PR in**",
    "",
    buildButtonsHtml(prUrl),
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
 *   - regenerate the generated tail when URL (or prompt wording) drift
 *   - skip when the tail already matches the current URL
 */
export function transformBody(body, prUrl) {
  const url = (prUrl ?? "").trim();

  if (!url) {
    return { action: "skip", body, reason: "missing pr url" };
  }

  const section = buildGeneratedSection(url);
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
    reason: "regenerate review buttons for current url",
  };
}

function parseArgs(argv) {
  const out = {
    url: process.env.PR_URL,
    bodyFile: process.env.BODY_FILE,
    outFile: process.env.OUT_FILE,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") out.url = argv[++i];
    else if (a === "--body-file") out.bodyFile = argv[++i];
    else if (a === "--out-file") out.outFile = argv[++i];
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.bodyFile && opts.outFile) {
  const body = readFileSync(opts.bodyFile, "utf8");
  const result = transformBody(body, opts.url ?? "");
  writeFileSync(opts.outFile, result.body, "utf8");
  console.log(`${result.action}: ${result.reason}`);
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BADGE_URLS,
  MARKER,
  buildButtonsHtml,
  buildGeneratedSection,
  buildPrompt,
  transformBody,
} from "./ai-review-buttons.mjs";

const url = "https://github.com/tdk-landscape/tdk-cli-core/pull/123";

describe("buildPrompt", () => {
  it("is one line with the PR URL only", () => {
    assert.equal(
      buildPrompt(url),
      `Review this pull request. Read the title and diff at ${url}.`,
    );
  });
});

describe("buildButtonsHtml", () => {
  it("uses shared circle SVGs on main, tool-name alt text, one-line query", () => {
    const html = buildButtonsHtml(url);
    assert.equal(BADGE_URLS.grok, "https://github.com/tdk-landscape/tdk-cli-core/raw/main/.github/badges/grok.svg");
    assert.equal(BADGE_URLS.claude, "https://github.com/tdk-landscape/tdk-cli-core/raw/main/.github/badges/claude.svg");
    assert.equal(BADGE_URLS.codex, "https://github.com/tdk-landscape/tdk-cli-core/raw/main/.github/badges/codex.svg");
    assert.ok(html.includes("[![Grok]("));
    assert.ok(html.includes("[![Claude]("));
    assert.ok(html.includes("[![Codex]("));
    assert.ok(!html.includes("Review PR in"));
    const q = encodeURIComponent(buildPrompt(url));
    assert.ok(html.includes(`https://grok.com/?q=${q}`));
    assert.ok(html.includes(`https://claude.ai/new?q=${q}`));
    assert.ok(html.includes(`https://chatgpt.com/?q=${q}`));
    assert.ok(!html.includes("%0A"));
    assert.ok(!html.includes("img.shields.io"));
  });
});

describe("buildGeneratedSection", () => {
  it("PR tail is label + three circles, no prompt paragraph", () => {
    const section = buildGeneratedSection(url);
    assert.ok(section.startsWith(MARKER));
    assert.ok(section.includes("**Review this PR in**"));
    assert.ok(section.includes("grok.svg") && section.includes("claude.svg") && section.includes("codex.svg"));
    assert.ok(!section.includes("AI review**"));
    assert.ok(!section.includes("Nothing is posted back"));
  });
});

describe("transformBody", () => {
  it("appends review buttons for a new PR body", () => {
    const r = transformBody("Author\n", url);
    assert.equal(r.action, "patch");
    assert.ok(r.body.includes(MARKER));
    assert.ok(r.body.includes("**Review this PR in**"));
    assert.ok(r.body.startsWith("Author"));
    assert.ok(r.body.includes(encodeURIComponent(buildPrompt(url))));
  });

  it("skips when the tail already matches", () => {
    const r1 = transformBody("Author\n", url);
    const r2 = transformBody(r1.body, url);
    assert.equal(r2.action, "skip");
    assert.equal(r2.body, r1.body);
  });

  it("regenerates when the PR URL changes", () => {
    const r1 = transformBody("Author\n", url);
    const other = "https://github.com/tdk-landscape/tdk-cli-core/pull/999";
    const r2 = transformBody(r1.body, other);
    assert.equal(r2.action, "patch");
    assert.ok(r2.body.startsWith("Author"));
    assert.ok(r2.body.includes(encodeURIComponent(buildPrompt(other))));
  });

  it("skips when url is missing", () => {
    assert.equal(transformBody("x\n", "").action, "skip");
  });
});

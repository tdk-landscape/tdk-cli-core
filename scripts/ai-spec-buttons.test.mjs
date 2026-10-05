import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MARKER,
  PRIMITIVE_PROMPT_PREFIX,
  OPENSPEC_PROMPT_PREFIX,
  buildGeneratedSection,
  resolveKind,
  transformBody,
} from "./ai-spec-buttons.mjs";

const title = "Add doctor --json output";
const url = "https://github.com/tdk-landscape/tdk-cli-core/issues/123";

const featureBody = [
  "### Is this a local-development or cluster-deployment request?",
  "",
  "Both / not sure",
  "",
  "### What problem are you trying to solve?",
  "",
  "Hard to parse doctor output.",
].join("\n");

const bugBody = [
  "### What happened?",
  "",
  "`tdk up` failed.",
  "",
  "### Steps to reproduce",
  "",
  "1. tdk up api",
].join("\n");

const docsBody = [
  "### What is wrong or missing?",
  "",
  "README omits WSL notes.",
].join("\n");

const adoptionBody = [
  "### What would you like to know?",
  "",
  "Would this fit our stack?",
  "",
  "### How do you run your services locally today?",
  "",
  "docker-compose",
].join("\n");

const bootBody = [
  "### Minutes until first healthy URL",
  "",
  "8",
  "",
  "### Commands you ran",
  "",
  "tdk project --yes",
].join("\n");

const weUseBody = [
  "### Anything a maintainer should know",
  "",
  "Private team.",
  "",
  "### I am allowed to list this organization",
  "",
  "- [x] yes",
].join("\n");

const premiumBody = [
  "### Which paid features do you need?",
  "",
  "- Sablier",
  "",
  "### What are you building with TDK?",
  "",
  "Internal platform.",
].join("\n");

describe("resolveKind", () => {
  it("classifies openspec from enhancement label", () => {
    assert.equal(resolveKind("anything", "enhancement", "T"), "openspec");
  });

  it("classifies openspec from feature form heading", () => {
    assert.equal(resolveKind(featureBody, "", "T"), "openspec");
  });

  it("lets enhancement win over bug", () => {
    assert.equal(resolveKind(bugBody, "bug,enhancement", "T"), "openspec");
  });

  it("classifies primitive from bug label", () => {
    assert.equal(resolveKind("plain", "bug", "T"), "primitive");
  });

  it("classifies primitive from documentation label", () => {
    assert.equal(resolveKind("plain", "documentation", "T"), "primitive");
  });

  it("classifies primitive from bug form heading", () => {
    assert.equal(resolveKind(bugBody, "", "T"), "primitive");
  });

  it("classifies primitive from docs form heading", () => {
    assert.equal(resolveKind(docsBody, "", "T"), "primitive");
  });

  it("skips blank / unlabeled issues with no kind signal", () => {
    assert.equal(resolveKind("just some notes", "", "T"), "skip");
    assert.equal(resolveKind("", "", "T"), "skip");
  });

  it("skips question label even with enhancement", () => {
    assert.equal(resolveKind(featureBody, "question,enhancement", "T"), "skip");
  });

  it("skips template titles", () => {
    assert.equal(resolveKind("x", "", "adopt: would this fit?"), "skip");
    assert.equal(resolveKind("x", "", "boot: first run"), "skip");
    assert.equal(resolveKind("x", "", "adopter: Acme"), "skip");
    assert.equal(resolveKind("x", "", "Premium license request: team"), "skip");
  });

  it("skips template bodies only when two headings from one template match", () => {
    assert.equal(resolveKind(adoptionBody, "", "T"), "skip");
    assert.equal(resolveKind(bootBody, "", "T"), "skip");
    assert.equal(resolveKind(weUseBody, "", "T"), "skip");
    assert.equal(resolveKind(premiumBody, "", "T"), "skip");
  });

  it("does not skip a bug body that casually mentions one skip phrase", () => {
    const body = [
      "### What happened?",
      "",
      "Mentioned that I would like to know how ports work,",
      "and also what are you building with TDK? as a joke.",
    ].join("\n");
    assert.equal(resolveKind(body, "", "T"), "primitive");
  });
});

describe("transformBody", () => {
  it("appends OpenSpec buttons for enhancement issues", () => {
    const r = transformBody("Author\n", title, url, "enhancement");
    assert.equal(r.action, "patch");
    assert.equal(r.kind, "openspec");
    assert.ok(r.body.includes(MARKER));
    assert.ok(r.body.includes("drafts an OpenSpec change from this issue"));
    assert.ok(r.body.startsWith("Author"));
    assert.ok(OPENSPEC_PROMPT_PREFIX.includes("openspec/changes/<issue-slug>/"));
  });

  it("appends short-spec buttons for bug issues", () => {
    const r = transformBody(bugBody, title, url, "bug");
    assert.equal(r.action, "patch");
    assert.equal(r.kind, "primitive");
    assert.ok(r.body.includes("drafts a short spec from this issue"));
    assert.ok(!r.body.includes("openspec/changes"));
    assert.ok(!buildGeneratedSection("primitive", title, url).includes("SHALL"));
    assert.ok(PRIMITIVE_PROMPT_PREFIX.includes("# Spec"));
  });

  it("skips blank issues and leaves any existing marker alone", () => {
    const withMarker = `Notes\n\n${buildGeneratedSection("openspec", title, url)}`;
    const r = transformBody(withMarker, "Renamed", url, "");
    assert.equal(r.action, "skip");
    assert.equal(r.body, withMarker);
  });

  it("regenerates tail when kind changes via labels", () => {
    const rOpen = transformBody("Author\n", title, url, "enhancement");
    const rBug = transformBody(rOpen.body, title, url, "bug");
    assert.equal(rBug.action, "patch");
    assert.ok(rBug.body.startsWith("Author"));
    assert.ok(rBug.body.includes("drafts a short spec from this issue"));
    assert.ok(!rBug.body.includes("drafts an OpenSpec change"));
  });

  it("skips when tail already matches", () => {
    const r1 = transformBody("Author\n", title, url, "bug");
    const r2 = transformBody(r1.body, title, url, "bug");
    assert.equal(r2.action, "skip");
    assert.equal(r2.body, r1.body);
  });

  it("skips when title or url is missing", () => {
    assert.equal(transformBody("x\n", "", url, "bug").action, "skip");
    assert.equal(transformBody("x\n", title, "", "bug").action, "skip");
  });
});

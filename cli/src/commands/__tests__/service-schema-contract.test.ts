import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BACKEND_FRAMEWORKS } from "../../backend-frameworks/registry.js";
import { BACKEND_LANGUAGES } from "../../backend-languages/registry.js";
import { FRONTEND_FRAMEWORKS } from "../../frontend-frameworks/registry.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const schema = JSON.parse(
  readFileSync(join(repoRoot, "engine", "schemas", "service-schema.json"), "utf-8"),
);
const publishWorkflow = readFileSync(
  join(repoRoot, ".github", "workflows", "publish-service-schema.yml"),
  "utf-8",
);

const frameworkIds = [...Object.keys(FRONTEND_FRAMEWORKS), ...Object.keys(BACKEND_FRAMEWORKS)];
const languageIds = Object.keys(BACKEND_LANGUAGES);

// The CLI provider registries are the contract: the CLI rejects an unknown id before it writes a resource. The JSON Schema is only
// an editor hint, so adding a provider must not require touching it (a provider PR that edits this file also changes what the
// published copy has to be, and that copy lags behind main).
describe("service-schema.json stays independent of the provider registries", () => {
  it("accepts every registered framework and language id with its open pattern", () => {
    const framework = new RegExp(schema.properties.framework.pattern);
    const language = new RegExp(schema.properties.language.pattern);
    for (const id of frameworkIds) expect(id, `framework ${id}`).toMatch(framework);
    for (const id of languageIds) expect(id, `language ${id}`).toMatch(language);
    expect(schema.properties.framework.enum).toBeUndefined();
    expect(schema.properties.language.enum).toBeUndefined();
  });

  it("keeps `examples` a short hint that names real providers, not a catalog to edit per provider", () => {
    for (const field of ["framework", "language"] as const) {
      const examples: string[] = schema.properties[field].examples;
      const registered = field === "framework" ? frameworkIds : languageIds;
      expect(
        examples.length,
        `${field} examples are a hint, not a list of every provider`,
      ).toBeLessThanOrEqual(3);
      for (const id of examples) expect(registered, `${field} example ${id}`).toContain(id);
    }
  });

  it("describes the ids as coming from the CLI registry", () => {
    expect(schema.properties.framework.description).toMatch(/registry/i);
    expect(schema.properties.language.description).toMatch(/registry/i);
  });
});

describe("publishing the schema from main", () => {
  it("only publishes after a change lands on main, never from a pull request", () => {
    expect(publishWorkflow).toMatch(/push:\s*\n\s*branches: \[main\]/);
    expect(publishWorkflow).not.toContain("pull_request");
  });

  it("reports whether the live copy matches main, so a missing token is not a silent success", () => {
    expect(publishWorkflow).toContain("Report whether the published schema matches main");
    expect(publishWorkflow).toContain("https://tdk-landscape.github.io/schema.service.json");
    expect(publishWorkflow).toContain("GITHUB_STEP_SUMMARY");
  });
});

import { describe, expect, it } from "vitest";
import { PROJECT_TEMPLATES } from "../project-templates.js";

describe("PROJECT_TEMPLATES", () => {
  it("offers every public example repo", () => {
    expect(Object.keys(PROJECT_TEMPLATES).sort()).toEqual([
      "ecommerce",
      "erp",
      "example",
      "restaurant",
      "saas",
      "user-management",
    ]);
  });

  it("points ecommerce at tdk-ecommerce-example", () => {
    expect(PROJECT_TEMPLATES.ecommerce.repo).toBe(
      "https://github.com/tdk-landscape/tdk-ecommerce-example.git",
    );
  });

  it("gives every template a github repo and a description", () => {
    for (const [name, t] of Object.entries(PROJECT_TEMPLATES)) {
      expect(t.repo, name).toMatch(/^https:\/\/github\.com\/tdk-landscape\/[\w-]+\.git$/);
      expect(t.description, name).not.toBe("");
    }
  });
});

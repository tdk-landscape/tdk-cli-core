import { describe, expect, test } from "bun:test";
import { decideWakeAction, evaluateReadiness } from "./decide";

describe("decideWakeAction", () => {
  test("never-created resource: tilt trigger only, no Sablier start", () => {
    const action = decideWakeAction({
      resourceContainerName: "data-governance-api",
      resourceState: "absent",
      dependencies: [],
    });
    expect(action.tiltTriggerNames).toEqual(["data-governance-api"]);
    expect(action.useSablierStart).toBe(false);
  });

  test("previously-run, now-exited resource: both tilt trigger and Sablier start", () => {
    const action = decideWakeAction({
      resourceContainerName: "data-governance-api",
      resourceState: "exited",
      dependencies: [],
    });
    expect(action.tiltTriggerNames).toEqual(["data-governance-api"]);
    expect(action.useSablierStart).toBe(true);
  });

  test("created-but-not-started resource: both paths apply", () => {
    const action = decideWakeAction({
      resourceContainerName: "data-governance-api",
      resourceState: "created",
      dependencies: [],
    });
    expect(action.useSablierStart).toBe(true);
  });

  test("already running: no trigger needed", () => {
    const action = decideWakeAction({
      resourceContainerName: "data-governance-api",
      resourceState: "running",
      dependencies: [],
    });
    expect(action.tiltTriggerNames).toEqual([]);
    expect(action.useSablierStart).toBe(false);
  });

  test("cold dependency is triggered alongside the resource (task 1.5 finding)", () => {
    const action = decideWakeAction({
      resourceContainerName: "data-governance-api",
      resourceState: "absent",
      dependencies: [
        { name: "postgres", state: "running" },
        { name: "data-governance-api-db-migrator", state: "absent" },
      ],
    });
    expect(action.tiltTriggerNames).toEqual([
      "data-governance-api",
      "data-governance-api-db-migrator",
    ]);
  });

  test("running dependency is not re-triggered", () => {
    const action = decideWakeAction({
      resourceContainerName: "data-governance-api",
      resourceState: "running",
      dependencies: [{ name: "postgres", state: "running" }],
    });
    expect(action.tiltTriggerNames).toEqual([]);
  });
});

describe("evaluateReadiness", () => {
  test("ready once every required name reports healthy", () => {
    const outcome = evaluateReadiness(["a", "b"], { a: true, b: true });
    expect(outcome.ready).toBe(true);
    expect(outcome.pending).toEqual([]);
  });

  test("not ready while some names are still unhealthy", () => {
    const outcome = evaluateReadiness(["a", "b"], { a: true, b: false });
    expect(outcome.ready).toBe(false);
    expect(outcome.pending).toEqual(["b"]);
  });

  test("missing entries count as not healthy", () => {
    const outcome = evaluateReadiness(["a", "b"], { a: true });
    expect(outcome.ready).toBe(false);
    expect(outcome.pending).toEqual(["b"]);
  });
});

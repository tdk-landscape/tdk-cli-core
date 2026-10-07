import { describe, expect, it } from "vitest";
import { latestOnly } from "../latest-only.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("latestOnly", () => {
  it("applies a result when nothing newer has started", async () => {
    const applied: string[] = [];
    const run = latestOnly<string>((value) => applied.push(value));
    await run(async () => "a");
    expect(applied).toEqual(["a"]);
  });

  it("drops an older load that finishes after a newer one", async () => {
    const applied: string[] = [];
    const run = latestOnly<string>((value) => applied.push(value));
    const slow = deferred<string>();
    const fast = deferred<string>();

    const first = run(() => slow.promise);
    const second = run(() => fast.promise);
    fast.resolve("new");
    await second;
    slow.resolve("old");
    await first;

    expect(applied).toEqual(["new"]);
  });

  it("drops an older load that finishes first when a newer one is already running", async () => {
    const applied: string[] = [];
    const run = latestOnly<string>((value) => applied.push(value));
    const slow = deferred<string>();
    const fast = deferred<string>();

    const first = run(() => fast.promise);
    const second = run(() => slow.promise);
    fast.resolve("older");
    await first;
    slow.resolve("newer");
    await second;

    expect(applied).toEqual(["newer"]);
  });
});

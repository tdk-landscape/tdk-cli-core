import { describe, expect, it } from "vitest";
import { portConflictFix } from "../port-conflict-fix.js";

describe("portConflictFix", () => {
  it("names the port, the command that finds its holder, and the service.json field", () => {
    expect(portConflictFix("host port 5432 is already allocated")).toBe(
      'Fix: stop the process using port 5432 (find it with: lsof -nP -iTCP:5432 -sTCP:LISTEN), or change "port" in the service\'s service.json and run tdk up',
    );
  });

  it("gives no next step when the port is not known", () => {
    expect(portConflictFix("a required host port is already allocated")).toBeNull();
  });

  it("gives no next step for other failures", () => {
    expect(portConflictFix("ConnectionRefused downloading package manifest")).toBeNull();
  });
});

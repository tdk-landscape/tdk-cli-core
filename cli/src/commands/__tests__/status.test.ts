import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearDiscoveryCache } from "../../utils/discovery-context.js";
import { isTiltAvailable, runTilt } from "../../utils/tilt.js";
import { projectCommand } from "../project.js";
import { statusCommand } from "../status.js";

// `tdk project` refuses to start without Docker, Tilt and Bun on the machine,
// and `tdk status` asks Tilt whether it is installed. Neither is needed to
// check what status prints, so both are mocked.
vi.mock("../../utils/cold-preflight.js", () => ({
  assertMachineReadyOrExit: vi.fn(async () => {}),
}));
vi.mock("../../utils/tilt.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/tilt.js")>()),
  isTiltAvailable: vi.fn(),
  runTilt: vi.fn(),
}));

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

const FIXTURE_SERVICES = [
  { dir: "services/shop/orders-api", appName: "orders-api", appType: "backend", stack: "shop" },
  { dir: "services/shop/orders-web", appName: "orders-web", appType: "frontend", stack: "shop" },
  { dir: "services/billing/invoices", appName: "invoices", appType: "backend", stack: "billing" },
  { dir: "tools/report-job", appName: "report-job", appType: "backend" },
];

async function runStatus(args: string[] = []): Promise<string> {
  const lines: string[] = [];
  const log = vi.spyOn(console, "log").mockImplementation((...parts: unknown[]) => {
    lines.push(parts.map(String).join(" "));
  });
  try {
    await statusCommand.parseAsync(args, { from: "user" });
  } finally {
    log.mockRestore();
  }
  return stripVTControlCharacters(lines.join("\n"));
}

describe("tdk status", () => {
  const originalCwd = process.cwd();
  const originalExtensionSource = process.env.TDK_EXTENSION_SOURCE;
  let projectRoot = "";

  beforeAll(async () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-status-"));
    process.chdir(projectRoot);
    process.env.TDK_EXTENSION_SOURCE = repoRoot;

    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await projectCommand.parseAsync(["--yes"], { from: "user" });
    } finally {
      log.mockRestore();
      warn.mockRestore();
    }

    for (const { dir, ...manifest } of FIXTURE_SERVICES) {
      mkdirSync(join(projectRoot, dir), { recursive: true });
      writeFileSync(join(projectRoot, dir, "service.json"), JSON.stringify(manifest, null, 2));
    }
  }, 30000);

  afterAll(() => {
    process.chdir(originalCwd);
    if (originalExtensionSource === undefined) {
      delete process.env.TDK_EXTENSION_SOURCE;
    } else {
      process.env.TDK_EXTENSION_SOURCE = originalExtensionSource;
    }
    if (projectRoot.startsWith(tmpdir())) {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    clearDiscoveryCache();
    vi.mocked(isTiltAvailable).mockResolvedValue(true);
  });

  afterEach(() => {
    // Without --tilt, status must never call Tilt beyond the availability check.
    expect(runTilt).not.toHaveBeenCalled();
    vi.mocked(isTiltAvailable).mockReset();
  });

  it("prints Tilt availability, resource and stack counts, and next steps by default", async () => {
    const output = await runStatus();

    expect(output).toContain("TDK Status");
    expect(output).toContain("Tilt: available");
    expect(output).not.toContain("Install Tilt");
    expect(output).toContain("Resources: 4 discovered");
    expect(output).toContain("Stacks: 2 defined");
    expect(output).toMatch(/^ {2}billing: 1 resource$/m);
    expect(output).toMatch(/^ {2}shop: 2 resources$/m);
    expect(output.indexOf("billing:")).toBeLessThan(output.indexOf("shop:"));
    expect(output).toContain("1 resource not in any stack:");
    expect(output).toContain('Run "tdk list-stacks" to see all stacks.');
    expect(output).toContain('Run "tdk up <stack-name>" to start a stack.');

    // Resource names are only listed with --verbose.
    for (const { appName } of FIXTURE_SERVICES) {
      expect(output).not.toContain(appName);
    }
  });

  it("points to the Tilt install guide when Tilt is not installed", async () => {
    vi.mocked(isTiltAvailable).mockResolvedValue(false);

    const output = await runStatus();

    expect(output).toContain("Tilt: not found");
    expect(output).toContain("Install Tilt: https://docs.tilt.dev/install.html");
    expect(output).toContain("Resources: 4 discovered");
  });

  it("lists each stack's resources and the unassigned resources with --verbose", async () => {
    const output = await runStatus(["--verbose"]);

    expect(output).toMatch(/^ {2}billing: 1 resource\n {6}invoices$/m);
    expect(output).toMatch(/^ {2}shop: 2 resources\n {6}orders-api\n {6}orders-web$/m);
    expect(output).toMatch(/^1 resource not in any stack:\n {2}report-job$/m);
  });

  it("accepts the -v shorthand for --verbose", async () => {
    expect(await runStatus(["-v"])).toBe(await runStatus(["--verbose"]));
  });

  it("shows stacks by default, so --stacks prints the default output", async () => {
    expect(await runStatus(["--stacks"])).toBe(await runStatus());
  });

  it("prints the default summary with --resources", async () => {
    // The text report does not read --resources yet; its resource count line is
    // part of the default output. Update this test if the flag gains a listing.
    const output = await runStatus(["--resources"]);

    expect(output).toBe(await runStatus());
    expect(output).toContain("Resources: 4 discovered");
  });

  it("reports an empty project without stack lines", async () => {
    const emptyRoot = mkdtempSync(join(tmpdir(), "tdk-status-empty-"));
    try {
      mkdirSync(join(emptyRoot, ".tdk"));
      writeFileSync(join(emptyRoot, ".tdk", "project.json"), "{}");
      process.chdir(emptyRoot);

      const output = await runStatus(["--verbose"]);

      expect(output).toContain("Resources: 0 discovered");
      expect(output).toContain("Stacks: 0 defined");
      expect(output).not.toContain("not in any stack");
    } finally {
      process.chdir(projectRoot);
      rmSync(emptyRoot, { recursive: true, force: true });
    }
  });
});

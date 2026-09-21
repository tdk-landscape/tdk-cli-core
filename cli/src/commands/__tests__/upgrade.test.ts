import { chmodSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const execSyncMock = vi.fn();
vi.mock("node:child_process", () => ({
  execSync: (...args: unknown[]) => execSyncMock(...args),
}));

const { upgradeViaBinary, isWritable } = await import("../upgrade.js");
import type { BinaryRelease } from "../upgrade.js";

// Regression coverage for: `tdk upgrade` used to only swap the `tdk` binary
// and leave the bundled tdk-cli/ engine+templates folder next to it stale or
// missing, so an upgraded binary still crashed with the loadTemplate ENOENT
// (the exact error this was meant to fix). It must refresh both, every time.
describe("upgradeViaBinary", () => {
  let installDir: string;
  let tdkPath: string;
  let release: BinaryRelease;

  beforeEach(() => {
    installDir = mkdtempSync(join(tmpdir(), "tdk-upgrade-test-"));
    tdkPath = join(installDir, "tdk");
    release = {
      tag: "v1.3.21",
      assetName: "tdk-darwin-arm64",
      downloadUrl: "https://example.test/tdk-darwin-arm64",
      engineDownloadUrl: "https://example.test/tdk-cli-engine.tar.gz",
    };
    execSyncMock.mockReset();
    execSyncMock.mockReturnValue("");
  });

  afterEach(() => {
    rmSync(installDir, { recursive: true, force: true });
  });

  function commandsRun(): string[] {
    return execSyncMock.mock.calls.map((call) => call[0] as string);
  }

  it("downloads and extracts the bundled engine tarball next to the binary, not just the binary itself", async () => {
    const ok = await upgradeViaBinary(tdkPath, release);
    expect(ok).toBe(true);

    const commands = commandsRun();
    const engineDir = join(installDir, "tdk-cli");

    expect(commands.some((c) => c.includes("curl") && c.includes(release.downloadUrl))).toBe(true);
    expect(commands.some((c) => c.includes("curl") && c.includes(release.engineDownloadUrl))).toBe(
      true,
    );
    expect(commands.some((c) => c.startsWith("rm -rf") && c.includes(engineDir))).toBe(true);
    expect(commands.some((c) => c.startsWith("mkdir -p") && c.includes(engineDir))).toBe(true);
    expect(
      commands.some(
        (c) => c.includes("tar -xzf") && c.includes(engineDir) && c.includes("--strip-components=1"),
      ),
    ).toBe(true);
  });

  it("downloads both the binary and the engine tarball before installing either", async () => {
    await upgradeViaBinary(tdkPath, release);

    const commands = commandsRun();
    const binaryCurlIndex = commands.findIndex((c) => c.includes(release.downloadUrl));
    const engineCurlIndex = commands.findIndex((c) => c.includes(release.engineDownloadUrl));
    const mvIndex = commands.findIndex((c) => c.startsWith("mv "));
    const tarIndex = commands.findIndex((c) => c.includes("tar -xzf"));

    expect(binaryCurlIndex).toBeGreaterThanOrEqual(0);
    expect(engineCurlIndex).toBeGreaterThanOrEqual(0);
    expect(mvIndex).toBeGreaterThan(binaryCurlIndex);
    expect(mvIndex).toBeGreaterThan(engineCurlIndex);
    expect(tarIndex).toBeGreaterThan(engineCurlIndex);
  });

  it("never shells out to sudo, and fails fast without touching the network when the install dir isn't writable", async () => {
    chmodSync(installDir, 0o555);
    try {
      const ok = await upgradeViaBinary(tdkPath, release);
      expect(ok).toBe(false);
      expect(execSyncMock).not.toHaveBeenCalled();
      expect(commandsRun().some((c) => c.includes("sudo"))).toBe(false);
    } finally {
      chmodSync(installDir, 0o755);
    }
  });

  it("isWritable reflects actual filesystem permissions", () => {
    expect(isWritable(installDir)).toBe(true);
    chmodSync(installDir, 0o555);
    try {
      expect(isWritable(installDir)).toBe(false);
    } finally {
      chmodSync(installDir, 0o755);
    }
  });
});

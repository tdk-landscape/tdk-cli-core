import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const execSyncMock = vi.fn();
vi.mock("node:child_process", () => ({
  execSync: (...args: unknown[]) => execSyncMock(...args),
}));

const { upgradeViaBinary, isWritable, parseChecksums } = await import("../upgrade.js");

import type { BinaryRelease } from "../upgrade.js";

// Regression coverage for: `tdk upgrade` used to only swap the `tdk` binary
// and leave the bundled tdk-cli/ engine+templates folder next to it stale or
// missing, so an upgraded binary still crashed with the loadTemplate ENOENT
// (the exact error this was meant to fix). It must refresh both, every time.
const BINARY_BYTES = "fake tdk binary";
const ENGINE_BYTES = "fake engine tarball";
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

describe("upgradeViaBinary", () => {
  let installDir: string;
  let tdkPath: string;
  let release: BinaryRelease;
  let checksums: string;
  const downloaded: string[] = [];

  // Stands in for curl: `curl -fsSL -o "<path>" "<url>"` writes the asset's
  // bytes to <path>; `curl -fsSL "<checksums url>"` returns checksums.txt.
  function fakeExec(command: string): string {
    const download = command.match(/^curl -fsSL -o (".*?") (".*?")$/);
    if (download) {
      const path = JSON.parse(download[1]) as string;
      const url = JSON.parse(download[2]) as string;
      writeFileSync(path, url === release.engineDownloadUrl ? ENGINE_BYTES : BINARY_BYTES);
      downloaded.push(path);
      return "";
    }
    if (command.includes(release.checksumsUrl)) return checksums;
    return "";
  }

  beforeEach(() => {
    installDir = mkdtempSync(join(tmpdir(), "tdk-upgrade-test-"));
    tdkPath = join(installDir, "tdk");
    release = {
      tag: "v1.3.21",
      assetName: "tdk-darwin-arm64",
      downloadUrl: "https://example.test/tdk-darwin-arm64",
      engineDownloadUrl: "https://example.test/tdk-cli-engine.tar.gz",
      checksumsUrl: "https://example.test/checksums.txt",
    };
    checksums = [
      `${sha256(BINARY_BYTES)}  tdk-darwin-arm64`,
      `${sha256("other platform")}  tdk-linux-amd64`,
      `${sha256(ENGINE_BYTES)}  tdk-cli-engine.tar.gz`,
    ].join("\n");
    execSyncMock.mockReset();
    execSyncMock.mockImplementation(fakeExec);
  });

  afterEach(() => {
    rmSync(installDir, { recursive: true, force: true });
    for (const path of downloaded.splice(0)) rmSync(path, { force: true });
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
        (c) =>
          c.includes("tar -xzf") && c.includes(engineDir) && c.includes("--strip-components=1"),
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

  it("verifies checksums after both downloads and before installing anything", async () => {
    await upgradeViaBinary(tdkPath, release);

    const commands = commandsRun();
    const checksumsIndex = commands.findIndex((c) => c.includes(release.checksumsUrl));
    const engineCurlIndex = commands.findIndex((c) => c.includes(release.engineDownloadUrl));
    const mvIndex = commands.findIndex((c) => c.startsWith("mv "));

    expect(checksumsIndex).toBeGreaterThan(engineCurlIndex);
    expect(mvIndex).toBeGreaterThan(checksumsIndex);
  });

  it.each([
    [
      "the binary does not match",
      () => checksums.replace(sha256(BINARY_BYTES), sha256("tampered")),
    ],
    [
      "the engine tarball does not match",
      () => checksums.replace(sha256(ENGINE_BYTES), sha256("x")),
    ],
    ["checksums.txt has no entry for the binary", () => checksums.replace("tdk-darwin-arm64", "x")],
  ])("refuses to install when %s", async (_case, makeChecksums) => {
    checksums = makeChecksums();
    const ok = await upgradeViaBinary(tdkPath, release);

    expect(ok).toBe(false);
    const commands = commandsRun();
    expect(commands.some((c) => c.startsWith("mv "))).toBe(false);
    expect(commands.some((c) => c.includes("tar -xzf"))).toBe(false);
    expect(commands.some((c) => c.startsWith("rm -rf"))).toBe(false);
  });

  it("still installs releases whose checksums.txt predates the engine entry", async () => {
    checksums = checksums
      .split("\n")
      .filter((line) => !line.endsWith("tdk-cli-engine.tar.gz"))
      .join("\n");
    const ok = await upgradeViaBinary(tdkPath, release);

    expect(ok).toBe(true);
    expect(commandsRun().some((c) => c.startsWith("mv "))).toBe(true);
  });

  // root ignores the write-permission bit (accessSync(W_OK) legitimately
  // returns true even on a 0o555 dir), so these checks only hold for
  // non-root users.
  const isRoot = process.getuid?.() === 0;

  it.skipIf(isRoot)(
    "never shells out to sudo, and fails fast without touching the network when the install dir isn't writable",
    async () => {
      chmodSync(installDir, 0o555);
      try {
        const ok = await upgradeViaBinary(tdkPath, release);
        expect(ok).toBe(false);
        expect(execSyncMock).not.toHaveBeenCalled();
        expect(commandsRun().some((c) => c.includes("sudo"))).toBe(false);
      } finally {
        chmodSync(installDir, 0o755);
      }
    },
  );

  it.skipIf(isRoot)("isWritable reflects actual filesystem permissions", () => {
    expect(isWritable(installDir)).toBe(true);
    chmodSync(installDir, 0o555);
    try {
      expect(isWritable(installDir)).toBe(false);
    } finally {
      chmodSync(installDir, 0o755);
    }
  });
});

describe("parseChecksums", () => {
  it("reads both text-mode and binary-mode (*name) shasum lines and ignores junk", () => {
    const a = "a".repeat(64);
    const b = "B".repeat(64);
    const sums = parseChecksums(
      `${a}  tdk-linux-amd64\n${b} *tdk-cli-engine.tar.gz\n\nnot a checksum line\n`,
    );

    expect(sums.get("tdk-linux-amd64")).toBe(a);
    expect(sums.get("tdk-cli-engine.tar.gz")).toBe("b".repeat(64));
    expect(sums.size).toBe(2);
  });
});

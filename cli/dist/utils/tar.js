import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
/**
 * Extracts a gzipped tarball (as an in-memory buffer) into destDir.
 * Shells out to the system `tar` binary rather than pulling in a JS tar
 * implementation - available by default on macOS and Linux.
 */
export function extractTarball(data, destDir) {
    const tmpFile = join(mkdtempSync(join(tmpdir(), "tdk-ext-")), "bundle.tar.gz");
    writeFileSync(tmpFile, data);
    const result = spawnSync("tar", ["xzf", tmpFile, "-C", destDir, "--strip-components=1"], {
        stdio: "pipe",
    });
    rmSync(join(tmpFile, ".."), { recursive: true, force: true });
    if (result.status !== 0) {
        throw new Error(`tar extraction failed: ${result.stderr?.toString() || "unknown error"}`);
    }
}
//# sourceMappingURL=tar.js.map
/**
 * Extracts a gzipped tarball (as an in-memory buffer) into destDir.
 * Shells out to the system `tar` binary rather than pulling in a JS tar
 * implementation - available by default on macOS and Linux.
 */
export declare function extractTarball(data: Buffer, destDir: string): void;
//# sourceMappingURL=tar.d.ts.map
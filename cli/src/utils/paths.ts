import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import type { JsonObject, PackageInfo } from "../types/index.js";

export function findProjectRoot(startDir: string = cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = resolve("/");

  while (currentDir !== root) {
    if (existsSync(join(currentDir, ".tdk", "project.json"))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return null;
}

let packageCache: PackageInfo | null = null;

function getPackageInfo(): PackageInfo {
  if (packageCache) {
    return packageCache;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packagePath = resolve(__dirname, "..", "..", "package.json");

  const content = readFileSync(packagePath, "utf-8");

  // Parse with unknown type, then validate before asserting type
  const parsed: unknown = JSON.parse(content);

  // Runtime validation: package.json must be an object, not null, not an array
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid package.json at ${packagePath}: expected object`);
  }

  // Safe to cast after validation - we know it's a Record<string, unknown>
  const pkg = parsed as JsonObject;

  packageCache = {
    name: String(pkg.name ?? "@tdk/cli"),
    version: String(pkg.version ?? "0.0.0"),
    fullPackage: pkg,
  };

  return packageCache;
}

export function getPackageVersion(): string {
  return getPackageInfo().version;
}

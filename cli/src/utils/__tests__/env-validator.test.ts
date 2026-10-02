import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as envValidator from "../env-validator.js";

let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "tdk-env-validator-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const writeEnv = (content: string) => writeFileSync(join(root, ".env"), content);
const readEnv = () => readFileSync(join(root, ".env"), "utf-8");
const envValue = (content: string, name: string) =>
  content.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1];

describe("generated project .env", () => {
  it("generates a random JWT secret per project", () => {
    const first = envValidator.generateEnvFile();
    const second = envValidator.generateEnvFile();
    expect(envValue(first, "JWT_SECRET")).toMatch(/^[0-9a-f]{64}$/);
    expect(envValue(first, "JWT_SECRET")).not.toBe(envValue(second, "JWT_SECRET"));
  });

  it("does not require the paid Verdaccio registry", () => {
    writeEnv("TILT_ENV=dev\nDB_PASSWORD=x\nJWT_SECRET=y\n");
    expect(envValidator.validateEnvFile(root).missing).toEqual([]);
  });

  it("uses the generated DB_PASSWORD in DATABASE_URL, not a shared literal", () => {
    const content = envValidator.generateEnvFile();
    const password = envValue(content, "DB_PASSWORD");
    expect(password).toMatch(/^[0-9a-f]{32}$/);
    const url = envValue(content, "DATABASE_URL");
    if (url !== undefined && url !== "") {
      expect(url).toContain(`:${password}@`);
      expect(url).not.toContain(":postgres@");
    }
  });
});

describe("validateEnvFile parsing", () => {
  it("recognises names written with an export prefix", () => {
    writeEnv("export TILT_ENV=dev\nexport DB_PASSWORD=x\nexport JWT_SECRET=y\n");
    expect(envValidator.validateEnvFile(root).missing).toEqual([]);
  });

  it("treats a quoted empty value as empty", () => {
    writeEnv("TILT_ENV=dev\nDB_PASSWORD=\"\"\nJWT_SECRET=''\n");
    const { invalid } = envValidator.validateEnvFile(root);
    expect(invalid).toContain("DB_PASSWORD is set but empty");
    expect(invalid).toContain("JWT_SECRET is set but empty");
  });

  it("warns when DATABASE_URL carries a different password than DB_PASSWORD", () => {
    writeEnv(
      "TILT_ENV=dev\nDB_PASSWORD=abc123\nJWT_SECRET=y\nDATABASE_URL=postgresql://postgres:postgres@postgres:5432/app_dev\n",
    );
    expect(envValidator.validateEnvFile(root).warnings.join("\n")).toMatch(
      /DATABASE_URL.*DB_PASSWORD/,
    );
  });
});

describe("completing an existing .env", () => {
  it("appends keys a newer CLI expects without touching existing values", () => {
    writeEnv("TILT_ENV=dev\nDB_PASSWORD=keep-this-password\n");
    const added = envValidator.completeEnvFile(root);
    const content = readEnv();
    expect(added).toContain("JWT_SECRET");
    expect(envValue(content, "DB_PASSWORD")).toBe("keep-this-password");
    expect(envValue(content, "TILT_ENV")).toBe("dev");
    expect(envValue(content, "JWT_SECRET")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is idempotent and does not rotate a secret it already added", () => {
    writeEnv("TILT_ENV=dev\nDB_PASSWORD=keep-this-password\n");
    envValidator.completeEnvFile(root);
    const afterFirst = readEnv();
    expect(envValidator.completeEnvFile(root)).toEqual([]);
    expect(readEnv()).toBe(afterFirst);
  });

  it("creates the file when it is missing", () => {
    expect(existsSync(join(root, ".env"))).toBe(false);
    expect(envValidator.completeEnvFile(root).length).toBeGreaterThan(0);
    expect(envValue(readEnv(), "JWT_SECRET")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps ensureEnvFile reporting only a newly created file", () => {
    writeEnv("TILT_ENV=dev\nDB_PASSWORD=keep-this-password\n");
    expect(envValidator.ensureEnvFile(root)).toBe(false);
    expect(envValue(readEnv(), "DB_PASSWORD")).toBe("keep-this-password");
  });
});

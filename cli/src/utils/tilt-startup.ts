import { isValidPort } from "./validation.js";

export type TiltPortParseResult =
  | { ok: true; port: number | undefined }
  | { ok: false; message: string };

export function parseTiltPort(value: string | undefined): TiltPortParseResult {
  if (value === undefined || value === "") return { ok: true, port: undefined };

  const port = Number(value);
  if (!/^[0-9]+$/.test(value) || !isValidPort(port)) {
    return {
      ok: false,
      message: `Invalid TILT_PORT "${value}": expected an integer from 1 to 65535.`,
    };
  }

  return { ok: true, port };
}

export async function resolveTiltPort(options: {
  configuredPort: number | undefined;
  force: boolean;
  basePort: number;
  findAvailablePort: (basePort: number, attempts: number) => Promise<number | null | undefined>;
}): Promise<{ port: number; autoSwitched: boolean }> {
  if (options.configuredPort !== undefined) {
    return { port: options.configuredPort, autoSwitched: false };
  }
  if (options.force) return { port: options.basePort, autoSwitched: false };

  const availablePort = await options.findAvailablePort(options.basePort, 10);
  if (availablePort && availablePort !== options.basePort) {
    return { port: availablePort, autoSwitched: true };
  }
  return { port: options.basePort, autoSwitched: false };
}

export async function stopTiltForUp(
  options: { force: boolean; quiet: boolean; port: number },
  dependencies: {
    stop: (port: number) => void;
    log: (message: string) => void;
    wait: (milliseconds: number) => Promise<void>;
  },
): Promise<void> {
  if (!options.force) return;

  if (!options.quiet) {
    dependencies.log(`Force flag set - stopping Tilt on port ${options.port} if running...`);
  }
  dependencies.stop(options.port);
  await dependencies.wait(2000);
}

import { createServer } from "node:net";

export interface HostPortPlan {
  ingressHttp: number;
  ingressHttps: number;
  postgres: number;
  explicit: {
    ingressHttp: boolean;
    ingressHttps: boolean;
    postgres: boolean;
  };
}

export interface HostPortPlanOptions {
  env?: NodeJS.ProcessEnv;
  isAvailable?: (port: number) => Promise<boolean>;
  ranges?: Partial<Record<keyof HostPortPlan["explicit"], { start: number; end: number }>>;
}

const DEFAULT_RANGES = {
  ingressHttp: { start: 8080, end: 8180 },
  ingressHttps: { start: 8443, end: 8543 },
  postgres: { start: 15432, end: 15532 },
} as const;

const ENV_KEYS = {
  ingressHttp: "TDK_HTTP_PORT",
  ingressHttps: "TDK_HTTPS_PORT",
  postgres: "TDK_POSTGRES_PORT",
} as const;

async function isHostPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => server.close(() => resolve(true)));
  });
}

function parsePort(name: string, value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `${name} must be an integer between 1 and 65535 (received ${JSON.stringify(value)})`,
    );
  }
  return port;
}

export async function createHostPortPlan(options: HostPortPlanOptions = {}): Promise<HostPortPlan> {
  const env = options.env ?? process.env;
  const isAvailable = options.isAvailable ?? isHostPortAvailable;
  const explicitFlags = { ingressHttp: false, ingressHttps: false, postgres: false };
  const selected: Partial<HostPortPlan> = { explicit: explicitFlags };
  const reserved = new Set<number>();

  for (const key of ["ingressHttp", "ingressHttps", "postgres"] as const) {
    const envValue = env[ENV_KEYS[key]];
    const explicit = envValue !== undefined && envValue.trim() !== "";
    const range = options.ranges?.[key] ?? DEFAULT_RANGES[key];
    const candidates = explicit
      ? [parsePort(ENV_KEYS[key], envValue)]
      : Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start + index);

    let chosen: number | undefined;
    for (const port of candidates) {
      if (reserved.has(port)) continue;
      if (await isAvailable(port)) {
        chosen = port;
        break;
      }
      if (explicit) {
        throw new Error(
          `${ENV_KEYS[key]}=${port} is already in use. Choose a free host port and retry.`,
        );
      }
    }
    if (chosen === undefined) {
      throw new Error(
        `No available host port in ${range.start}-${range.end} for ${key}. Set ${ENV_KEYS[key]} to a free port and retry.`,
      );
    }
    reserved.add(chosen);
    selected[key] = chosen;
    explicitFlags[key] = explicit;
  }

  return selected as HostPortPlan;
}

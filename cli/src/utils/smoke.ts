import type { DiscoveredResource } from "../types/index.js";
import { isApiServiceType } from "./resource-kind.js";
import { resolveServicePath, resolveSubdomainBases } from "./service-urls.js";

/**
 * A post-start check a service declares in service.json. It runs through the URL `tdk up` prints (Traefik), not inside the
 * container, so it catches what `healthCheckPath` cannot: a route Traefik never registered, a shared router, a database the
 * service is not actually using.
 */
export interface SmokeStep {
  name?: string;
  method?: string;
  /** Appended to the service's public base URL. Must start with `/`. `{{name}}` is replaced by a value saved by an earlier step. */
  path: string;
  body?: unknown;
  /** Expected HTTP status. Defaults to 200. */
  expect?: number;
  bodyContains?: string;
  /** Saves response fields for later steps: `{ "id": "$.id" }`. Supports `$.a.b[0]`. */
  save?: Record<string, string>;
}

export interface SmokeConfig {
  via: "proxy";
  timeoutSeconds?: number;
  steps: SmokeStep[];
}

export interface SmokePlan {
  name: string;
  baseUrl: string;
  smoke: SmokeConfig;
}

export interface SmokeResult {
  name: string;
  ok: boolean;
  failure?: string;
}

export interface SmokeDeps {
  fetch?: (
    url: string,
    init: { method: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
  ) => Promise<{ status: number; text(): Promise<string> }>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export const DEFAULT_SMOKE_TIMEOUT_SECONDS = 60;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const BODY_SNIPPET_CHARS = 200;
/** Statuses a proxy answers while a route or its upstream is not up yet. Anything else is the service's real answer. */
const NOT_READY_STATUSES = new Set([404, 502, 503, 504]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateSmoke(smoke: unknown): string[] {
  if (!isRecord(smoke)) return ['smoke: must be an object with "via" and "steps"'];
  const errors: string[] = [];
  if (smoke.via !== "proxy") {
    errors.push('smoke.via: only "proxy" is supported (the check must go through the public URL)');
  }
  if (
    smoke.timeoutSeconds !== undefined &&
    !(typeof smoke.timeoutSeconds === "number" && smoke.timeoutSeconds > 0)
  ) {
    errors.push("smoke.timeoutSeconds: must be a number greater than 0");
  }
  if (!Array.isArray(smoke.steps) || smoke.steps.length === 0) {
    errors.push("smoke.steps: needs at least one step");
    return errors;
  }
  smoke.steps.forEach((step: unknown, index: number) => {
    const at = `smoke.steps[${index}]`;
    if (!isRecord(step)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    const path = step.path;
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
      errors.push(
        `${at}.path: must start with "/" and is appended to the public URL; a full URL or relative path would skip the proxy`,
      );
    }
    if (
      step.expect !== undefined &&
      !(
        typeof step.expect === "number" &&
        Number.isInteger(step.expect) &&
        step.expect >= 100 &&
        step.expect <= 599
      )
    ) {
      errors.push(`${at}.expect: must be an HTTP status between 100 and 599`);
    }
    if (step.bodyContains !== undefined && typeof step.bodyContains !== "string") {
      errors.push(`${at}.bodyContains: must be a string`);
    }
    if (step.save !== undefined) {
      const ok =
        isRecord(step.save) &&
        Object.values(step.save).every((v) => typeof v === "string" && v.startsWith("$."));
      if (!ok) errors.push(`${at}.save: must map names to paths such as "$.id"`);
    }
  });
  return errors;
}

/** One plan per routable service that declares `smoke`. Workers and BYO with exposeViaProxy false have no public route. */
export function buildSmokePlans(
  resources: DiscoveredResource[],
  ingressPort?: number,
): SmokePlan[] {
  const { appBase, apiBase } = resolveSubdomainBases(ingressPort);
  const plans: SmokePlan[] = [];
  for (const resource of resources) {
    const config = resource.config;
    if (!config?.smoke) continue;
    const appType = config.appType;
    const isApi = isApiServiceType(appType) || appType === "bring-your-own";
    if (!isApi && appType !== "frontend") continue;
    if (config.exposeViaProxy === false) continue;
    const base = isApi ? apiBase : appBase;
    plans.push({
      name: resource.name,
      baseUrl: `${base}${resolveServicePath(resource).replace(/\/+$/, "")}`,
      smoke: config.smoke,
    });
  }
  return plans;
}

function readPath(value: unknown, path: string): unknown {
  const parts = path.replace(/^\$\.?/, "").match(/[^.[\]]+/g) ?? [];
  let current: unknown = value;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function fill(template: string, saved: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => saved[key] ?? match);
}

function fillBody(body: unknown, saved: Record<string, string>): unknown {
  if (typeof body === "string") return fill(body, saved);
  if (Array.isArray(body)) return body.map((item) => fillBody(item, saved));
  if (isRecord(body)) {
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, fillBody(v, saved)]));
  }
  return body;
}

function snippet(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > BODY_SNIPPET_CHARS ? `${flat.slice(0, BODY_SNIPPET_CHARS)}...` : flat;
}

/** Runs the steps in order. A not-ready answer (connection error, 404, 502-504) is retried until the timeout; a real wrong answer fails at once. */
export async function runSmokePlan(plan: SmokePlan, deps: SmokeDeps = {}): Promise<SmokeResult> {
  const doFetch = deps.fetch ?? ((url, init) => fetch(url, init));
  const now = deps.now ?? Date.now;
  const sleep =
    deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const deadline = now() + (plan.smoke.timeoutSeconds ?? DEFAULT_SMOKE_TIMEOUT_SECONDS) * 1000;
  const saved: Record<string, string> = {};

  for (const [index, step] of plan.smoke.steps.entries()) {
    const label = step.name ?? `step ${index + 1}`;
    const method = (step.method ?? "GET").toUpperCase();
    const url = `${plan.baseUrl}${fill(step.path, saved)}`;
    const expected = step.expect ?? 200;
    const hasBody = step.body !== undefined;

    let status: number | undefined;
    let text = "";
    let error: string | undefined;
    for (;;) {
      error = undefined;
      status = undefined;
      try {
        const response = await doFetch(url, {
          method,
          headers: hasBody ? { "content-type": "application/json" } : undefined,
          body: hasBody ? JSON.stringify(fillBody(step.body, saved)) : undefined,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        status = response.status;
        text = await response.text();
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      const notReady =
        error !== undefined ||
        (status !== undefined && status !== expected && NOT_READY_STATUSES.has(status));
      if (!notReady || now() >= deadline) break;
      await sleep(RETRY_DELAY_MS);
    }

    const where = `${plan.name}: ${label}: ${method} ${url}`;
    if (error !== undefined)
      return { name: plan.name, ok: false, failure: `${where} never answered (${error})` };
    if (status !== expected) {
      return {
        name: plan.name,
        ok: false,
        failure: `${where} returned ${status}, expected ${expected}${text ? `: ${snippet(text)}` : ""}`,
      };
    }
    if (step.bodyContains !== undefined && !text.includes(step.bodyContains)) {
      return {
        name: plan.name,
        ok: false,
        failure: `${where} returned ${status} but the body does not contain "${step.bodyContains}": ${snippet(text)}`,
      };
    }
    if (step.save) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          name: plan.name,
          ok: false,
          failure: `${where} returned a body that is not JSON, cannot save: ${snippet(text)}`,
        };
      }
      for (const [key, path] of Object.entries(step.save)) {
        const value = readPath(parsed, path);
        if (value === undefined || value === null || typeof value === "object") {
          return {
            name: plan.name,
            ok: false,
            failure: `${where} response has no ${path} to save as {{${key}}}: ${snippet(text)}`,
          };
        }
        saved[key] = String(value);
      }
    }
  }
  return { name: plan.name, ok: true };
}

export function formatSmokeFailure(result: SmokeResult): string {
  return `Smoke check failed: ${result.failure}`;
}

/** Runs every plan side by side; each plan keeps its own timeout. */
export async function runSmokePlans(
  plans: SmokePlan[],
  deps: SmokeDeps = {},
): Promise<SmokeResult[]> {
  return Promise.all(plans.map((plan) => runSmokePlan(plan, deps)));
}

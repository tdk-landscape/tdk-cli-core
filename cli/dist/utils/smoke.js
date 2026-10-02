import { isApiServiceType } from "./resource-kind.js";
import { resolveServicePath, resolveSubdomainBases } from "./service-urls.js";
export const DEFAULT_SMOKE_TIMEOUT_SECONDS = 60;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const BODY_SNIPPET_CHARS = 200;
/** Statuses a proxy answers while a route or its upstream is not up yet. Anything else is the service's real answer. */
const NOT_READY_STATUSES = new Set([404, 502, 503, 504]);
/** Error codes that prove the request never left this machine, so repeating even a write is safe. */
const PRE_SEND_ERROR_CODES = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "EHOSTUNREACH",
    "ENETUNREACH",
]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** A thrown request error is retried for safe methods, and for others only when its code shows the request was never sent. */
function shouldRetryRequestError(err, method) {
    if (SAFE_METHODS.has(method))
        return true;
    if (!isRecord(err))
        return false;
    const cause = isRecord(err.cause) ? err.cause : undefined;
    const code = err.code ?? cause?.code;
    return typeof code === "string" && PRE_SEND_ERROR_CODES.has(code);
}
export function validateSmoke(smoke) {
    if (!isRecord(smoke))
        return ['smoke: must be an object with "via" and "steps"'];
    const errors = [];
    if (smoke.via !== "proxy") {
        errors.push('smoke.via: only "proxy" is supported (the check must go through the public URL)');
    }
    if (smoke.timeoutSeconds !== undefined &&
        !(typeof smoke.timeoutSeconds === "number" && smoke.timeoutSeconds > 0)) {
        errors.push("smoke.timeoutSeconds: must be a number greater than 0");
    }
    if (!Array.isArray(smoke.steps) || smoke.steps.length === 0) {
        errors.push("smoke.steps: needs at least one step");
        return errors;
    }
    smoke.steps.forEach((step, index) => {
        const at = `smoke.steps[${index}]`;
        if (!isRecord(step)) {
            errors.push(`${at}: must be an object`);
            return;
        }
        const path = step.path;
        if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
            errors.push(`${at}.path: must start with "/" and is appended to the public URL; a full URL or relative path would skip the proxy`);
        }
        if (step.expect !== undefined &&
            !(typeof step.expect === "number" &&
                Number.isInteger(step.expect) &&
                step.expect >= 100 &&
                step.expect <= 599)) {
            errors.push(`${at}.expect: must be an HTTP status between 100 and 599`);
        }
        if (step.bodyContains !== undefined && typeof step.bodyContains !== "string") {
            errors.push(`${at}.bodyContains: must be a string`);
        }
        if (step.save !== undefined) {
            const ok = isRecord(step.save) &&
                Object.values(step.save).every((v) => typeof v === "string" && v.startsWith("$."));
            if (!ok)
                errors.push(`${at}.save: must map names to paths such as "$.id"`);
        }
    });
    return errors;
}
/** One plan per routable service that declares `smoke`. Workers and BYO with exposeViaProxy false have no public route. */
export function buildSmokePlans(resources, ingressPort) {
    const { appBase, apiBase } = resolveSubdomainBases(ingressPort);
    const plans = [];
    for (const resource of resources) {
        const config = resource.config;
        if (!config?.smoke)
            continue;
        const appType = config.appType;
        const isApi = isApiServiceType(appType) || appType === "bring-your-own";
        if (!isApi && appType !== "frontend")
            continue;
        if (config.exposeViaProxy === false)
            continue;
        const base = isApi ? apiBase : appBase;
        plans.push({
            name: resource.name,
            baseUrl: `${base}${resolveServicePath(resource).replace(/\/+$/, "")}`,
            smoke: config.smoke,
        });
    }
    return plans;
}
function readPath(value, path) {
    const parts = path.replace(/^\$\.?/, "").match(/[^.[\]]+/g) ?? [];
    let current = value;
    for (const part of parts) {
        if (current === null || current === undefined)
            return undefined;
        current = current[part];
    }
    return current;
}
function fill(template, saved) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => saved[key] ?? match);
}
function fillBody(body, saved) {
    if (typeof body === "string")
        return fill(body, saved);
    if (Array.isArray(body))
        return body.map((item) => fillBody(item, saved));
    if (isRecord(body)) {
        return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, fillBody(v, saved)]));
    }
    return body;
}
function snippet(text) {
    const flat = text.replace(/\s+/g, " ").trim();
    return flat.length > BODY_SNIPPET_CHARS ? `${flat.slice(0, BODY_SNIPPET_CHARS)}...` : flat;
}
/** Runs the steps in order. A not-ready answer (connection error, 404, 502-504) is retried until the timeout; a real wrong answer fails at once. */
export async function runSmokePlan(plan, deps = {}) {
    const doFetch = deps.fetch ?? ((url, init) => fetch(url, init));
    const now = deps.now ?? Date.now;
    const sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const deadline = now() + (plan.smoke.timeoutSeconds ?? DEFAULT_SMOKE_TIMEOUT_SECONDS) * 1000;
    const saved = {};
    // A manifest with errors is still loaded, so a malformed block must fail the check, not throw out of `tdk up`.
    const invalid = validateSmoke(plan.smoke);
    if (invalid.length > 0) {
        return {
            name: plan.name,
            ok: false,
            failure: `${plan.name}: invalid smoke block: ${invalid.join("; ")}`,
        };
    }
    for (const [index, step] of plan.smoke.steps.entries()) {
        const label = step.name ?? `step ${index + 1}`;
        const method = (step.method ?? "GET").toUpperCase();
        const url = `${plan.baseUrl}${fill(step.path, saved)}`;
        const expected = step.expect ?? 200;
        const hasBody = step.body !== undefined;
        let status;
        let text = "";
        let error;
        for (;;) {
            error = undefined;
            status = undefined;
            let retryableError = false;
            try {
                const response = await doFetch(url, {
                    method,
                    headers: hasBody ? { "content-type": "application/json" } : undefined,
                    body: hasBody ? JSON.stringify(fillBody(step.body, saved)) : undefined,
                    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                });
                status = response.status;
                text = await response.text();
            }
            catch (err) {
                retryableError = shouldRetryRequestError(err, method);
                error = err instanceof Error ? err.message : String(err);
            }
            const notReady = (error !== undefined && retryableError) ||
                (status !== undefined && status !== expected && NOT_READY_STATUSES.has(status));
            if (!notReady || now() >= deadline)
                break;
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
            let parsed;
            try {
                parsed = JSON.parse(text);
            }
            catch {
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
export function formatSmokeFailure(result) {
    return `Smoke check failed: ${result.failure}`;
}
/** Runs every plan side by side; each plan keeps its own timeout. */
export async function runSmokePlans(plans, deps = {}) {
    return Promise.all(plans.map((plan) => runSmokePlan(plan, deps)));
}
//# sourceMappingURL=smoke.js.map
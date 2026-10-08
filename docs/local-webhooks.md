# Testing webhooks locally when the real provider is unavailable

Payment, email and identity providers call your service, and sooner or later you need to reproduce a delivery that went wrong without a provider account, a tunnel or the provider's cooperation. This page is a **proposed recipe**, not a TDK feature: TDK has no webhook replay command, and nothing here was run against a real provider. It came out of [discussion #373](https://github.com/orgs/tdk-landscape/discussions/373), where [@ECD5A](https://github.com/ECD5A) described the approach. Stripe is used below only as an example of documented provider behaviour; signature formats and retry rules are provider-specific, so check your provider's documentation.

TDK's part is small: `tdk up` gives you the backend, the database and the route to send requests to (see [Smoke check](smoke.md) for the URL it prints). The rest is a script you keep in your repository.

## The default reproducer

Use a local emitter instead of the provider:

- **Pinned payloads.** Sanitized fixtures with fixed event IDs, committed to the repository.
- **A dummy signing key.** Not a real secret, used only in local development. Pass it to the service as a non-secret `params` value (see [Environment, params and secrets](environment.md#params)).
- **A controllable clock**, so you can produce an expired signature on purpose.
- **The real HTTP route and the production verification code.** Do not mock verification away, or you are not testing the handler you ship.

Keep the provider's sandbox for an occasional contract check. A handler failure should not need it to reproduce.

Fixtures must be **re-signed** with the dummy key after any payload edit; an old signature will not validate against changed bytes. Verify against the **raw request body**, not a re-serialized parse of it.

### A minimal signer and verifier

This shows the shape only. The scheme (`HMAC-SHA256` over `<timestamp>.<raw body>`) is made up for the example and is not any provider's format. It was run with Node 24 and printed `valid true`, `tampered false`, `expired false`.

```js
import { createHmac, timingSafeEqual } from "node:crypto";

const KEY = "dummy-local-signing-key";
const sign = (ts, raw) => createHmac("sha256", KEY).update(`${ts}.${raw}`).digest("hex");

const verify = (ts, raw, sig, now, toleranceSeconds = 300) =>
  Math.abs(now - ts) <= toleranceSeconds &&
  sig.length === sign(ts, raw).length &&
  timingSafeEqual(Buffer.from(sig), Buffer.from(sign(ts, raw)));
```

## The scenario to keep: durable acceptance, lost acknowledgement, retry

If you keep only one scenario, keep this one.

1. Deliver a valid signed event, such as `invoice.paid`, with a fixed fixture event ID.
2. Let the receiver commit its inbox entry, then drop the connection before the provider sees the acknowledgement.
3. Retry the same event, including **two concurrent deliveries**. Use a fresh valid signature per delivery if your provider does that.
4. Drain the worker, restart it, and assert **one business effect**, no lost pending work and no duplicate effect after the restart.

Assert the resulting state, not just that the endpoint returned `200`.

- A unique constraint on the event ID, scoped to the provider and account, can arbitrate concurrent admission. The durable inbox or queue and the worker's retry rules still need their own tests.
- For effects outside your database, such as charging a card, keep a stable downstream idempotency key and test the ambiguous outcome (you do not know whether it happened) and reconciliation. A local database transaction does not make an external payment atomic.
- Deduplicate on the event or business identity, never on the delivery signature or arrival time.

## Reset state together, before the scenario

Replay needs state restoration. Reset all of these **before** the scenario starts, not between its deliveries:

- business data
- dedup, inbox and outbox tables
- queues
- fake-provider objects
- the clock

Otherwise yesterday's dedup row can make today's replay pass without running the handler. For resetting Postgres, see [Local data: reset, seed, snapshot](data.md).

## Then add the awkward cases

- Tampered bytes (must be rejected).
- Wrong signing key (must be rejected).
- Expired signed timestamp, where the provider signs one.
- Delayed and out-of-order events. Do not assume provider event timestamps totally order state changes.
- Provider `429` and timeout responses, if your service calls the provider back.

Stripe's documented behaviour is a useful example of why: retries get new signatures and timestamps, event order is not guaranteed, and verification needs the raw request body.

## One replay script

Put these behind a single script so a new teammate can reproduce a failure without a personal provider account:

- the fixture version
- the initial state
- the delivery schedule
- the expected final state

## Not covered

- No TDK command does any of this yet. If you want one, say so in the discussion.
- The recipe has not been tried against a specific provider, and the snippet is not a TDK-tested test harness.

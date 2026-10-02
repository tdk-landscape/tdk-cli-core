# Measuring a shop-real cold boot

This procedure measures a real twelve-service implementation that follows the
[shop-real reference](../examples/shop-real.md). It does not treat the 100 generated health-only
services in the scale benchmark as business services.

## Before the run

- Use a fresh Linux machine or CI runner. Record whether Docker image layers and package caches are
  empty; the script deliberately does not delete or bypass caches.
- Provide a checked-out project with `.tdk/project.json`, all twelve implementations, and local
  test doubles for external providers. Keep credentials out of the report.
- Confirm that the project defines readiness checks for its actual dependencies and application
  behavior. A process-only `/health` endpoint is not sufficient evidence that checkout or workers
  work.
- Record runner type, CPU architecture, available memory, TDK version, commit, Docker Engine,
  Compose, Tilt, and Bun versions.
- Do not run another TDK landscape on the same host during the measurement.

## Run

From the project root, run:

```bash
bash scripts/cold-boot-notes.sh . shop
```

The script records environment versions, runs `tdk doctor`, times `tdk up shop` until TDK reports
that Tilt is up, then polls `tdk doctor` until project checks and service health pass. It writes a
Markdown record in `cold-boot-results/` and stops the stack with `tdk down` when complete. A failed
or timed-out check is retained in the record; do not replace it with an estimated result.

## Report interpretation

The timed interval includes TDK preflight, Tilt startup, image builds and application readiness. It
does not isolate image-build time from service startup time. Preserve the raw TDK and doctor logs
alongside the record when investigating failures. Repeat on another fresh runner before presenting
a single run as representative. Report warm-cache runs separately.

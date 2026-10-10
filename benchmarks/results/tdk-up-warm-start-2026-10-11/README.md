# tdk up warm-start benchmark, 2026-10-11

Results of `scripts/benchmark/tdk-up-warm-start.sh` on `tdk-restaurant-example`: one cold run and three warm runs, with the Docker VM sampled. The table is in [`summary.md`](summary.md); the chart is [`span.svg`](span.svg); the raw data is in [`summary.json`](summary.json) and the per-run folders.

## Reproduce

```bash
scripts/benchmark/tdk-up-warm-start.sh \
  --project <path to a TDK project> \
  --out benchmarks/results/tdk-up-warm-start-$(date +%F) \
  --cold-runs 1 --warm-runs 3 --sample-vm
```

Read the side effects in [`scripts/benchmark/README.md`](../../../scripts/benchmark/README.md#tdk-up-warm-start-benchmark) first: a cold run removes the project's built images and clears the Docker build cache for every project on the machine.

## Result

| Run | Kind | Span (s) | Wall (s) | golden-layers-build (s) | Healthy |
|---|---|---:|---:|---:|---:|
| cold-1 | cold | 68.0 | 72 | 39.3 | 8/8 |
| warm-1 | warm | 11.1 | 19 | 0.7 (skipped) | 8/8 |
| warm-2 | warm | 10.0 | 19 | 0.6 (skipped) | 8/8 |
| warm-3 | warm | 12.5 | 19 | 0.7 (skipped) | 8/8 |

A warm start is about 19 seconds to healthy (72 seconds cold), and the golden base build drops from 39 seconds to under a second when it is skipped.

## Machine

macOS 26.5.2, arm64, 8 CPUs, 16 GiB; Docker Desktop with server 29.8.2; tdk 1.3.144; Tilt v0.37.7; Node v24.16.0.

## Caveats

- **Docker VM memory is not a per-start figure.** The sampled value is the resident memory of the Virtualization service and Docker's processes. It rises during a cold build and stays high afterwards (6.9 GB after the cold run, 3 to 6 GB during the warm runs), so a warm start's own cost cannot be read from it. The earlier 1.9 GB peak in the spec came from a run that began from a smaller VM and is not comparable.
- **One sample per condition.** Re-run before relying on a difference of a few seconds.
- **The cold run is a full rebuild on this machine,** with base images still present, so a machine without the base images will take longer.

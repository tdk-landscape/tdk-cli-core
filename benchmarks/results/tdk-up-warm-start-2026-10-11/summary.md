# tdk up warm-start benchmark

| Run | Kind | Span (s) | Wall (s) | golden-layers-build (s) | Healthy | Docker VM peak (MiB) |
|---|---|---:|---:|---:|---:|---:|
| cold-1 | cold | 68.0 | 72 | 39.3 | 8/8 | 6870 |
| warm-1 | warm | 11.1 | 19 | 0.7 (skipped) | 8/8 | 6196 |
| warm-2 | warm | 10.0 | 19 | 0.6 (skipped) | 8/8 | 4091 |
| warm-3 | warm | 12.5 | 19 | 0.7 (skipped) | 8/8 | 3091 |

Span is from the first Tilt build step to the last build finishing. Wall is from launching `tdk up` until every resource was idle and the expected containers were healthy.

## Build time per service (s)

| Resource | cold-1 | warm-1 | warm-2 | warm-3 |
|---|---:|---:|---:|---:|
| reservation-api | 11.9 | 2.7 | 2.5 | 3.2 |
| kitchen-api | 10.8 | 3.1 | 2.9 | 3.6 |
| menu-api | 11.3 | 3.6 | 3.2 | 2.8 |
| kitchen-worker | 8.7 | 2.9 | 3.0 | 3.5 |
| reservation-app | 12.0 | 2.8 | 3.1 | 2.7 |
| floor-app | 11.4 | 3.0 | 1.9 | 3.3 |

## Environment

- tdk: 1.3.144
- tilt: v0.37.7, built 2026-08-15
- docker: 29.8.2
- node: v24.16.0
- os: Darwin 25.5.0 arm64
- cpus: 8
- memory_bytes: 17179869184
- project: tdk-restaurant-example
- healthy_expected: 8
- sample_vm: 1

# Container scale benchmark

Release gate for the north star: **100 ERP services on a 16 GB machine without removing features**.

```bash
bun scripts/benchmark/container-scale.ts                       # tiers 5,10,20,50,80,100, gate on 100
bun scripts/benchmark/container-scale.ts --tiers 5,10 --gate 10
bun scripts/benchmark/container-scale.ts --legacy-healthcheck  # old 10s probes, for comparison
```

It uses the ERP images that `tdk up` already built in `../tdk-erp-system` (override with `--project` or `TDK_BENCH_PROJECT`). For each tier it starts N real service containers with the generated runtime settings (`--init`, 512 MiB / 0.5 CPU limits, healthchecks against `/health`). It then records:

- launch time, first-healthy and all-healthy time
- crashes and OOM kills, with each container's exit code and last log line
- total and average memory, CPU
- `docker ps` latency (`tdk doctor` fails above 10 s)
- p50 `/health` latency and host load

Containers are removed after each tier. Results are printed as a table and saved to `benchmarks/results/*.json`.

**Gate:** at the gate tier, every container must be healthy within the timeout with no crashes. Total memory must fit `(Docker VM memory - 512 MiB) / 100` per service, and `docker ps` must answer in under 10 s. The exit code is 1 when the gate fails.

**Git hook (opt-in):** call `scripts/benchmark/pre-release-gate.sh` from `pre-push` or `pre-commit`. It does nothing unless `TDK_BENCH_GATE=1`.

Rebuild the ERP images after engine changes (`tdk project --yes && tdk up` in the ERP project) so the benchmark measures the current layers. The header line reports what share of images use a single-process `CMD`.

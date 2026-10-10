# Container scale benchmark

Release gate for the north star: **100 ERP services on a 16 GB machine without removing features**.

```bash
bun scripts/benchmark/container-scale.ts                       # tiers 5,10,20,50,80,100, gate on 100
bun scripts/benchmark/container-scale.ts --tiers 5,10 --gate 10
bun scripts/benchmark/container-scale.ts --legacy-healthcheck  # old 10s probes, for comparison
```

It uses the images built in `../tdk-erp-system`, a 100-service fixture bench of generated `/health` services (not an ERP product; override with `--project` or `TDK_BENCH_PROJECT`). For each tier it starts N service containers with the generated runtime settings (`--init`, 512 MiB / 0.5 CPU limits, healthchecks against `/health`). It then records:

- launch time, first-healthy and all-healthy time
- crashes and OOM kills, with each container's exit code and last log line
- total and average memory, CPU
- `docker ps` latency (`tdk doctor` fails above 10 s)
- p50 `/health` latency and host load

Containers are removed after each tier. Results are printed as a table and saved to `benchmarks/results/*.json`.

**Gate:** at the gate tier, every container must be healthy within the timeout with no crashes. Total memory must fit `(Docker VM memory - 512 MiB) / 100` per service, and `docker ps` must answer in under 10 s. The exit code is 1 when the gate fails.

**Git hook (opt-in):** call `scripts/benchmark/pre-release-gate.sh` from `pre-push` or `pre-commit`. It does nothing unless `TDK_BENCH_GATE=1`.

Rebuild the ERP images after engine changes (`tdk project --yes && tdk up` in the ERP project) so the benchmark measures the current layers. The header line reports what share of images use a single-process `CMD`.

## CLI startup and discovery benchmark

The CLI launcher loads cli/dist/cli.js. Build it from the repository root first: use npm.cmd run build --prefix cli in Windows PowerShell, or npm run build --prefix cli elsewhere. The benchmark script itself uses only Node built-ins and requires Node.js 22.12 or newer.

```bash
node scripts/benchmark/cli-startup.mjs
```

For each service count, the script creates a temporary project with that many schema-version-1 `service.json` manifests, performs one warm-up, then measures `tdk version`, `tdk --help`, `tdk resources`, `tdk stacks`, and `tdk status` in fresh Node processes. The default tiers are 10, 100, and 500 services with 10 measured runs per command and tier. It prints median, minimum, and maximum wall time and writes raw samples and runtime metadata to `benchmarks/results/cli-startup-*.json`.

Use `--temp-dir <path>` to keep fixtures and child-process temporary files on a chosen volume. Use `--sizes 10 --runs 1 --warmup 0 --output <path>` for a quick smoke run; normal results should retain the default ten runs and a warm-up. Use `--skip-status` to omit the probe-bound status command for a shorter run; the default still measures status and may take about six minutes when Tilt is unavailable. For example:

```powershell
node scripts/benchmark/cli-startup.mjs --temp-dir G:/tdk-benchmark-temp
```

Timing includes process startup, command work, and captured CLI output; fixture generation and cleanup are excluded. The benchmark starts no containers or Tilt services. The `tdk status` command always runs a read-only Tilt availability probe; if Tilt is unavailable it can wait up to 10 seconds, so the summary table labels this row `tdk status (probe-dominated)` and it is not a discovery-only measurement. Use `--skip-status` for a shorter run.

Service manifests contain only `schemaVersion`, `appName`, `appType`, and `stack`; they measure count-based discovery, not rich validation or generated runtime files. Child processes inherit the host environment except TMP, TEMP, TMPDIR, and NO_COLOR; user TDK config and PATH are not isolated.

In the committed sample, the 100-service `tdk stacks` median is a non-monotonic outlier (0.818 seconds versus 0.487 at 10 services and 0.524 at 500; raw samples range from 0.518 to 0.968 seconds). Treat it as noise, not as a scaling result. The timestamped JSON is one sample; do not commit a new dated result for every run. Replace it only when intentionally publishing a new baseline.

Results are specific to the recorded hardware, operating system, and Node runtime, so compare like-for-like environments. This is a diagnostic baseline, not a CI performance gate.

## `tdk up` warm-start benchmark

Times `tdk up` on a project, one cold run and warm runs, and records per-resource build times, the Docker VM's memory and the container health. It answers "how long does a start take, and what does a warm start save", for any TDK project. The published run is [`benchmarks/results/tdk-up-warm-start-2026-10-11/`](../../benchmarks/results/tdk-up-warm-start-2026-10-11/summary.md) (tdk-restaurant-example).

**Requirements:** `tdk`, `tilt`, `docker` (Compose v2 and buildx), `jq` and Node.js 22.12 or newer on `PATH`. Docker Desktop (or another engine) must be running, and nothing else should be building images on the machine.

**Run it** (from the TDK CLI repository, with the project path):

```bash
scripts/benchmark/tdk-up-warm-start.sh \
  --project ../tdk-restaurant-example \
  --out benchmarks/results/tdk-up-warm-start-$(date +%F) \
  --cold-runs 1 --warm-runs 3 --sample-vm
```

- `--cold-runs 0` skips the cold run. `--warm-runs` sets the number of warm runs (default 3).
- `--port` is the Tilt port of the project (default 10350). `--healthy` is the number of containers that must be healthy before a run counts as settled (default 8: six services, Traefik and Postgres for the restaurant example; set it to your project's count).
- `--sample-vm` samples the Docker VM processes' memory every 3 seconds. The process names are macOS-specific; elsewhere the column reads "not sampled".

**Side effects, read before you run it:**
- A cold run removes the project's built images (`<project>-l*` and `<project_with_underscores>_*`) and runs `docker builder prune -af`. That clears the build cache for every project on the machine, so the next build of anything else is slower too.
- Every run starts with `tdk down` in the project, which stops its containers and Tilt.

**What it writes:** one directory per run (`cold-1/`, `warm-1/`, ...) with `durations.txt` (per-resource build times from `tilt-build-durations.mjs`), `run.txt`, `wall-seconds.txt`, `containers.txt`, `vm-samples.txt` and the `tdk up` log, plus `environment.txt` (tool versions and machine details). It then runs `summarize-tdk-up.mjs`, which writes `summary.md` (the tables), `summary.json` and `span.svg` (a chart).

**How the numbers are defined:**
- *Span* is from the first Tilt build step to the last build finishing. It is the build part of a start and excludes the time before Tilt starts.
- *Wall* is from launching `tdk up` until every Tilt resource is idle and the expected containers are healthy. It includes Tilt's startup and is the number to compare with what a user waits for.
- *Settled* requires a loaded resource list, no resource in progress or pending, and the expected healthy containers. A fixed sleep is not used, so a fast warm start is not reported as 60 seconds.

**Failure handling:** the driver waits for the project to settle and gives up after 30 minutes, and it does not stop early when `tdk up` itself fails. Read `<run>/up.log` if a run shows a wall time near 1800 seconds.

**Comparing results:** results depend on the machine, Docker's memory and CPU allocation, and the image cache. Compare runs on the same machine, with the same project and the same `--healthy`. A published result is one sample; re-run it before you rely on a difference of a few seconds. Do not commit a new dated result for each run. Publish one when you are recording a baseline.

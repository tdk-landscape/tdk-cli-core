#!/bin/sh
# Copyright (c) 2026 TDK Landscape contributors
# SPDX-License-Identifier: MIT
#
# Times `tdk up` on a TDK project: one cold run (built images and build cache removed first) and
# N warm runs. Each run is timed until every Tilt resource is idle and every container is healthy.
# The raw per-resource build durations are kept per run; scripts/benchmark/summarize-tdk-up.mjs
# turns a run directory into the tables and chart in benchmarks/results/.
#
# Usage:
#   scripts/benchmark/tdk-up-warm-start.sh --project <dir> --out <dir> [--cold-runs 1] [--warm-runs 3]
#                                          [--port 10350] [--healthy 8] [--sample-vm]
#
# --cold-runs 0 skips the cold run. --sample-vm records the Docker VM processes' memory every 3 seconds
# (macOS process names; on other systems the samples are empty and the summary says so).
#
# Side effects, read before running: a cold run removes the project's built images (named after the
# project) and runs `docker builder prune -af`, which clears the build cache for every project on the
# machine. Every run starts with `tdk down` in the project, so Tilt and the project's containers stop.

set -eu

project=""
out=""
cold_runs=1
warm_runs=3
port=10350
healthy=8
sample_vm=0

while [ $# -gt 0 ]; do
  case "$1" in
    --project) project="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --cold-runs) cold_runs="$2"; shift 2 ;;
    --warm-runs) warm_runs="$2"; shift 2 ;;
    --port) port="$2"; shift 2 ;;
    --healthy) healthy="$2"; shift 2 ;;
    --sample-vm) sample_vm=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -n "$project" ] || { echo "--project is required" >&2; exit 2; }
[ -n "$out" ] || { echo "--out is required" >&2; exit 2; }
for tool in tdk tilt docker jq node; do
  command -v "$tool" >/dev/null 2>&1 || { echo "$tool is required on PATH" >&2; exit 2; }
done

here="$(cd "$(dirname "$0")" && pwd)"
durations="$here/tilt-build-durations.mjs"
project="$(cd "$project" && pwd)"
slug="$(basename "$project")"
slug_us="$(printf '%s' "$slug" | tr '-' '_')"
mkdir -p "$out"
out="$(cd "$out" && pwd)"

settled() {
  # Settled: at least one resource was loaded, no resource is in progress or pending, and the expected number of containers are healthy.
  busy=$(tilt get uiresources --port "$port" -o json 2>/dev/null | jq '[.items[] | select(.status.updateStatus=="in_progress" or .status.updateStatus=="pending")] | length' 2>/dev/null || echo 1)
  loaded=$(tilt get uiresources --port "$port" -o json 2>/dev/null | jq '.items | length' 2>/dev/null || echo 0)
  # Compose names use hyphens for services and underscores for the infrastructure containers (Traefik, Postgres).
  ok=$(docker ps --format '{{.Names}} {{.Status}}' 2>/dev/null | grep -E -c "($slug|$slug_us).*\(healthy\)" || true)
  [ "${busy:-1}" = "0" ] && [ "${loaded:-0}" -gt 0 ] && [ "${ok:-0}" -ge "$healthy" ]
}

vm_memory_mib() {
  # Docker's VM processes on macOS: the Virtualization XPC service and Docker's own processes, resident memory summed.
  ps -axo rss=,command= | awk '/Virtualization.framework.*XPCServices.*Virtualization|com\.docker\.(backend|build|virtualization)/ && !/awk/ {s+=$1} END {printf "%d", s/1024}'
}

cold_cleanup() {
  docker images --format '{{.Repository}}:{{.Tag}}' \
    | grep -E "^${slug}-l[0-9]|^${slug_us}_" | xargs -r docker rmi -f >/dev/null 2>&1 || true
  docker builder prune -af >/dev/null 2>&1 || true
}

run_once() {
  name="$1"; kind="$2"
  dir="$out/$name"; mkdir -p "$dir"
  (cd "$project" && tdk down > "$dir/down.log" 2>&1) || true
  [ "$kind" = cold ] && cold_cleanup
  : > "$dir/vm-samples.txt"
  start=$(date +%s)
  (cd "$project" && tdk up > "$dir/up.log" 2>&1) &
  waited=0
  while :; do
    if [ "$sample_vm" = 1 ]; then
      echo "$(date +%T) $(vm_memory_mib)" >> "$dir/vm-samples.txt"
    fi
    if [ "$waited" -gt 15 ] && settled; then break; fi
    if [ "$waited" -gt 1800 ]; then echo "$name did not settle within 30 minutes" >&2; break; fi
    sleep 3; waited=$((waited + 3))
  done
  end=$(date +%s)
  echo "$((end - start))" > "$dir/wall-seconds.txt"
  node "$durations" --port "$port" > "$dir/durations.txt" 2>&1 || true
  docker ps --format '{{.Names}} {{.Status}}' | grep -E "($slug|$slug_us)" > "$dir/containers.txt" || true
  printf 'name=%s\nkind=%s\nwall_seconds=%s\nhealthy_expected=%s\nhealthy_seen=%s\nport=%s\ndate=%s\n' \
    "$name" "$kind" "$((end - start))" "$healthy" "$(grep -c '(healthy)' "$dir/containers.txt" || true)" "$port" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$dir/run.txt"
  echo "$name: $((end - start)) s"
}

{
  echo "tdk: $(tdk --version 2>/dev/null || echo unknown)"
  echo "tilt: $(tilt version 2>/dev/null | head -1)"
  echo "docker: $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo unknown)"
  echo "node: $(node -v)"
  echo "os: $(uname -s) $(uname -r) $(uname -m)"
  echo "cpus: $(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo unknown)"
  echo "memory_bytes: $(sysctl -n hw.memsize 2>/dev/null || echo unknown)"
  echo "project: $slug"
  echo "healthy_expected: $healthy"
  echo "sample_vm: $sample_vm"
} > "$out/environment.txt"

i=1
while [ "$i" -le "$cold_runs" ]; do run_once "cold-$i" cold; i=$((i + 1)); done
i=1
while [ "$i" -le "$warm_runs" ]; do run_once "warm-$i" warm; i=$((i + 1)); done
(cd "$project" && tdk down > "$out/final-down.log" 2>&1) || true

node "$here/summarize-tdk-up.mjs" "$out"

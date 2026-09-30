#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -gt 1 ]; then
  echo "usage: bash scripts/wsl2-smoke.sh [WORK_DIRECTORY]" >&2
  exit 2
fi

remove_work_dir=false
if [ "$#" -eq 1 ]; then
  mkdir -p "$1"
  work_dir="$(cd "$1" && pwd)"
else
  work_dir="$(mktemp -d -t tdk-wsl2-smoke.XXXXXX)"
  remove_work_dir=true
fi

project_dir="$work_dir/tdk-example"
tdk_pid=""

cleanup() {
  status=$?
  trap - EXIT
  if [ "$status" -ne 0 ] && [ -f "$project_dir/up.log" ]; then
    echo "WSL2 smoke failed; tdk up output:" >&2
    tail -120 "$project_dir/up.log" >&2 || true
  fi
  if [ -n "$tdk_pid" ]; then
    kill "$tdk_pid" 2>/dev/null || true
  fi
  if [ -d "$project_dir" ]; then
    (cd "$project_dir" && tdk down >/dev/null 2>&1) || true
  fi
  if [ "$remove_work_dir" = true ]; then
    rm -rf "$work_dir"
  fi
  exit "$status"
}
trap cleanup EXIT

tdk project example --path "$project_dir"
cd "$project_dir"
tdk project --yes
# The default example uses PostgreSQL and NATS; keep optional Infisical resources off.
sed -i 's/^INFISICAL_ENABLED=.*/INFISICAL_ENABLED=false/' .env
tdk doctor --strict
tdk config verify

tdk up shop >up.log 2>&1 &
tdk_pid=$!
for _ in $(seq 1 75); do
  if grep -q 'Running tilt up' up.log; then break; fi
  if ! kill -0 "$tdk_pid" 2>/dev/null; then
    cat up.log
    echo "tdk up exited before Tilt started" >&2
    exit 1
  fi
  sleep 2
done
if ! grep -q 'Running tilt up' up.log; then
  tail -120 up.log
  echo "tdk up did not start Tilt within 150 seconds" >&2
  exit 1
fi

api=http://api.tdk-example.localhost/api/orders
app=http://app.tdk-example.localhost/orders-app/
for _ in $(seq 1 90); do
  if curl -fsS "$api/health" >/dev/null && curl -fsS "$api/worker-ready" >/dev/null && curl -fsS "$app" >/dev/null; then break; fi
  sleep 2
done
curl -fsS "$api/health" >/dev/null
curl -fsS "$api/worker-ready" >/dev/null
curl -fsS "$app" >/dev/null

order_id="$(curl -fsS -X POST "$api" -H 'content-type: application/json' \
  -d '{"item":"WSL2 smoke test"}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(String(JSON.parse(s).order.id)))')"
echo "Created order $order_id through Traefik"

observed=false
for _ in $(seq 1 60); do
  result="$(curl -fsS "$api/$order_id")"
  seen="$(printf '%s' "$result" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).order.workerSeenAt ? "yes" : "no"))')"
  if [ "$seen" = yes ]; then observed=true; break; fi
  sleep 1
done
if [ "$observed" != true ]; then
  echo "NATS worker did not observe order $order_id" >&2
  exit 1
fi
echo "NATS worker observed order $order_id"
echo "WSL2 smoke passed; stopping the example"

# TDK on WSL2

TDK supports Ubuntu running in WSL2. Native Windows can inspect the CLI, but `tdk up` requires Linux, Docker, and Tilt; run it from Ubuntu in WSL2.

## Prepare Docker Desktop

1. Install Docker Desktop on Windows and select the WSL2 backend.
2. In Docker Desktop, open **Settings → Resources → WSL Integration** and enable integration for the Ubuntu distribution you will use.
3. Start Ubuntu from Windows Terminal. Confirm Docker is available with `docker version` and `docker compose version`.
4. Install Tilt and TDK in Ubuntu:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
   curl -fsSL https://tdk-landscape.github.io/install.sh | sh
   ```

## Install and boot the bundled example

Run these commands in the Ubuntu shell. The first `tdk project example` copies the bundled example into your home directory; `tdk project --yes` configures that copy.

```sh
tdk doctor
tdk project example --path "$HOME/tdk-example"
cd "$HOME/tdk-example"
tdk project --yes
sed -i 's/^INFISICAL_ENABLED=.*/INFISICAL_ENABLED=false/' .env
tdk config verify
tdk doctor
tdk up shop
```

Leave `tdk up shop` running. From another Ubuntu terminal, check the routed API and UI, create an order, and wait for the NATS worker to mark it:

```sh
set -euo pipefail
api=http://api.tdk-example.localhost/api/orders
curl -fsS "$api/health"
curl -fsS "$api/worker-ready"
curl -fsS http://app.tdk-example.localhost/orders-app/ >/dev/null
order_id="$(curl -fsS -X POST "$api" -H 'content-type: application/json' \
  -d '{"item":"WSL2 smoke test"}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(String(JSON.parse(s).order.id)))')"
echo "Created order $order_id"

seen=no
for _ in $(seq 1 60); do
  result="$(curl -fsS "$api/$order_id")"
  seen="$(printf '%s' "$result" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).order.workerSeenAt ? "yes" : "no"))')"
  [ "$seen" = yes ] && break
  sleep 1
done
[ "$seen" = yes ] || { echo "Worker did not observe order $order_id" >&2; exit 1; }
echo "Worker observed order $order_id"
```

Stop the stack from the first terminal with `Ctrl+C`, then run `tdk down` from the example directory.

## Automated smoke

With TDK and Docker Desktop WSL integration already available, run `bash scripts/wsl2-smoke.sh` from the TDK repository checkout inside Ubuntu. It copies the bundled example into a temporary directory, checks doctor and generated configuration, boots the stack, exercises the same routed write and worker observation, and tears the stack down. Pass a directory path to keep the copied example for inspection.

## Troubleshooting

- If `docker version` cannot reach the server, enable the Ubuntu distribution under Docker Desktop's **Resources → WSL Integration** and restart Ubuntu.
- If `tdk up` reports that port 80 is occupied, identify and stop the process binding it inside WSL (`sudo ss -ltnp 'sport = :80'`). Traefik uses this host port for the local routes.
- Use the API and app URLs printed by TDK if your project name differs from `tdk-example`.

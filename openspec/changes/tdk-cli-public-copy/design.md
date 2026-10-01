# Design: public copy

## Buyer

An engineer or tech lead who already runs several services. The page can include one optional sentence about coding agents, but it is not a second campaign.

## Allowed facts

- One `service.json` per service. `tdk up` starts local APIs, frontends, workers, Postgres, a proxy, hot reload, and health checks.
- The laptop does not need Kubernetes. Production remains with Helm, Argo CD, or Kustomize.
- The CLI is MIT and free. Premium is $19 per developer per month for additional features.
- 14 services healthy in 4.6 seconds on a 16 GB M1 after images exist.
- Fixture only: 100 generated `/health` services, 112 seconds and 1.6 GiB warm on a 16 GB machine, with 0 OOM. Cold CI: 100/100 healthy in 472 seconds.
- Package: `@tdk-landscape/tdk-cli-core`. Website: `https://tdk-landscape.github.io/tdk-website/`.

## Banned in title, H1, About, and first paragraph

Tilt, Starlark, PSR, golden L1–L4, Infisical, Traefik, orchestration, deploy, deployment, docker-compose, “built on Tilt”, “Tilt Development Kit”, and bare “TDK” as the product name.

## Homepage skeleton

- Title: `TDK CLI — start services on your laptop`
- H1: `Start your services on your laptop.`
- Subhead: `Not a deploy. Not a Compose file. One service.json, then tdk up. No Kubernetes on the machine.`
- Proof: `14 services healthy in 4.6s on a 16 GB M1 once images exist.`
- Buttons: Quickstart; “Watch the boot” only if a 15-second recording exists.
- Commands: `tdk project --yes`, `tdk resource orders-api --type backend --stack shop`, `tdk up shop`.
- Keep feature inventory, ROI sliders, Premium, and example-repository list below the first screen.

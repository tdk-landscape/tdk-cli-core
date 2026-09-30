# TDK — Tilt Development Kit

TDK runs many services on your laptop with Docker + Tilt. Helm still deploys the cluster.

## When not to use TDK

- Your `helm install`, Compose, or existing Tilt workflow already gives you a working environment.
- You need to deploy or operate a shared or production Kubernetes cluster.
- You do not want a `service.json` manifest and generated local configuration.

## When TDK helps

- Bringing up several services together is painful.
- You want Docker containers, Tilt hot reload, local health checks, and Traefik `*.localhost` routes without a Kubernetes cluster.

## Quick start

```bash
npm install -g @tdk-landscape/tdk-cli-core
mkdir shop && cd shop
tdk project --yes
tdk resource orders-api --type backend --stack shop --yes
tdk up shop
```

TDK starts the local stack on Docker + Tilt. [How TDK sits next to Helm](docs/with-helm.md) · [Configuration and editor schemas](docs/configuration.md) · [One-backend example](examples/one-backend/README.md) · [Full landscape example](examples/tdk-example/README.md)

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![CI](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml)
[![Quickstart E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Requirements and support

Docker (Desktop, OrbStack, or Colima; Engine 25+, Compose 2.20+), [Tilt](https://docs.tilt.dev/install.html), [Bun](https://bun.sh) for generated services, and Node.js 22.12+ for npm installs. Ports 80, 443, and 5432 must be free. Supported hosts are macOS, Linux, and Windows via WSL2 Ubuntu; native Windows supports CLI inspection only. Run `tdk doctor` to check your local environment. See [WSL2 setup](docs/wsl2.md) and [known limits](docs/compare-honest.md).

[More about the project, its architecture, features, and telemetry](docs/project-overview.md) · [Scale benchmark and cold-boot measurements](docs/scale-bench.md) · [Full documentation](docs/)

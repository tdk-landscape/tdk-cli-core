# TDK — Tilt Development Kit

`tdk up` is not a cluster. It starts Docker containers on your laptop through Tilt.

`service.json` is not `values.yaml`. `service.json` describes local services (ports, stack, health URL). `values.yaml` configures Kubernetes objects (Deployment, Service, Ingress).

TDK does not replace Helm. Helm remains the templating engine for the cluster. TDK only templates the laptop environment. Keep app-template or the chart you already use for production; TDK does not install or take over those charts.

```text
Local:   tdk up shop      → containers on the laptop, *.localhost
Cluster: helm upgrade …   → Deployment/Service in Kubernetes
```

TDK is not a Node.js framework. The default starter uses Bun/TypeScript; TDK's core job is generating and running the local Docker + Tilt setup.

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![CI](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Installation

Install the CLI from npm (requires Node.js 22.12+) or use the prebuilt binary (no Node.js or Bun required):

```bash
npm install -g @tdk-landscape/tdk-cli-core
# or install the prebuilt binary
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

## Quick start

```bash
mkdir shop && cd shop
tdk project --yes
tdk resource orders-api --type backend --stack shop --yes
tdk up shop
tdk networks
```

`tdk up shop --dry-run` previews the selected local services and URLs without starting them. For a one-service walkthrough, use the [one-backend example](examples/one-backend/README.md).

## Why TDK?

| | Docker Compose | Local Kubernetes (kind/minikube) | Plain Tilt | **TDK** |
|---|---|---|---|---|
| Create a service from a manifest | Manual setup | Manual setup | Manual setup | `tdk resource` |
| Hot reload | Configure it | Extra tooling | Yes | Yes |
| Local cluster required | No | Yes | No | **No** |
| Selectively start local services | Profiles | Extra setup | Configure it | `tdk up <stack>` |

TDK generates local Docker and Tilt configuration. If your Compose or Tilt workflow already works, TDK may not add value.

## Docs

- [Documentation index](docs/README.md)
- [TDK + Helm: the local-to-cluster boundary](docs/with-helm.md)
- [Configuration and editor schemas](docs/configuration.md)
- [Runnable one-backend example](examples/one-backend/README.md)
- [Handwritten app-template values](examples/one-backend-helm/README.md)
- [Full multi-service example](examples/tdk-example/README.md)
- [Features and license limits](docs/FEATURES.md)
- [Honest comparison and known limits](docs/compare-honest.md)
- [Architecture and repository map](docs/project-overview.md)
- [Scale fixture measurements and caveats](docs/scale-bench.md)

The 100-service fixture reached healthy status in 112 seconds using 1.6 GiB for service containers on a 16 GB machine. It uses generated health-check services, not a representative business workload; see the [measurement details](docs/scale-bench.md).

## When not to use TDK

- Your existing Helm, Compose, or Tilt workflow already gives you a working local environment.
- You need to deploy or operate a shared or production Kubernetes cluster. Keep your Helm or other deployment workflow.
- You do not want `service.json` manifests and generated local configuration.

## Requirements and support

For the local runtime, install Docker (Desktop, OrbStack, or Colima; Engine 25+, Compose 2.20+) and [Tilt](https://docs.tilt.dev/install.html). Bun 1.2+ is used by the default generated services. Ports 80, 443, and 5432 must be free. TDK supports macOS, Linux, and Windows through WSL2 Ubuntu; native Windows supports CLI inspection only. Run `tdk doctor` to check local readiness. See [WSL2 setup](docs/wsl2.md).

## Contributing and license

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [contributor guide](docs/contributing/README.md). Report security issues using [SECURITY.md](SECURITY.md).

TDK is MIT-licensed; see [LICENSE](LICENSE).

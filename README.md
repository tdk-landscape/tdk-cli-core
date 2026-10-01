# TDK — Tilt Development Kit

TDK runs many services on your laptop with Docker + Tilt. Helm still deploys the cluster.

[Website](https://tdk-landscape.github.io/tdk-website/) · [Quickstart](https://tdk-landscape.github.io/tdk-website/docs/quickstart/) · [Examples](https://tdk-landscape.github.io/tdk-website/docs/examples/) · [Awesome TDK](https://github.com/tdk-landscape/awesome-tdk-framework) · [Demo](https://tdk-landscape.github.io/tdk-demo-animation/) · [Report a bug](https://github.com/tdk-landscape/tdk-cli-core/issues)

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![CI](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml)
[![Quickstart E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml)
[![ERP fixture scale E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/erp-scale-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/erp-scale-e2e.yml)
[![Example apps E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/examples-e2e.yml/badge.svg?branch=main)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/examples-e2e.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/tdk-landscape/tdk-cli-core/badge.svg)](https://snyk.io/test/github/tdk-landscape/tdk-cli-core)
[![Socket Badge](https://badge.socket.dev/npm/package/@tdk-landscape/tdk-cli-core/latest)](https://socket.dev/npm/package/@tdk-landscape/tdk-cli-core/overview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Installation

Install the CLI from npm (requires Node.js 22.12+) or use the prebuilt binary (no Node.js or Bun required):

```bash
npm install -g @tdk-landscape/tdk-cli-core
# or install the prebuilt binary
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

On Windows AMD64, install the inspection CLI from PowerShell:

```powershell
irm https://tdk-landscape.github.io/install.ps1 | iex
tdk --version
tdk runtime --check-assets
tdk doctor
```

The native Windows CLI can report its version and validate its packaged assets. `tdk doctor` explains that running a landscape is supported through WSL2 Ubuntu, not native PowerShell. See [WSL2 setup](docs/wsl2.md) for the full local runtime.

## Quick start

Run this path on macOS, Linux, or Ubuntu in WSL2 with Docker and Tilt installed:

```bash
tdk doctor
tdk project example
cd tdk-example
tdk project --yes
tdk up shop
tdk networks
```

`tdk doctor` checks the machine before setup. `tdk project example` fetches the working example; `tdk project --yes` writes its local configuration. Keep `tdk up shop` running and use the URLs printed by `tdk networks`. TDK runs local containers through Docker + Tilt; it does not provide a Node.js application framework.

![TDK scaffolding a backend and a frontend, then listing the stack](docs/demo.svg)

*Scaffolding a backend and frontend, then listing the stack.*

## Why TDK?

| | Compose | Local Kubernetes (kind, minikube) | Plain Tilt | **TDK** |
|---|---|---|---|---|
| Scaffold a service in one command | ❌ | ❌ | ❌ | ✅ `tdk resource` |
| Hot reload on file change | ⚠️ `compose watch` config | ⚠️ extra tooling | ✅ | ✅ |
| Health-checked startup order | ✅ | ✅ | ⚠️ configure it yourself | ✅ |
| Needs a cluster | No | Yes | Optional | **No** |

100 generated health-check services reached healthy in 112 s, using about 1.6 GiB in service-container memory on a 16 GB machine. [Details and caveats](docs/scale-bench.md).

## When not to use TDK

- Your existing Compose or Tilt workflow already gives you a working local environment.
- You do not want `service.json` manifests and generated local configuration.

## Docs

- [Documentation index](docs/README.md)
- [Working alongside Helm](docs/with-helm.md)
- [Configuration and editor schemas](docs/configuration.md)
- [Runnable one-backend example](examples/one-backend/README.md)
- [Full multi-service example](examples/tdk-example/README.md)
- [Features and license limits](docs/FEATURES.md)
- [Honest comparison and known limits](docs/compare-honest.md)
- [Architecture and repository map](docs/project-overview.md)
- [Scale fixture measurements and caveats](docs/scale-bench.md)

## Requirements and support

For the local runtime, install Docker (Desktop, OrbStack, or Colima; Engine 25+, Compose 2.20+) and [Tilt](https://docs.tilt.dev/install.html). Bun 1.2+ is used by the default generated services. TDK selects host ports from bounded fallback ranges for HTTP, HTTPS, and Postgres; set `TDK_HTTP_PORT`, `TDK_HTTPS_PORT`, or `TDK_POSTGRES_PORT` to override them. TDK supports macOS and Linux, including Ubuntu in WSL2. Native Windows supports CLI inspection only; use WSL2 Ubuntu for `tdk project` and `tdk up`. Run `tdk doctor` to check local readiness. See [WSL2 setup](docs/wsl2.md).

**Ecosystem map:** examples, articles, related tools, and notes live in [awesome-tdk-framework](https://github.com/tdk-landscape/awesome-tdk-framework). Star this repo (`tdk-cli-core`) if the CLI is what you run; use the awesome list to browse the rest.

## Contributing and license

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [contributor guide](docs/contributing/README.md). Report security issues using [SECURITY.md](SECURITY.md).

TDK is MIT-licensed; see [LICENSE](LICENSE).

# TDK CLI — start services on your laptop

TDK CLI starts your services on your laptop. It is not a deploy and not a Compose file: define each service in `service.json`, then run `tdk up`. No Kubernetes is needed on the machine.

Docker runs the containers. Tilt runs the development loop. TDK CLI writes that configuration. Production deployment stays with Helm, Argo CD, or Kustomize.

[Website](https://tdk-landscape.github.io/tdk-website/) · [Quickstart](https://tdk-landscape.github.io/tdk-website/docs/quickstart/) · [Examples](https://tdk-landscape.github.io/tdk-website/docs/examples/) · [Awesome TDK](https://github.com/tdk-landscape/awesome-tdk-framework) · [Demo](https://tdk-landscape.github.io/tdk-demo-animation/) · [Report a bug](https://github.com/tdk-landscape/tdk-cli-core/issues)

## Quick start

```bash
mkdir shop && cd shop
tdk project --yes
tdk resource orders-api --type backend --stack shop --yes
tdk up shop
curl http://api.shop.localhost/api/orders-api/health
```

If Helm, Compose, or your existing Tilt setup already gives you a working local environment, keep using it. TDK CLI is for engineers managing several services who want a clear local service contract and one command to start the stack.

See [how TDK CLI works alongside Helm](https://tdk-landscape.github.io/tdk-website/docs/with-helm/), the [service schema](engine/schemas/service-schema.json), and the [project configuration schema](engine/schemas/project-schema.json).

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

`tdk up shop --dry-run` previews selected local services and URLs before starting containers. The default starter is Bun/TypeScript; TDK's core role is running local containers through Docker + Tilt, not providing a Node.js application framework. See the [one-backend example](examples/one-backend/README.md).

## When not to use TDK

- Your existing Compose or Tilt workflow already gives you a working local environment.
- Helm is your whole development workflow and you do not want local services on Docker.
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

For the local runtime, install Docker (Desktop, OrbStack, or Colima; Engine 25+, Compose 2.20+) and [Tilt](https://docs.tilt.dev/install.html). Bun 1.2+ is used by the default generated services. TDK selects host ports from bounded fallback ranges for HTTP, HTTPS, and Postgres; set `TDK_HTTP_PORT`, `TDK_HTTPS_PORT`, or `TDK_POSTGRES_PORT` to override them. TDK supports macOS, Linux, and Windows through WSL2 Ubuntu; native Windows supports CLI inspection only. Run `tdk doctor` to check local readiness. See [WSL2 setup](docs/wsl2.md).

**Ecosystem map:** examples, articles, related tools, and notes live in [awesome-tdk-framework](https://github.com/tdk-landscape/awesome-tdk-framework). Star this repo (`tdk-cli-core`) if the CLI is what you run; use the awesome list to browse the rest.

## Contributing and license

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [contributor guide](docs/contributing/README.md). Report security issues using [SECURITY.md](SECURITY.md).

TDK is MIT-licensed; see [LICENSE](LICENSE).

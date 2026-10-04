# TDK CLI — start services on your laptop

English | [简体中文](README-zh_cn.md) | [繁體中文](README-zh_tw.md) | [日本語](README-ja.md) | [한국어](README-ko.md)

TDK CLI starts your services on your laptop. It is not a deploy and not a Compose file: define each service in `service.json`, then run `tdk up`. No Kubernetes is needed on the machine.

Stability: 1.x local dev. Generated files are a contract; verify with `tdk config verify`. Core CLI is MIT and needs no key. Premium is optional.

Docker runs the containers. Tilt watches services and live-updates containers while you code. TDK CLI writes the configuration Tilt uses. Production deployment stays with Helm, Argo CD, or Kustomize.

[Website](https://tdk-landscape.github.io/tdk-website/) · [Quickstart](https://tdk-landscape.github.io/tdk-website/docs/quickstart/) · [Examples](https://tdk-landscape.github.io/tdk-website/docs/examples/) · [Awesome TDK](https://github.com/tdk-landscape/awesome-tdk-framework) · [Demo](https://tdk-landscape.github.io/tdk-demo-animation/) · [Report a bug](https://github.com/tdk-landscape/tdk-cli-core/issues)

## Quick start

```bash
mkdir shop && cd shop
npx -y @tdk-landscape/tdk-cli-core project --yes
npx -y @tdk-landscape/tdk-cli-core resource orders-api --type backend --stack shop --yes
# Docker + Tilt step (needs Docker running and Tilt installed; native Windows is inspect-only, use Ubuntu on WSL2)
npx -y @tdk-landscape/tdk-cli-core up shop
curl http://api.shop.localhost/api/orders-api/health
```

Preview without containers (no Docker or Tilt needed):

```bash
npx -y @tdk-landscape/tdk-cli-core --version
npx -y @tdk-landscape/tdk-cli-core up shop --dry-run
```

![TDK scaffolding a backend and a frontend, then listing the stack](docs/assets/demo.svg)

*Scaffolding a backend and frontend, then listing the stack.*

![Top 9 places to use TDK CLI: scaffold a service, start a stack, hot reload, port management, auto-discovery, boot order, proxy routing, include infra, and config verify](docs/assets/tdk-cli-top-9-uses.jpg)

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
# keep it: global install
npm install -g @tdk-landscape/tdk-cli-core
# or the prebuilt binary
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
- [Runnable Python backend example](examples/one-backend-python/README.md)
- [Full multi-service example](examples/tdk-example/README.md)
- [Features and license limits](docs/FEATURES.md)
- [Honest comparison and known limits](docs/compare-honest.md)
- [Public claims registry](docs/claims.md)
- [Show HN draft](docs/drafts/show-hn.md)
- [Architecture and repository map](docs/project-overview.md)
- [Scale fixture measurements and caveats](docs/benchmarks/scale-bench.md)

## History

TDK is older than this repository and its npm package suggest. Development started on 21 April 2026 in
[tdk-landscape/tdk](https://github.com/tdk-landscape/tdk), now archived and kept as read-only history; its first commit is
[`1714637`](https://github.com/tdk-landscape/tdk/commit/1714637637196ed54cbfa18534230a782c05ab36) ("Initial commit: TDK specs,
generators, CLI, and standards"). This repository, `tdk-cli-core`, was created on 19 September 2026 and is where development
continues; the `@tdk-landscape/tdk-cli-core` package on npm was first published on 21 September 2026. So the code lineage is about
five months older than the repository and package dates that you will see on GitHub and npm.

## Requirements and support

For the local runtime, install Docker (Desktop, OrbStack, or Colima; Engine 25+, Compose 2.20+) and [Tilt](https://docs.tilt.dev/install.html). Bun 1.2+ is used by the default generated services. TDK selects host ports from bounded fallback ranges for HTTP, HTTPS, and Postgres; set `TDK_HTTP_PORT`, `TDK_HTTPS_PORT`, or `TDK_POSTGRES_PORT` to override them. TDK supports macOS, Linux, and Windows through WSL2 Ubuntu; native Windows supports CLI inspection only. Run `tdk doctor` to check local readiness. See [WSL2 setup](docs/wsl2.md).

On native Windows, `tdk --version`, `tdk doctor`, and `tdk up --dry-run` are inspect-only commands. `tdk up` exits 2 with “Landscape startup needs Ubuntu on WSL2. Native Windows is inspect-only.”

## License matrix

| Capability | Free | Premium |
| --- | --- | --- |
| `tdk up`, scaffold, Traefik, Postgres, Tilt live update, golden layers | yes | yes |
| Verdaccio, DDD scaffold, Sablier idle stop | no | key |
| Playwright, C4, AGENTS.md | free if generated in-repo | only if the implementation is downloaded with a key |

Core stays free. Premium is a separate key for the extras above; no key required to run `tdk up`.

**Ecosystem map:** examples, articles, related tools, and notes live in [awesome-tdk-framework](https://github.com/tdk-landscape/awesome-tdk-framework). Star this repo (`tdk-cli-core`) if the CLI is what you run; use the awesome list to browse the rest.

## Contributing and license

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [contributor guide](docs/contributing/README.md). Report security issues using [SECURITY.md](SECURITY.md).

TDK is MIT-licensed; see [LICENSE](LICENSE). The [license boundary](GOVERNANCE.md#license-boundary-and-donation-scope) says which code is MIT and which is downloaded with a key.

Project governance: [GOVERNANCE.md](GOVERNANCE.md), [MAINTAINERS.md](MAINTAINERS.md), [ADOPTERS.md](ADOPTERS.md).

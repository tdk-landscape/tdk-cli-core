# TDK for agencies and multi-client teams: honest FAQ

Questions a team lead usually asks before moving client projects onto a new tool. Each answer says what is supported, what is not, and what is not written down yet. Anything marked **Gap** has an open issue; if your question is not here, [ask us](https://github.com/tdk-landscape/tdk-cli-core/issues/new?template=adoption-question.yml).

## Will it run our stacks (Java, .NET, PHP, Node, Python)?

- **Generated for you:** Bun/TypeScript (the default, with Hono, Express, Fastify, NestJS and others), Python, Go and Rust. See [backend language providers](backend-language-providers.md).
- **Anything else (Java, .NET, PHP, Ruby, ...):** use a [bring-your-own resource](byo.md). You give TDK a Dockerfile or an image and a port; TDK adds the Traefik route, health check, ordering and Tilt watching. It does not generate application code or live-update rules for your language, so the reload loop is whatever your Dockerfile does.
- Built-in generators are TypeScript-first. See [known limits](compare-honest.md#known-limits).

## Can we try it without changing the client's repository?

**Gap.** `tdk project` writes `.tdk/project.json`, a root `package.json`, `.tiltignore` and `shared-platform-engineering/docker-templates/`, and adds `.env` and `.tdk/.tdk-out/` to `.gitignore`. In an existing repository, run `git status` and read what changed before you commit ([adoption guide](adopt-tdk.md)). There is no documented mode that keeps all TDK files outside the repository ([#504](https://github.com/tdk-landscape/tdk-cli-core/issues/504)).

## What if the project stops being maintained?

- There are two maintainers from two companies ([MAINTAINERS.md](../MAINTAINERS.md)); the project has no foundation or funding commitment. Governance is in [GOVERNANCE.md](../GOVERNANCE.md).
- Core is MIT, so you can fork it.
- **Gap:** there is no documented "leave TDK" path. Your `service.json` files are TDK-specific, and the generated Compose and Tilt files live under the gitignored `.tdk/.tdk-out/` ([#505](https://github.com/tdk-landscape/tdk-cli-core/issues/505)).

## Licence: can we use it on client projects?

Core is MIT and needs no key. Premium is optional and adds Verdaccio, DDD scaffolding and Sablier idle stop. See the [licence matrix](FEATURES.md#license-matrix) and the [licence boundary](../GOVERNANCE.md#license-boundary-and-donation-scope). Check it against your client contracts yourself; this page is not legal advice.

## Windows laptops

Ubuntu on WSL2 with Docker Desktop is supported ([WSL2 guide](wsl2.md)). Native Windows can inspect the CLI, but `tdk up` needs Linux, Docker and Tilt.

## Corporate proxy, VPN, private registry, custom CA

**Not documented.** We have not tested `tdk up` behind an HTTP proxy, a TLS-intercepting proxy, or against a private npm/Maven/PyPI registry, and the docs do not describe how to pass proxy settings or extra CA certificates into the generated images. Do not assume it works; try it on one service first and tell us what breaks ([#506](https://github.com/tdk-landscape/tdk-cli-core/issues/506)).

## We already have docker-compose files

**Gap.** There is no Compose import. Use a bring-your-own resource per service (Dockerfile or `--image`). [Compare honestly](compare-honest.md): for 2 to 3 services you already wrote, Compose is a better fit than TDK, and you can keep both during a pilot ([#507](https://github.com/tdk-landscape/tdk-cli-core/issues/507)).

## Ports and running two stacks at once

If the default host ports are taken, TDK picks the next free ports from bounded ranges (ingress 8080 to 8081, HTTPS 8443 to 8444, Postgres 15432 to 15433) and prints them in `tdk up` and `tdk networks`. Environment overrides exist, for example `TDK_POSTGRES_PORT`. The ranges are small, and running more than two projects at the same time is **not documented or tested** ([#509](https://github.com/tdk-landscape/tdk-cli-core/issues/509)).

## RAM and CPU on a 16 GB laptop

**Not measured.** The only published numbers are the [claims registry](claims.md) entries (a 14-service warm start and a 100-service CI fixture); neither describes memory use on a developer laptop. Treat sizing as unknown until you measure your own stack ([#508](https://github.com/tdk-landscape/tdk-cli-core/issues/508)).

## Onboarding a new developer, and showing it to the client

The [adoption guide](adopt-tdk.md) is the one-page path: `tdk doctor`, `tdk up --dry-run`, `tdk up`. `tdk doctor` is designed to replace a setup wiki; that is a design goal, not a measured result.

## CI

`tdk config verify` checks that generated project files match `.tdk/project.json` and runs in CI ([`example-e2e.yml`](../.github/workflows/example-e2e.yml)). The [quickstart workflow](../.github/workflows/quickstart-e2e.yml) runs a real `tdk up` on a GitHub-hosted runner, so it works on one. A ready-made reusable CI recipe for your own repository is not published ([#510](https://github.com/tdk-landscape/tdk-cli-core/issues/510)).

## Support and response time

Questions are public issues; we aim to reply within one working day. There is no paid support contract. Premium is a feature key, not an SLA.

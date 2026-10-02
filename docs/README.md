# TDK documentation

## Start here

- [Run one backend locally](../examples/one-backend/README.md)
- [Run one Python backend locally](../examples/one-backend-python/README.md)
- [Full multi-service example](../examples/tdk-example/README.md)
- [Configuration and editor schemas](configuration.md)
- [WSL2 setup](wsl2.md)
- [Install and use TDK alongside Helm](with-helm.md)

## Understand TDK

- [Project overview and repository map](project-overview.md)
- [Features](FEATURES.md)
- [Topology](TOPOLOGY.md)
- [Honest comparison and known limits](compare-honest.md)
- [Claims registry](claims.md): every public number and where it comes from

## Guides

- [Bring-your-own resources](byo.md): wrap an existing service or image, one-shot jobs, `--restart`
- [Frontend framework providers](frontend-framework-providers.md): add a Vite framework (React, Vue, Svelte, Preact, Lit, Solid, Qwik, plain TypeScript)
- [Backend language and framework providers](backend-language-providers.md): Bun with Hono, Express, Elysia, Fastify, NestJS or Koa, and Python, Go or Rust

## Recipes and examples

- [Recipes](recipes/): using TDK next to other tools. [moon](recipes/moon.md), [Rsbuild](recipes/rsbuild.md)
- [Bring-your-own examples](../examples/byo/README.md): one folder per framework, each with its own README and a check command
- [One-shot job examples](../examples/byo-jobs/README.md): database migrations (dbmate, Atlas, Prisma, TypeORM, MikroORM, Drizzle) that run once and exit
- [Worked example: a real shop](examples/shop-real.md)

## Reference

- [Machine-readable CLI](reference/machine-readable-cli.md): JSON shapes, exit codes, an agent polling example
- [Doctor contract](reference/doctor-contract.md): `tdk doctor --json` schema and migration notes

## Benchmarks

- [Scale fixture measurements](benchmarks/scale-bench.md)
- [Cold boot of a real shop](benchmarks/cold-boot-shop-real.md)

## Contributing

- [Contributor guide](contributing/README.md)

## Where things live

| Folder | Holds |
| --- | --- |
| `docs/` (top level) | Long-lived guides that other repos, error messages and published releases link to. Their paths are kept stable on purpose, for example `wsl2.md` is named in CLI messages and `byo.md` in upstream issues. |
| `docs/recipes/` | One file per outside tool |
| `docs/reference/` | Contracts that scripts and agents rely on |
| `docs/benchmarks/` | Measurements and how they were taken |
| `docs/examples/` | Written walkthroughs of the runnable examples in `examples/` |
| `docs/contributing/` | Contributor guides |
| `docs/assets/` | Images used by the READMEs |
| `docs/drafts/` | Unpublished writing |

Before moving or renaming a document, search the whole repository for its path (CLI messages in `cli/src`,
`.github/`, `scripts/`, other READMEs) and keep the old path if a released version or a public issue links to it.

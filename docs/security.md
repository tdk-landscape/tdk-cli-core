# Security: network calls, secrets and supply chain

Answers for a security reviewer. Each line says what was checked in the source at the time of writing; anything not checked is marked **Not audited**. Report a vulnerability through [SECURITY.md](../SECURITY.md).

## What TDK sends over the network

TDK has no telemetry or analytics ([project overview](project-overview.md#telemetry)). Searching `cli/src` for HTTP clients finds these outbound calls, and no others:

| Call | When | Goes to | Sends |
| --- | --- | --- | --- |
| `tdk upgrade` version check and download | Only when you run `tdk upgrade` | `api.github.com` releases, GitHub release assets, and on Windows `registry.npmjs.org` | An ordinary unauthenticated request. The binary and the bundled engine are checked against the release `checksums.txt` before the installed copy is replaced. |
| Premium extension fetch | Only when `TDK_LICENSE_KEY` is set and a premium feature is used | `TDK_PREMIUM_ENDPOINT`, default a Cloudflare Worker (`tdk-extension-dist.oranguman.workers.dev`) | The licence key as a bearer token, the resource name and a random per-project id stored in `.tdk/`. A bundle is cached under `~/.tdk/cache/`. |
| `tdk doctor` service ping, `tdk smoke` | When services are running; `tdk doctor --no-ping` skips the ping | `<project>.localhost` (or `TDK_SERVICE_BASE_URL`) | A GET to each service's health endpoint. |

Without a licence key, and without running `tdk upgrade`, the CLI makes no outbound request of its own. There is no update check on startup.

`tdk up` itself pulls container images and, inside image builds, package-manager dependencies (for example `bun install`). Those requests come from Docker and from your own `package.json`, not from the CLI. See [corporate proxy and private registry](faq-teams.md#corporate-proxy-vpn-private-registry-custom-ca) for what is not tested yet.

## Secrets

- Secret values live in the gitignored project `.env`; `service.json` holds only their names. See [Environment, params and secrets](environment.md).
- Generated files contain no secret values, and `DB_PASSWORD` and `JWT_SECRET` are generated per project, never shared between projects.
- `TDK_SECRET_PROVIDER=infisical` leaves secrets to Infisical and injects nothing from `.env`.
- **Not audited:** whether a secret can appear in Tilt UI output or container logs when an application prints its own environment.

## Images

Images defined by the engine, with the tag in the source:

| Image | Tag | Used for |
| --- | --- | --- |
| `traefik` | `v3.6.8` | Ingress |
| `postgres` | `16-alpine` | Database |
| `oven/bun` | `1.3.11-alpine` | Bun runtime layers |
| `node` | `22-alpine` | Node backend runtime |
| `nginx` | `1.27-alpine` | Static frontend runtime |
| `sablierapp/sablier` | `1.18.0` | Idle stop (premium) |

Tags are version tags, not digests, so a registry could still move them. The golden layer images (`...-l1:latest` and similar) are built locally from these bases and are not pulled. Images for the optional features (monitoring, ELK, Debezium and others) and the generated `FROM` lines for Go, Rust, Python and Java were **not audited** here.

## Releases

- The npm package is published from GitHub Actions with `npm publish --provenance` ([release workflow](../.github/workflows/release-binaries.yml)).
- Release binaries and the engine archive have SHA-256 entries in `checksums.txt`, verified by `install.sh` and `tdk upgrade`. The checksums come from the same release as the binaries, so they detect a bad download but not a compromised release.
- There is no SBOM and the binaries are not signed.
- Core is MIT, so you can build from source.

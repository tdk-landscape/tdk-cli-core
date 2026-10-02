# sveltekit

**Stack:** a real SvelteKit app (`sv create`, minimal template, TypeScript, no add-ons)

**Notes:** scaffolder runs at build time with `--template minimal --types ts --no-add-ons --no-install`; `vite dev
--host 0.0.0.0` with the port from `PORT`. SvelteKit owns its build config (`svelte.config.js`, adapters) and its server
rendering, so this is a bring-your-own resource. TDK's own `svelte` provider is for a client-rendered Svelte SPA.

## Check it

Needs Docker. Builds the image, runs it with `PORT=4000` and expects HTTP 200 on `/`:

```bash
VERIFY_WAIT_SECONDS=60 scripts/verify-byo-example.sh sveltekit /
```

## Register it in a TDK project

```bash
tdk resource sveltekit-web --type bring-your-own --stack shop --dockerfile ./Dockerfile --health-path / --yes
```

Use a resource name that is unique across TDK projects sharing one Docker daemon. See
[../README.md](../README.md) and [docs/byo.md](../../../docs/byo.md) for the container contract.

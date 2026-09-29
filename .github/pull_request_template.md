## What changed?

<!-- Explain the change in plain language. Link the issue with Fixes #123 when applicable. -->

## Which parts of TDK changed?

This template is the same for every PR. Select every area that matches your changed files, then expand the matching instructions below. GitHub adds matching `area:*` labels after the label workflow is available on the base branch.

- [ ] CLI (`cli/src/`)
- [ ] Frontend framework provider (CLI framework files, Vite templates, frontend schema)
- [ ] Database or infrastructure (`engine/topologies/platform/`, infrastructure resources)
- [ ] Engine or service discovery (`engine/`, `discovery/`, `Tiltfile`)
- [ ] GitHub Actions or repository setup (`.github/workflows/`, package files)
- [ ] Contributor or user documentation

Open the matching guide below. If more than one area changed, follow every matching guide.

<details>
<summary>CLI command or generated output</summary>

- Find or add tests under `cli/src/**/__tests__/`.
- Update `cli/README.md` if a command, option, or output changed.
- Run `bun run typecheck`, `bun run lint`, and `bun run test` from the repo root.
- If you checked the compiled CLI, run `bun run build` first.

</details>

<details>
<summary>Frontend framework provider</summary>

- Follow the [frontend provider guide](../docs/frontend-framework-providers.md).
- Keep React as the default and add one Vite-based provider per PR.
- Test generated files, Vite configs, unknown ids, old manifests, and the unchanged React path.
- Keep Docker, nginx, Traefik, and shared API/environment behavior common to providers.
- Run `bun run typecheck`, `bun run lint`, and `cd cli && TDK_REQUIRE_TILT=1 npm test`.
- Update the provider guide and `cli/README.md`.

</details>

<details>
<summary>Database or infrastructure tool</summary>

- Trace the feature setting from validation to generated Compose config and Tilt resource registration.
- Check startup order, health/readiness, environment/secrets, disable behavior, and cleanup.
- Test the enabled and disabled paths and update `docs/FEATURES.md` or the relevant CLI guide.
- Run the CLI checks; use `TDK_REQUIRE_TILT=1` for Starlark generator tests.

</details>

<details>
<summary>Engine or service discovery</summary>

- Check generated output and existing `service.json` manifests for compatibility.
- Update the relevant Starlark or discovery tests and user-facing docs.
- Run the CLI checks; use `cd cli && TDK_REQUIRE_TILT=1 npm test` for Tilt-dependent generator tests.
- Changes under `engine/`, `discovery/`, `cli/`, or `Tiltfile` also trigger Quickstart E2E.

</details>

<details>
<summary>GitHub Actions or repository setup</summary>

- Keep workflow permissions as narrow as the job allows. Do not expose secrets to untrusted pull-request code.
- If you change a workflow, check its event, path filters, permissions, and fork behavior.
- `.github/workflows/**` changes trigger the workflow audit in CI.

</details>

<details>
<summary>Documentation only</summary>

- Check the links and commands you changed.
- Read the page once as someone new to TDK.
- The main CI workflow still runs for docs-only PRs; Quickstart E2E does not.

</details>

## How did you check it?

- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] Other check: <!-- Include the command and result. -->
- [ ] I said which checks I did not run and why.

<!-- Remove or uncheck checks that do not apply. Mark a check only if you ran it successfully. -->

<!-- For behavior changes, show real before/after output and repeatable steps. See the [PR guide](../docs/contributing/03-open-a-pr.md#show-what-changed). -->

## Evidence

<!-- Paste useful output or add screenshots. Remove secrets, private URLs, and personal paths. -->

# Contributing to TDK

Thanks for helping. Bug reports, docs fixes, and code changes are all welcome.

## Ways to help

- **Report a bug or ask a question:** [open an issue](https://github.com/tdk-landscape/tdk-cli-core/issues/new/choose). Include the output of `tdk doctor`.
- **Pick up an issue:** look for [`good first issue`](https://github.com/tdk-landscape/tdk-cli-core/labels/good%20first%20issue) or [`help wanted`](https://github.com/tdk-landscape/tdk-cli-core/labels/help%20wanted). Comment on it so nobody duplicates your work.
- **Share what you built:** an example project or a blog post helps other people find TDK.

## Development setup

You need [Bun](https://bun.sh), Node.js 22.12+, Docker, and [Tilt](https://docs.tilt.dev/install.html).

```bash
git clone https://github.com/tdk-landscape/tdk-cli-core.git
cd tdk-cli-core/cli
bun install
npm run typecheck
npm run lint
npm test
```

From the repo root, `make help` lists more targets (`make test-fast`, `make pre-commit-run`).

## Where things live

- `cli/` is the `tdk` CLI (TypeScript). Conventions are in [cli/AGENTS.md](cli/AGENTS.md).
- `engine/` is the Starlark Tilt framework. Conventions are in [engine/AGENTS.md](engine/AGENTS.md).
- `discovery/` builds the resource and dependency graph from `service.json` files.

To add a Vite-based frontend framework, start with the React provider and follow the [frontend framework provider guide](docs/frontend-framework-providers.md). Submit one framework per pull request.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep the change focused. One fix or feature per PR.
3. Add or update tests for behavior changes.
4. Make sure `npm run typecheck`, `npm run lint`, and `npm test` pass in `cli/`. CI runs the same checks.
5. Describe what changed and why in the PR description, and show that it works (see [Test evidence](#test-evidence)).

## Test evidence

Green CI shows that nothing broke. It does not show that your change fixed the problem. For every bug fix or behavior change, show the reviewer what happened before and after.

- **Capture real output.** Paste the text the command actually printed. Don't paraphrase ("it works now") or rebuild it from memory. Trim to the lines that matter and keep them unedited.
- **Show before and after.** Run the same steps on `main` and on your branch. The "before" run proves you reproduced the bug. The "after" run proves the fix.
- **Say how you ran it.** Give the command, the project or fixture you used, and anything you set up (for example "a folder with `.tdk/project.json` and one broken `service.json`"). Someone else should be able to repeat it.
- **Cover the edges.** Test the empty case, the error case and the recovery path, not only the happy path. If the issue lists steps to check, do each one.
- **Run the built CLI.** The `bin/tdk.js` entry point loads `dist/`, so run `npm run build` first or you are testing old code.
- **Test the TUI in a real terminal.** `tdk ui` needs a TTY. To capture it in a script, use `script -q /dev/null node cli/bin/tdk.js ui`, send keys on stdin, and strip the ANSI escape codes from the output.
- **Say what you didn't cover.** If there is no automated test, write that in the PR and explain why (for example, no render harness yet). Link the issue that would add one. Unexplained gaps look like skipped work.
- **Put it where people look.** Put the evidence in the PR description under "How it was tested". If the PR closes an issue, post it on the issue too. The issue page is where people land later.
- **Keep secrets out.** Remove tokens, license keys, private hostnames and absolute paths from your home directory before you paste output.

**Example:** [the evidence comment on #81](https://github.com/tdk-landscape/tdk-cli-core/issues/81#issuecomment-5873181027) (the `tdk ui` retry fix). It covers every item above:

- how it was tested;
- before-and-after screen captures for an empty project and a broken `service.json`;
- the recovery path after pressing `r`;
- CI results;
- a note that an automated test still needs to be added in #85.

A shortened version:

````markdown
**Before (main):** empty project, press `r`. It shows a Tilt error, then stays on Loading.
```
                                Connection Error
              ✗ No services found. Run "tdk init" to get started.
  Loading: Initializing...        <- after [r]; never leaves this screen
```

**After (this branch):** add a service while the TUI is open, press `r`
```
                               No Services Found
                      Press [r] to refresh or [q] to quit
 ▓▒░ core (1 resources)
```

**Not covered:** no automated test yet (no Ink render harness), tracked in #85.
````

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By taking part you agree to follow it.

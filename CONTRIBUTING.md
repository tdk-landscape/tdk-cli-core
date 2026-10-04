# Contributing to TDK

Welcome! Small fixes and large features are both useful. Start with the short [contributor guide](docs/contributing/README.md); it walks you through finding a change, making it, checking it, and opening a pull request.

## Start here

1. [Choose your change and get the repo ready](docs/contributing/01-first-change.md).
2. [Follow the recipe for your kind of change](docs/contributing/02-feature-recipes.md).
3. [Check your work and open a pull request](docs/contributing/03-open-a-pr.md).

The focused [frontend provider guide](docs/frontend-framework-providers.md) has the exact steps for adding another Vite framework like Vue. The [backend provider guide](docs/backend-language-providers.md) covers adding a backend language like Python.

## Find something to work on

- 🗺️ [The TDK Journey](docs/journey/README.md): pick an island, finish a quest, rank up (8 kyu → 1 dan)
- [Good first issues](https://github.com/tdk-landscape/tdk-cli-core/labels/good%20first%20issue)
- [Help wanted](https://github.com/tdk-landscape/tdk-cli-core/labels/help%20wanted)
- [Report a bug or ask a question](https://github.com/tdk-landscape/tdk-cli-core/issues/new/choose)

If you pick an issue, leave a comment before starting so two people do not do the same work. For a bug report, include the output of `tdk doctor` when you can.

## Labels

Use labels to find work that fits your interests and experience. Maintainers apply
labels during triage; issue forms and the PR labeler also apply some automatically.
The live [label list](https://github.com/tdk-landscape/tdk-cli-core/labels) includes
each label's description.

| Label | Meaning | When it is applied |
| --- | --- | --- |
| `bug` | Something does not work as expected. | Bug report forms and confirmed defects. |
| `enhancement` | A feature or improvement. | Feature request forms and accepted improvements. |
| `documentation` | Missing, incorrect, or unclear documentation. | Documentation forms and docs work. |
| `good first issue` | A small, self-contained task with little repo knowledge needed. | Maintainers identify a suitable first contribution. |
| `help wanted` | A task that needs community help, often larger than a first issue. | Maintainers welcome someone taking it on. |
| `difficulty: easy`, `difficulty: medium`, `difficulty: hard` | A few hours, a day or two, or work requiring deep repo knowledge or design. | Maintainers estimate the task's difficulty; these complement the contributor labels. |
| `question` | A request for clarification. | Maintainers triage a question rather than an implementation task. |
| `duplicate` | Another issue or PR already covers the work. | Maintainers link the original discussion. |
| `invalid`, `wontfix` | An invalid report or work the project will not take on. | Maintainers explain why the issue does not proceed. |
| `premium` | Premium license requests and paid features. | The premium issue form or maintainer triage. |
| `tracking` | An umbrella issue with related tasks. | Maintainers group work that spans multiple issues. |
| `community`, `examples`, `growth` | Community work, sample projects, or adoption improvements. | Maintainers identify outreach and adoption tasks. |
| `dx`, `design`, `guide` | Developer experience, visual or UX polish, or written guides. | Maintainers identify the kind of improvement. |
| `testing`, `ci`, `packaging` | Tests, GitHub Actions, or installers and packages. | Maintainers identify verification and delivery work. |
| `agents` | Documentation and files for AI coding agents. | Maintainers identify agent-facing work. |
| `rfc` | A design discussion before implementation. | Maintainers request agreement on a proposal's scope. |
| `windows` | Windows and WSL2 support. | Maintainers identify platform-specific work. |
| `performance`, `benchmark` | Speed or memory improvements, or measurement tooling. | Maintainers identify optimization and measurement work. |
| `hacktoberfest` | Work participating in Hacktoberfest. | Maintainers select eligible contributions for the event. |
| `area:*` | The affected surface, such as `area: tui`, `area: doctor`, or `area: cli`. | Maintainers label issues; the PR labeler derives areas from changed paths. |
| `tech:*` | A relevant technology, such as TypeScript, Docker, or Tilt. | Maintainers identify the tools involved in a task. |
| `rank:*`, `island:*` | Task size and topic on the TDK Journey. | Maintainers place a quest on the contributor map. |
| `event:*` | Work targeting a named event, such as GitHub Universe. | Maintainers organize event-specific work. |

## Sign your commits

Every commit needs a [Developer Certificate of Origin](DCO) sign-off. Add it with `git commit -s`, which appends `Signed-off-by: Your Name <you@example.com>`. To fix existing commits, run `git rebase --signoff origin/main` and force-push your branch. A pull request check fails when a commit is missing the line.

## Add your team to the adopters list

Run TDK on your own repository? You can be listed in [ADOPTERS.md](ADOPTERS.md) in either of two ways: open the [We use TDK](https://github.com/tdk-landscape/tdk-cli-core/issues/new?template=we-use-tdk.yml) issue form, or add a row to the table in a pull request. [What counts](ADOPTERS.md#what-counts) explains what to link and what does not count.

## Governance

See [GOVERNANCE.md](GOVERNANCE.md) for how decisions are made and maintainers are added, [MAINTAINERS.md](MAINTAINERS.md) for who can merge, and [ADOPTERS.md](ADOPTERS.md) for teams using TDK.

## Be kind

By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Please report security problems privately using [SECURITY.md](SECURITY.md), not in a public issue.

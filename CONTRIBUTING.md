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

## Sign your commits

Every commit needs a [Developer Certificate of Origin](DCO) sign-off. Add it with `git commit -s`, which appends `Signed-off-by: Your Name <you@example.com>`. To fix existing commits, run `git rebase --signoff origin/main` and force-push your branch. A pull request check fails when a commit is missing the line.

## Add your team to the adopters list

Run TDK on your own repository? You can be listed in [ADOPTERS.md](ADOPTERS.md) in either of two ways: open the [We use TDK](https://github.com/tdk-landscape/tdk-cli-core/issues/new?template=we-use-tdk.yml) issue form, or add a row to the table in a pull request. [What counts](ADOPTERS.md#what-counts) explains what to link and what does not count.

## Governance

See [GOVERNANCE.md](GOVERNANCE.md) for how decisions are made and maintainers are added, [MAINTAINERS.md](MAINTAINERS.md) for who can merge, and [ADOPTERS.md](ADOPTERS.md) for teams using TDK.

## Be kind

By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Please report security problems privately using [SECURITY.md](SECURITY.md), not in a public issue.

# TDK category, positioning, and product name

**Status:** Request for comments; evidence gathering in progress · **Date:** 2026-10-09 · **Issue:** [#976](https://github.com/tdk-landscape/tdk-cli-core/issues/976) · **Decision owner:** TDK maintainers

## Decision requested

Agree on the category and audience that TDK should lead with, and decide what evidence is needed before making a naming decision. This RFC recommends a working position and a low-cost naming path for discussion. It does **not** authorize a rename.

## Recommendation

Describe TDK as a **local development stack tool for multi-service applications**. Lead with the job: give each service a small, reviewable `service.json` contract, then start a selected local stack with `tdk up`. Docker runs the containers; generated Tilt configuration watches and updates them. TDK is for the developer inner loop, not cluster deployment.

Keep **TDK** and the `tdk` command during the evidence-gathering period. Use the qualifier **“TDK, local development for multi-service applications”** in the README, website, and package description where space allows. This helps a new reader place the product without paying the compatibility cost of a rename before we know whether the collision has harmed anyone. Revisit this recommendation after the interviews and search checks below. The shared `tdk` command with Tabsdata is real; the scale of user harm is not yet known.

The audience to test first is engineers who own several services in one repository or a coordinated set of repositories and need a repeatable local stack. The high-value job is getting the services needed for one task running and updating without hand-maintaining a large set of local runtime files. Scaffolding, routing, dependency ordering, health checks, and examples are supporting proof for that job; they are not separate product categories.

**Positioning statement to test:** For engineers developing multi-service applications, TDK is a local development stack tool that turns service definitions into a runnable, selectable Docker + Tilt workflow. Unlike a hand-maintained Compose or Tilt setup, TDK supplies a service contract and generates the local runtime configuration. TDK does not replace a team's production deployment system or an existing local workflow that already works.

## Evidence and current product story

The repository's current public story is more specific than “a CLI that starts containers”:

- The README says to define a service in `service.json` and run `tdk up`; TDK generates local runtime files and uses Docker + Tilt. It explicitly says production deployment remains with Helm, Argo CD, or Kustomize.
- The quick start scaffolds a project and a resource, then starts a selected stack. `tdk up --dry-run` previews the selection and URLs.
- The honest comparison says Compose is a good fit for a small existing stack, while TDK adds scaffolding, selective stack starts, and generated Tilt configuration for a larger service set. It also says to keep a working Tilt setup.
- The scope guide says TDK is for local development and test environments and does not generate cluster deployment configuration.
- The top-level npm package is `@tdk-landscape/tdk-cli-core`; its `bin` exposes both `tdk` and `tdk-cli`. Its keywords include `local-development`, `developer-tools`, `docker-compose`, `microservices`, and `kubernetes-alternative`.
- `ADOPTERS.md` explicitly reports no external adopters. The 100-service fixture is a benchmark, not a user team.

There are two messaging tensions to resolve. The README says TDK is “not a Compose file” and users do not need to write a Compose file, while the generated local runtime uses Compose under the hood. The intended distinction appears to be ownership and workflow (TDK owns generation; the user maintains `service.json`), not that Compose is absent. Test whether a new user understands that distinction. Also, the package keyword `kubernetes-alternative` suggests a Kubernetes replacement even though the product docs carefully limit TDK to local development; test whether that keyword helps discovery or misclassifies the product.

This audit covers the current repository README, quick-start links, scope/comparison docs, package metadata, install command, examples, and adopter record. The linked website and community references were not exhaustively audited in this PR. Issue [#489](https://github.com/tdk-landscape/tdk-cli-core/issues/489) separately tracks adopter outreach and warns against invented adopter rows or mass outreach. No user or maintainer interviews were conducted, and no user quotes are included. Repository statements establish intended capabilities, not user outcomes.

## Category landscape

| Alternative | User problem and default workflow | Relationship to TDK |
| --- | --- | --- |
| Docker Compose | Define and run a multi-container application from a Compose file with one command. | Closest starting point for small stacks. TDK adds a service-level contract, scaffolding, selection, and generated local config; teams satisfied with Compose should keep it. |
| Tilt | Build and update services as files change, commonly against a Kubernetes development cluster; Tilt also supports local resources and Compose workflows. | TDK generates the Tilt configuration and keeps the developer-facing contract above it. Tilt is a dependency and alternative for teams that already maintain its workflow. |
| Skaffold, Garden, DevSpace | Build and develop container workloads; Kubernetes is a common path, though individual tools support other targets too (Skaffold documents local Docker and Cloud Run). | Adjacent tools when teams want a build/test/deploy pipeline or cluster-oriented loop. TDK centers on the local service contract and stack selection and does not generate deployment manifests by default. |
| Dev containers and hosted workspaces | Provision a consistent editor, toolchain, or remote development machine. | Adjacent environment setup, not the same job as selecting and coordinating application services. TDK does not provision the full developer workstation. |
| Scaffolding tools | Generate an initial service or project skeleton. | TDK scaffolding supports its service contract, but the continuing local stack workflow is the stronger category. |

The repository's comparison doc groups Skaffold, Garden, and DevSpace as tools that target a cluster. The official Skaffold docs also list local Docker and Cloud Run targets, so that line should not become a broad market claim without checking each tool's current modes. The category recommendation is intentionally narrower than “developer platform,” “microservices framework,” or “Kubernetes alternative.” Those labels suggest capabilities or deployment scope the repository does not claim. “Local development stack tool” is understandable but broad; “for multi-service applications” provides the needed audience and problem context. Interview feedback should test whether users naturally use this language or prefer “local service orchestration” or “multi-service development workflow.”

## Naming collision and preliminary screen

The collision is concrete: Tabsdata's current CLI reference documents a `tdk` executable with commands for managing data workflows, and this repository publishes a `tdk` executable for local application development. Tabsdata's reference describes a different domain and install ecosystem. A shared command can still conflict when both executables land on the same `PATH`; that coexistence scenario has not been tested. Public search can also mix the two products. We have not measured how often either issue occurs or found a report from an actual user.

There is a separate trademark-screening reason to examine `TDK`: TDK Electronics publishes a list of protected or pending product marks across countries. This is not evidence of a conflict with this CLI, but the exact mark and relevant software classes need an official, jurisdiction-specific search before endorsing a name.

The public npm keyword search for `tdk` lists this package and unrelated uses, while the npm package itself is scoped as `@tdk-landscape/tdk-cli-core`. That is evidence of a discoverability problem worth measuring, not proof that users confuse the products. The query was a manual web search on the date below; it is not a reproducible search-volume study. Search-result ordering and AI answers vary by location, account, and time.

### Options

Scores below are preliminary discussion aids, not research measurements. Each dimension is scored 1 (weak) to 5 (strong); the total is unweighted and does not include legal clearance. “Search” means likely to distinguish this product in an ordinary web search, not measured search volume.

| Rank | Candidate | Distinct | Say / spell | Meaning | Category fit | Extend | Language | Search | Migration cost | Total / 40 | Preliminary read |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | **TDK Local** (descriptor; retain TDK identity and command) | 2 | 5 | 4 | 5 | 4 | 3 | 3 | 4 | 30 | Best near-term descriptor. It improves category clarity but does not remove the shared `tdk` command. |
| 2 | **TDK** (keep) | 2 | 5 | 3 | 3 | 4 | 3 | 1 | 5 | 26 | Lowest migration cost and established project lineage; weak search distinction and a shared executable name. |
| 3 | **Loopdock** (independent candidate) | 4 | 4 | 3 | 3 | 4 | 3 | 3 | 1 | 25 | Memorable working idea; does not explain service stacks on its own. `loopdock.com` returned a registered-domain response; no ownership or intended use was verified. |
| 4 | **Service Orchard** (independent candidate) | 3 | 4 | 4 | 3 | 3 | 4 | 2 | 1 | 24 | Suggests a collection of services, but is metaphorical and longer to say. No clearance conclusion. |
| 5 | **Inforio** (candidate raised in #976) | 3 | 3 | 2 | 2 | 4 | 2 | 2 | 1 | 19 | Short, but its meaning is not self-evident and web search surfaced existing Inforio/InfoRio organizations. Do not treat it as endorsed. |

These are a broad idea set, not cleared finalist names. The two independently generated options were screened only lightly: npm's exact package endpoint returned 404 for `loopdock` and `serviceorchard` on 2026-10-09; that says nothing about other registries, common-law use, domains other than the one noted, or trademark rights. Exact-match web searches found active Stackloom software and a historic ServiceWeave software-services trademark record, so those ideas were dropped before scoring. No GitHub organization/repository reservation, social-handle, full domain portfolio, EUIPO, WIPO, or USPTO clearance search has been completed. A 404 or an unoccupied domain is not permission to use a mark.

For a naming round, add candidates only after participants can repeat and explain them after hearing them once. Score distinctiveness, pronunciation/spelling, meaning, category fit, extensibility, language/cultural checks, searchability, and migration cost separately. Then take the strongest two or three to proper registry, domain, handle, and trademark screening, with legal review in the markets where the project expects to operate.

## Paths and transition outline

| Path | Benefit | Risk / requirement | Transition if selected |
| --- | --- | --- | --- |
| Keep TDK | Preserves installed scripts, package, docs, links, and lineage. | Leaves the command and search collision in place. Use clearer descriptors and measure the remaining harm. | Update product copy only after maintainers agree on the category. Keep `tdk` and `tdk-cli`; no package or URL migration. |
| Qualify TDK | Adds category context and can improve search/snippet clarity while preserving identity. | Does not resolve collisions in the `tdk` command, and “TDK Local” still inherits TDK marks and search noise. | First use the descriptor in README, website, npm description, quickstart, and examples; later consider an additional command alias only if user research supports it. |
| Rename | Can create a distinct search and command identity. | High compatibility and discoverability cost: npm package, executable scripts, binaries/installers, repository/org URLs, docs, examples, automation, and references all need a staged migration. A new name may have its own conflicts. | Only after maintainer approval and clearance: publish a compatibility release with both commands, preserve old package/repository redirects where possible, update install and docs, announce a deprecation period, monitor old-command usage/issues, and remove aliases only in a separately approved breaking release. |

No rename, package change, website change, or command change is part of this RFC PR.

## Research needed before a final name decision

### User and maintainer interviews

There are no listed external adopters today. Start with contributors and people who have tried the quick start, then recruit relevant non-users through appropriate community channels. Follow the focused outreach approach in #489; do not mass-message repository authors. Do not describe maintainers or sample repositories as external adopters. Ask each person, without leading them:

1. What do you call the product after using or evaluating it? What did you expect it to do from the current README?
2. What tool or workflow did you compare it with, and what job were you trying to get done?
3. Which terms would you use to find this kind of tool? Does “local development stack tool for multi-service applications” fit?
4. Have you searched for `TDK` or `tdk` and found Tabsdata, or had the two command names conflict? What happened and how often?
5. After hearing each candidate once, can you spell it, say what it does, and find the project again later?

Record date, participant role (with consent), recruitment source, questions, and anonymized findings. Attribute quotes only with explicit consent. Report the sample size and selection bias. Ask maintainers separately about project lineage, compatibility constraints, and what evidence would change their view.

### Search and availability checks

For each finalist, record dated results from web search, GitHub organizations/repositories, npm and relevant language registries, domain RDAP, social handles, EUIPO/WIPO/USPTO trademark search, and the Tabsdata collision. Check likely misspellings and spoken-query ambiguity. Record exact queries, region, and result links; distinguish “no result found” from availability. Search snippets and quick registry checks are discovery only, not legal advice.

## Decision process and next steps

1. Maintainers review the proposed category and this provisional keep/qualify recommendation.
2. Agree on interview recruitment and a minimum useful sample. The empty adopter list means the sample must include evaluators and relevant non-users, not just maintainers.
3. Conduct interviews and the reproducible search screen; update the shortlist and score rationales with evidence.
4. Record a maintainer decision in this RFC. If the decision is to rename, open a separate migration issue with ownership and compatibility stages. If it is to qualify or keep TDK, open a separate messaging issue after the wording has been tested.

**Open questions:** Is “local development stack tool” the language target users use? Does the `tdk` command collision occur often enough to outweigh migration costs? Should the brand and executable be decided together, or can the product name remain TDK while an additional command alias improves coexistence? What minimum evidence will maintainers require before opening a rename implementation issue?

## Sources checked 2026-10-09

- [Repository README](../../README.md), [honest comparison](../compare-honest.md), [scope](../scope.md), [adopter record](../../ADOPTERS.md), [adopter outreach issue #489](https://github.com/tdk-landscape/tdk-cli-core/issues/489), and [package metadata](../../package.json): current product story, interfaces, and explicit evidence limits.
- [Docker Compose overview](https://docs.docker.com/compose/): Compose describes itself as defining and running multi-container applications and provides lifecycle commands.
- [Tilt local vs remote services](https://docs.tilt.dev/local_vs_remote.html) and [Tilt live update reference](https://docs.tilt.dev/live_update_reference.html): Tilt's cluster and live-update workflow.
- [Skaffold documentation](https://skaffold.dev/docs/): describes Kubernetes-oriented continuous development while listing local Docker and Cloud Run targets.
- [Tabsdata CLI reference](https://docs.tabsdata.com/cli/): documents Tabsdata's `tdk` and `tdkserver` commands (reference version displayed as 2.0.2 when checked).
- [Tabsdata repository](https://github.com/tabsdata/tabsdata): describes a table data integration platform, distinct from local application development.
- [TDK Electronics trademarks](https://www.tdk-electronics.tdk.com/en/513784/channel/trademarks/508492): motivates an exact-mark search; it does not establish a conflict for this project.
- [npm package search for `tdk`](https://www.npmjs.com/search?q=keywords%3Atdk) and [this package](https://www.npmjs.com/package/%40tdk-landscape/tdk-cli-core): public package naming and search context.
- [Inforío organization page](https://inforio.com.uy/quienes-somos/), [Stackloom](https://www.stackloom.dev/), and [ServiceWeave trademark record](https://furm.com/trademarks/serviceweave-88144137): examples of preliminary collisions for candidate ideas. These are not legal opinions or exhaustive searches.

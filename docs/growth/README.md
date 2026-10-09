# Category, naming, and adoption work

Research for [#990](https://github.com/tdk-landscape/tdk-cli-core/issues/990),
checked on 9 October 2026 against repository commit
`ce2ceb3681020a38e763754475fe3ae1d45c1bc2` and the sources linked below.
Recommendations on this page are ready for maintainer review. They are not
accepted branding or evidence of adoption.

## Recommended direction

Use **local multi-service development** as the category. Describe TDK as a CLI
that generates local Docker and Tilt configuration from a service contract.
This explains the workflow while preserving the role of the tools that actually
run and update the services.

The primary audience hypothesis is engineers maintaining an application with
several services who want consistent local configuration and selective startup.
It includes teams adopting the tool on an existing repository. It does not assume
that every developer needs a containerized application or a new setup tool.
This audience is inferred from the [README](../../README.md),
[gradual adoption guide](../gradual-adoption.md), and
[bring-your-own guide](../byo.md); it has not been validated with TDK users.

Proposed short description:

> Start your multi-service application locally from a service contract.
> TDK generates the Docker and Tilt configuration, then starts the stack you
> select. Keep your application's deployment workflow with its existing tools.

Proposed descriptor under a future product name:

> Local multi-service development, built on Docker and Tilt.

The next naming step is to test **Loopraft** and **Inforio** after reviewing their
different collision risks. The [name screening](naming.md) explains why neither
is ready to adopt today. A name should identify the product; the descriptor
should explain its category.

## What the research establishes

| Workstream | Result | Still needed |
| --- | --- | --- |
| Category and audience | A category recommendation, audience hypothesis, and product boundaries below | Maintainer agreement and direct TDK comprehension testing |
| Alternatives | A comparison using current primary documentation | A real pilot against a team's existing workflow |
| Public developer input | [Ten distinct public commenters](public-feedback.md), with individual sources | Direct reactions to TDK and the proposed names; no interviews have occurred |
| Naming | [Eight candidates screened](naming.md) with dated namespace observations | Spoken spelling, language review, remaining social namespaces, and clearance |
| Transition | [Source inventory and delivery sequence](migration.md) | Accepted name, assigned owners, and implementation issues |

The ten public comments concern adjacent tools and naming incidents. They do
not establish that ten people use TDK, have confused it with another CLI, or
prefer a proposed name. [ADOPTERS.md](../../ADOPTERS.md) currently lists no
external adopters; forks, commenters, and fixture applications are not substitutes.

## Current story audit

| Surface at the research commit | Finding | Action in this PR or next step |
| --- | --- | --- |
| [README](../../README.md) opening | Advertised zero configuration, three-second startup, and 72 integration tiers without supporting evidence in the claims registry | Replace the opening with the local service-contract workflow; do not use these numbers as proof of value |
| [Governance](../../GOVERNANCE.md) | Describes a local Docker/Tilt project generator rather than an orchestrator | Reflect that boundary in category language |
| [Compose comparison](../compare-honest.md) | Used an unmeasured 2–3-service cutoff for choosing a tool | Compare configuration ownership and acknowledge Compose Watch instead |
| [Package keywords](../../package.json) | Includes `kubernetes-alternative`, while the scope keeps Kubernetes deployment with existing tooling | Review metadata in the accepted positioning rollout; avoid implying replacement of production deployment |
| [Public package commands](../../package.json) | Exports both `tdk` and `tdk-cli` | Include both in the naming and compatibility inventory |

## Choosing the category

| Category language | What it communicates | Recommendation |
| --- | --- | --- |
| Local multi-service development | The intended place, application shape, and development workflow | Use as the main category |
| Local development environment | A familiar broader category, also covering toolchains and editors | Use as a search term and supporting description |
| Development orchestration | Suggests ownership of runtime scheduling and lifecycle | Avoid as the main identity: [governance](../../GOVERNANCE.md) describes a Docker/Tilt project generator |
| Application framework or scaffold | Suggests ownership of application architecture and libraries | Scaffolding is a capability, not the whole product; existing services can be brought in |
| Internal developer platform | Suggests a broader platform with organizational services and operational responsibilities | Too broad for the documented local scope |

There is no evidence yet that the project needs to invent a new market category.
Grow recognition within an understandable category first: explain the service
contract, show a real local workflow, and measure whether teams retain it.

## Alternatives and the adoption question

These are descriptions from primary documentation, not benchmark results or
claims that TDK is superior.

| Approach | Documented capability | Why a team might investigate TDK |
| --- | --- | --- |
| [Docker Compose](https://docs.docker.com/compose/) | Defines and runs applications using services, networks, and volumes. [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/) can sync, rebuild, and restart during development | A service contract that generates the local configuration and follows common conventions; hot reload alone is not a unique differentiator |
| [A maintained Tiltfile](https://docs.tilt.dev/docker_compose.html) | Tilt works with Compose, provides service controls, and supports live updates | Generated Tilt configuration instead of maintaining equivalent wiring by hand; teams with a working Tiltfile may gain little |
| [Development Containers](https://containers.dev/) | A specification for adding development content and settings to containers | Local application service configuration is a distinct job; existing dev containers may remain the developer's toolchain environment |
| [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template) | Supplies a particular application stack and Docker Compose setup | TDK's service contract can organize a local application with several resources; compare integration costs rather than promising a better application framework |

The boundary is [local development](../scope.md). Production configuration,
Kubernetes policies, and deployment remain with the application's existing
workflow. The [public claims registry](../claims.md) governs performance wording;
this research measured no onboarding time, productivity savings, or startup speed.

## Grow adoption with a small, observable pilot

Use [the adoption guide](../adopt-tdk.md) and
[pilot scorecard](../pilot-scorecard.md) as the entry path. Show one existing
service before asking a team to adopt a full application. Show the author-owned
`service.json` beside the [generated outputs](../generated-files.md), and explain
how to leave the tool through [the exit guide](../leaving-tdk.md).

Record the same facts before and after a real pilot: setup steps, first successful
service request, files the team maintains, startup failures, and whether the team
keeps the workflow. Report time only when actually measured. If existing Compose
or Tilt already works well, record that result too.

The public comments support testing three questions: can a new reader identify
the job this tool does, does the service contract improve their existing workflow,
and does the proposed name lead them to the correct project? Those are hypotheses
to validate, not conclusions about TDK users.

## Next decisions

Maintainers should review the category and descriptor, choose which screened
names deserve further testing, and appoint an owner for each phase in the
[delivery plan](migration.md). Acceptance is recorded in the PR or issue under
[the existing governance process](../../GOVERNANCE.md).

Issue #990 remains open until the agreed direction and approved implementation
issues are recorded. This research package supplies the groundwork for those
decisions.

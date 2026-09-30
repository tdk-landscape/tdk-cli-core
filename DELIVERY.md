# Delivery: TDK positioning and Helm handoff

Core worktree: `spec/clarify-tdk-helm-handoff` (`tdk-cli-helm-handoff-wt`).
Website worktree: `docs/helm-handoff` (`tdk-website-helm-handoff-wt`).

## Shipped in the worktrees

Docs, one-backend examples, editor schemas, contributor guidance, issue form scope questions, CLI intro copy, website copy, and GitHub About description.

## Not shipped

`tdk export helm`, automated tests specific to this change, a production website publish, or a merge. Runtime CI (`quickstart-e2e`, `erp-scale`) is not evidence for this documentation and positioning change.

## Verified

- Link review: local Markdown references in `README.md`, `docs/with-helm.md`, `docs/project-overview.md`, `docs/compare-honest.md`, `examples/one-backend/README.md`, and `examples/one-backend-helm/README.md` resolve within the core worktree. Corrected the Helm example's source path to `../one-backend/services/one-backend/api`.
- External chart pages checked on 2026-09-30: [official app-template docs](https://bjw-s-labs.github.io/helm-charts/docs/app-template/) (HTTP 200), [app-template 5.2.1 release notes](https://github.com/bjw-s-labs/helm-charts/releases/tag/app-template-5.2.1) (HTTP 200), [5.2.1 values schema](https://raw.githubusercontent.com/bjw-s-labs/helm-charts/app-template-5.2.1/charts/other/app-template/values.schema.json) (HTTP 200). Chart OCI reference and schema/release versions match at `5.2.1`. Removed the chart examples link after it returned HTTP 404.
- The public `main` guide URL used by website/issue links, `https://github.com/tdk-landscape/tdk-cli-core/blob/main/docs/with-helm.md`, returned HTTP 404 during this pre-merge check. Its target exists in the core worktree; recheck after merge before treating the cross-repository links as live.
- Current worktree CLI help, run with bundled Node 24.19.0: `node cli/bin/tdk.js --help`, `node cli/bin/tdk.js doctor --help`, and `node cli/bin/tdk.js up --help`. The help describes the local service loop, contains no Helm install command as a TDK command, and the top-level output says “Tilt Development Kit: run your microservices locally.”
- Helm sample: `helm pull oci://ghcr.io/bjw-s-labs/helm/app-template --version 5.2.1 --untar --untardir /tmp/tdk-helm-example`; `helm lint /tmp/tdk-helm-example/app-template --values examples/one-backend-helm/values.yaml` passed; `helm template api /tmp/tdk-helm-example/app-template --values examples/one-backend-helm/values.yaml` rendered ServiceAccount, Service, and Deployment. No Ingress or PVC rendered. This checks the sample values and chart only, not TDK.
- Website source inspection confirms the canonical hero sentence, schema-first configuration page, Helm navigation/sidebar links, and the one-row comparison: “Helm / app-template: Render Kubernetes for the cluster”; “TDK: Generate and run the laptop stack”; “Same image optional; different control plane.”
- GitHub About description was set and verified as: “TDK runs many services on your laptop with Docker + Tilt. Helm still deploys the cluster.”
- Scope inspection confirms no runtime schema/service-manifest contract edits and no Helm export implementation.

## Skipped or pending

- Local example smoke and full `tdk up`: `tdk project --yes` stalled without output in both the installed CLI and the current worktree CLI, so it was stopped. No local health request or cleanup result is claimed. Docker/Tilt availability was not established.
- Fresh website build/preview: skipped because the website worktree requires Bundler 2.6.9, which is not installed. HTTP inspection of the stale checked-in `_site` returned 200 for home/configuration/compare but 404 for `/docs/with-helm/`; those stale files were not treated as verification of the changed source.
- Doctor machine-readable output and exit behavior: not checked; help alone does not verify these contracts.
- Timed Helm-user review: the reader spent more than 10 minutes. Their answers, relayed by the user, were: (1) “it runnning a clister like” — misunderstands that `tdk up` runs Docker + Tilt locally; (2) “prod” — ambiguous/incomplete; (3) “same completely same” — incorrectly treats `service.json` and Helm values as equivalent; (4) “no its only tdk for local” — does not clearly confirm whether they can keep app-template for production. The purpose was not understood without coaching; tightened README and Helm guide copy accordingly. Ask the reader the same four questions again before counting this review as passed.
- Expert copy re-read after the edits (self-review, not a replacement for the Helm user's retest): (1) `tdk up` starts the Docker + Tilt local stack on the laptop, not a Kubernetes cluster; (2) TDK does not replace Helm or the production cluster deployment workflow; (3) `service.json` configures local development, while Helm `values.yaml` configures chart resources for Kubernetes, with any shared values carried over deliberately; (4) yes, a team can keep bjw-s app-template for production. This pass found the answers explicit in the README and Helm guide; no timed duration is claimed for the self-review.
- No claim is made that the live website was verified or published.

## Follow-up

Schedule the ten-minute reader review with a named Helm user, complete the website preview with its pinned Bundler, and review both worktrees before merging. Keep runtime CI evidence out of the PR's claims.

Website preview skipped: Bundler 2.6.9 missing; source inspected only.

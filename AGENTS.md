# Contributor guidance

TDK runs a local development inner loop on Docker + Tilt. It does not emit Kubernetes manifests by default and does not replace Helm, Kustomize, Flux, or Argo for cluster deployments.

- Do not add Deployment or other cluster-manifest generators without an explicit export command and agreed scope.
- Every generator change must state whether its output is local-only or part of an explicit export.
- Keep cluster deployment policy (replicas, probes, ingress, storage, security, identity, and autoscaling) with the user's Kubernetes workflow.
- Preserve the distinction between tdk doctor environment/service checks and tdk config verify generated-project-file consistency checks.
- Database migrations run in a `migrator` resource (`appType: migrator`), never from an API's own start-up or entrypoint. New examples, fixtures and e2e checks must model Postgres, then migrator, then API, and prove that order through `tdk up`.
- Read `.claude/memory/MEMORY.md` before opening a PR: it lists verification and CI traps that have already cost reruns. Add a line there when a task teaches you a new one.

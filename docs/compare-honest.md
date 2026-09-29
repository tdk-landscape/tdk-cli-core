# How TDK compares

TDK generates Docker Compose and Tilt configuration from service manifests. It is useful when a
team wants a repeatable local landscape with per-service lifecycle controls. It does not replace
Compose, Tilt, Kubernetes, or production operations.

## TDK and Docker Compose

Compose is a strong choice for a small, stable set of containers and gives direct control over the
resulting YAML. TDK adds resource scaffolding, generated Compose configuration, and stack-level
startup through Tilt. That convenience adds a generator and its conventions: when a generated
configuration behaves unexpectedly, users may need to inspect both `service.json` and the emitted
Compose files. Teams that already maintain Compose comfortably may not benefit from TDK.

## TDK and Tilt

Tilt provides the development loop and UI. TDK builds a landscape around it by generating the
Tiltfile and service configuration. Using Tilt directly gives a team more control and fewer TDK
conventions, at the cost of maintaining that configuration itself. TDK is not a replacement for
learning Tilt when a project needs custom build or orchestration behavior.

## TDK and Kubernetes tools

Skaffold, Garden, and DevSpace target Kubernetes workflows. TDK targets local Docker containers
without requiring a cluster. It is not a Kubernetes deployment tool and does not validate
production cluster behavior, manifests, or resource limits.

## When TDK may not fit

- A handful of containers with a stable Compose file may be simpler to maintain directly.
- A service that requires Kubernetes APIs, production parity, or cluster-specific behavior needs a
  Kubernetes-based development workflow.
- Generated defaults can be wrong for unusual health checks, ports, build contexts, or networking;
  inspect and adjust the generated files when the defaults do not match the service.
- Large landscapes still consume machine resources. Stack filtering helps control startup, but it
  does not make builds or containers free.
- Cold startup depends on Docker image and package downloads, disk speed, and available memory.
  TDK cannot make a cold machine boot as fast as a warm cache.

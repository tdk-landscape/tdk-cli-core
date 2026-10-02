# TDK and your existing tools

TDK CLI turns a `service.json` per service into a local Docker stack, with Tilt (the local development tool) watching services and live-updating containers as you code. It is not a deploy tool and not a Compose replacement. Production stays on Helm.

## Compose

Compose is better for 2–3 services you already wrote. TDK is useful when you want scaffolding, selective `tdk up <stack>`, and a generated Tiltfile for a larger service set.

## Tilt

TDK writes the Tiltfile that configures Tilt's service watcher and live-update loop. If you already maintain a Tiltfile and it serves your workflow, stay on Tilt.

## Skaffold, Garden, and DevSpace

Those tools target a cluster. TDK does not; it runs a local Docker + Tilt development loop. Production deployment remains in your Helm or Kubernetes workflow.

## Known limits

- The community is small.
- Built-in generators are TypeScript-first; bring your own Go, Java, or Python services.
- The 100-service number is a fixture bench of generated `/health` stubs, not an application workload. See [the claims registry](claims.md) and [bench notes](benchmarks/scale-bench.md).
- Native Windows is inspect-only; startup needs Ubuntu on WSL2.

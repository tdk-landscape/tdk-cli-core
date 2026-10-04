# Agent hosts: Dev Containers, Codespaces, WebContainers

`tdk doctor` reports where it is running (`data.host.kind` in `--json`): `local`, `wsl2`, `devcontainer`, `codespaces`, `webcontainer`, or `native-windows`. `data.host.canUp` is false when `tdk up` cannot work, either because the host can never run it or because Docker is not reachable.

## Dev Containers and Codespaces

Services run as sibling containers on the host's Docker engine; the Dev Container is only where the agent and `tdk` live.

- Supported: Docker-outside-of-Docker. Mount the host socket (`-v /var/run/docker.sock:/var/run/docker.sock`) or add the `docker-outside-of-docker` Dev Container feature.
- Not supported: Docker-in-Docker (Tilt bind mounts and the layer cache break).
- A mounted Docker socket gives the container root-equivalent access to the host. Only do this in workspaces you trust.

If Docker is unreachable, `tdk up` exits non-zero without starting Tilt and `tdk doctor` prints this remediation.

## WebContainers

Not supported for `tdk up`. A WebContainer has no Docker daemon, Compose, or Tilt. `tdk doctor --json` reports `canUp: false` and `tdk up` exits non-zero without spawning Tilt. Run TDK on a machine with Docker and call it from the agent.

## JSON output for agents

- `tdk doctor --json` and `tdk status --json` print a versioned report.
- `tdk up --json` prints one object on stdout once the stack is ready (or when the command fails), and keeps running Tilt; background it. Human output is suppressed.
- `tdk down --json` prints one object when done.

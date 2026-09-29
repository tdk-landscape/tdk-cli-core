# WSL2

TDK supports Ubuntu on WSL2. Native Windows is not supported.

## Install

1. Install TDK from your Ubuntu shell:

```bash
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

2. Install Docker Desktop for Windows, enable the WSL 2 based engine, and enable integration for your Ubuntu distribution. Install Node.js, Bun, and Tilt in Ubuntu. Verify Docker with `docker version` and `docker compose version`.

3. Create and start the example project:

```bash
tdk project example
cd tdk-example
tdk up
```

## Common failures

- IIS may occupy ports 80 or 443, which TDK uses for Traefik. Stop IIS or change its bindings, then run `tdk doctor`.
- Keep projects in the WSL Linux filesystem (for example, `~/src`) to avoid slow file watching and permission issues on mounted Windows drives.

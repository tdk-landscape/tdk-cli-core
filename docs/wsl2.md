# WSL2

Run TDK from an Ubuntu distribution under WSL2. TDK runs as Linux there; native PowerShell and Command Prompt landscape startup are unsupported.

## Install

From your Ubuntu shell, install TDK with the repository installer:

```bash
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

Install Docker Desktop for Windows, enable the WSL 2 based engine, and enable integration for your Ubuntu distribution. Install Node.js, Bun, and Tilt in Ubuntu. Verify that Docker is available from that shell with `docker version` and `docker compose version`.

Clone projects into the WSL Linux filesystem (such as `~/src`) for reliable file watching. Run `tdk doctor`, then `tdk project --yes` or `tdk up`.

## IIS

IIS may listen on ports 80 or 443, which TDK uses for Traefik. Stop IIS or change its bindings if either port is already in use, then run `tdk doctor` again.

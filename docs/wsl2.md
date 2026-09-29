# WSL2

Use Ubuntu on WSL2 with Docker Desktop's WSL integration to run TDK on Windows. Native PowerShell and Command Prompt landscape startup are unsupported.

## Install

From Ubuntu, install TDK with:

```bash
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

Install Docker Desktop for Windows, enable the WSL 2 based engine, and enable integration for your Ubuntu distribution. Install Node.js, Bun, and Tilt inside Ubuntu, then verify `docker version` and `docker compose version` there.

Clone projects into the WSL Linux filesystem (such as `~/src`) for reliable file watching. Run `tdk doctor`, then `tdk project --yes` or `tdk up`.

## IIS

IIS may reserve ports 80 and 443, which TDK uses for Traefik. Stop IIS or change its bindings before starting a TDK landscape if those ports are occupied.

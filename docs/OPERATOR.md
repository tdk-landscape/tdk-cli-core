# TDK Operator Runbook

This page documents how to install, operate, and release TDK CLI.

## Installation

TDK CLI runs local multi-service development environments on Docker + Tilt.

### Supported Platforms

| Platform | Support | Note |
|----------|---------|------|
| macOS (Intel, M-series) | ✅ Full | TDK up and all features |
| Linux (Ubuntu, Debian) | ✅ Full | TDK up and all features |
| Windows + WSL2 Ubuntu | ✅ Full | TDK up via WSL2 Ubuntu |
| Native Windows | ⚠️ Inspect-only | Read-only access; no `tdk up` |

### Requirements

TDK requires:

- **Docker Engine** (version pinned by `tdk doctor`)
- **Tilt** (version pinned by `tdk doctor`)
- **Bun** (runtime; version documented in project)
- **Git** (when project requires it for dependency discovery)

Check your environment:

```bash
tdk doctor
```

If any requirement is missing or incompatible, `tdk doctor` lists the specific version and how to install it.

## Pinned Versions

TDK pins minimum versions to ensure compatibility across team members.

Run `tdk doctor` to see which versions are required for this TDK release:

```bash
tdk doctor --json | jq '.checks'
```

The JSON output includes:

- `docker.status`, `docker.version`: Docker Engine availability and version
- `tilt.status`, `tilt.version`: Tilt availability and version
- `bun.status`: Bun runtime availability

## License Key

### Running Without a License Key

TDK CLI runs fully on free stacks without a license key:

- `TDK_LICENSE_KEY` is **optional**
- `tdk up`, `tdk doctor`, and base commands work without a key
- Expired or invalid keys do not block startup

### Premium Commands and Missing Keys

Commands that require a license key print:

```
This feature requires a TDK Premium license key.

Set TDK_LICENSE_KEY in your environment or .env file.

Learn more: https://tdk-landscape.io/premium
```

Stacks without premium features proceed normally.

## Releases

### Publishing a Release

Each TDK release follows this process:

1. **Version Bump**: Update `cli/package.json` and root `package.json`
2. **Tag**: Create a git tag matching the version (e.g., `v1.3.86`)
3. **Build**: CI builds binaries for macOS, Linux, and Windows
4. **Checksums**: Generate `checksums.txt` listing SHA256 hashes of all binaries
5. **Publish**: Upload binaries to GitHub Releases alongside `checksums.txt`
6. **Install Script**: Update `https://tdk-landscape.github.io/install.sh` to reference the new version

### Installer Script

The curl-installable binary is served from:

```
https://tdk-landscape.github.io/install.sh
```

This script:

- Detects the OS (macOS, Linux, WSL2)
- Downloads the appropriate binary from GitHub Releases
- Verifies the SHA256 hash against `checksums.txt`
- Installs to `/usr/local/bin/tdk` (or equivalent)

### Binary Locations

Released binaries are stored in the `tdk-landscape/tdk-landscape.github.io` repository (separate from this repo) and served via GitHub Pages.

## Troubleshooting

### Common Issues

| Issue | Resolution |
|-------|-----------|
| Docker daemon not running | Start Docker Desktop, OrbStack, or Colima; re-run `tdk doctor` |
| Tilt version mismatch | Run `tilt version` and compare against `tdk doctor` output; upgrade Tilt if needed |
| Port already in use | `tdk up` auto-selects the next available port; use `TDK_HTTP_PORT` to force a specific port |
| Generated files out of date | Run `tdk config regenerate` to update; use `tdk up --ignore-drift` to proceed with warnings |

For detailed diagnostics, run:

```bash
tdk doctor --json
```

This outputs a machine-readable report of all checks.

## Native Windows Behavior

Native Windows (non-WSL2) can inspect existing TDK projects but cannot run `tdk up`.

- Read-only access to configuration and generated files
- Useful for reviewing project setup
- Use WSL2 Ubuntu for actual local development

To enable experimental native Windows support (if available), set:

```
TDK_ALLOW_NATIVE_WINDOWS=1 tdk up
```

**Unsupported and not recommended for production workflows.**

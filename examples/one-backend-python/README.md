# One Python backend on your laptop

This example is one authored `service.json` and one small FastAPI service on Python 3.12. TDK creates the local orchestration files; Docker builds the service and Tilt runs it with live reload. No Kubernetes cluster is needed, and you do not need Bun, Node.js, or Python installed on your machine for the service itself.

It is the Python counterpart of the [one-backend example](../one-backend/README.md). The source in `services/one-backend-python/api` is exactly what this command generates:

```bash
tdk resource api-backend --type backend --language python --stack one-backend-python
```

## Prerequisites

Install Docker (Desktop, OrbStack, or Colima), Tilt 0.25.0 or newer, and the TDK CLI. Ports 80, 443, and 5432 must be available.

From the repository root:

```bash
cd examples/one-backend-python
tdk project --yes
tdk up one-backend-python
```

The service is routed at `http://api.one-backend-python.localhost/api/api-backend`. If port 80 is busy, TDK picks another host port; `tdk doctor --json` reports it. Check it with:

```bash
curl --fail http://api.one-backend-python.localhost/api/api-backend/health
# {"status":"ok","service":"api-backend"}
```

Open the Tilt dashboard at `http://localhost:10350`. Stop the local stack with `tdk down`.

## Live reload

Edit `services/one-backend-python/api/src/main.py`. Tilt syncs the file into the container and uvicorn reloads without rebuilding the image. Changing `pyproject.toml` is not synced, so Tilt rebuilds the image to install the new dependencies.

## Run the tests

The image has a `test` stage that runs pytest, so no local Python is needed:

```bash
docker build --target test -f services/one-backend-python/api/Dockerfile services/one-backend-python/api
```

## More

See the [backend provider guide](../../docs/backend-language-providers.md). For a language without a provider, use `--type bring-your-own`.

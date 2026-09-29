# Bring-Your-Own Resources

Wrap an existing service with TDK orchestration without generating application code.

## Command

```bash
tdk resource <name> --type bring-your-own --stack <stack>
```

Aliases: `byo`, `bring-your-own`

## service.json Example

```json
{
  "appName": "legacy",
  "appType": "bring-your-own",
  "stack": "shop",
  "port": 4500,
  "healthCheckPath": "/health",
  "dockerfile": "./Dockerfile"
}
```

## Notes

- TDK does not generate application code for this type
- Provide your own Dockerfile or use `--image <name>` to use an existing image
- Default port range: 4000-5999 (next free port)
- If Dockerfile exists, it will not be overwritten
- BYO resources receive the standard Traefik route by default. Use `--no-proxy` to disable it;
  this writes `exposeViaProxy: false` to the service manifest
- Use `--yes` in scripts to skip the create confirmation
- `--port` accepts an unused integer from 4000 through 5999
- By default, TDK writes an Nginx Dockerfile and health endpoint that listen on the assigned
  service port
- Pass `--dockerfile <path>` to select a custom Dockerfile, or `--image <image>` to use an
  existing image without creating a Dockerfile

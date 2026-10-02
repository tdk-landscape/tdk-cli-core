# Smoke check

`tdk up` can check your service through the URL it prints, not only inside the container. The drawing runs the same path twice: the route works (201, then 200, "Smoke check passed"), then the read-back returns 404 ("Smoke check failed", `tdk up` exits 1).

<p align="center">
  <img src="assets/smoke.svg" alt="Animated: service.json smoke block, tdk up, Traefik on the printed URL, POST /records returns 201 and saves $.id, GET /records/{{id}} returns 200 and Smoke check passed; then the same path with GET returning 404, Smoke check failed, tdk up exits 1" width="600">
</p>

GitHub's blob view often shows this drawing without the animation. [Open the raw SVG](assets/smoke.svg) to watch it loop (about 16 seconds: 8 for the pass, 8 for the fail).

```json
{
  "smoke": {
    "via": "proxy",
    "timeoutSeconds": 60,
    "steps": [
      { "name": "create", "method": "POST", "path": "/records", "body": { "name": "smoke" }, "expect": 201, "save": { "id": "$.id" } },
      { "name": "read back", "path": "/records/{{id}}", "expect": 200, "bodyContains": "smoke" }
    ]
  }
}
```

The check hits the public URL that `tdk up` prints, not the container's `/health`.

Every field, the retry rules and what is not covered are in [Configuration: `smoke`](configuration.md#smoke-check-the-public-url-after-tdk-up). `scripts/verify-smoke.sh` runs both outcomes through a real `tdk up`.

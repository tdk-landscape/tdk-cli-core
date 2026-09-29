## 1. BYO port persistence

- [ ] 1.1 Read the resource command help and existing BYO tests; identify how `--port` is parsed, validated, printed, and serialized.
- [ ] 1.2 Add or update a focused test proving `--port 4500` prints `Port: 4500` and writes `.port == 4500` to `service.json`.
- [ ] 1.3 Fix the BYO creation path with the smallest change while preserving the 4000–5999 range and existing error strings.
- [ ] 1.4 Retain or add tests for invalid and out-of-range BYO ports.
- [ ] 1.5 Verify the focused BYO command tests and `tdk doctor`; confirm existing examples still pass `tdk up --dry-run` as required by the project acceptance constraints.

# Fuzz tests

Property-based tests ([fast-check](https://fast-check.dev)) for code that reads untrusted `service.json` input.

```bash
cd tests/fuzz
bun install
bun run fuzz
```

`service-manifest.fuzz.test.ts` checks that the line-break / control-character guard in `cli/src/utils/service-manifest.ts`
(GHSA-phgf-pww4-7jxc) never throws, rejects every such character in any value or key outside `smoke`, and never echoes the
hostile value back. This folder has its own `package.json`, so adding the fuzz dependencies does not touch the published
package or trigger a release.

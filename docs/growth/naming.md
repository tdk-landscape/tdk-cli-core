# Name screening and recommendation

Research date: 9 October 2026. Related work:
[#990](https://github.com/tdk-landscape/tdk-cli-core/issues/990).
This is a screening result and a recommendation for further testing, not a final
name selection. Maintainers have not accepted a new name.

## The existing TDK name

| Public use | Evidence | Relevance |
| --- | --- | --- |
| Tabsdata CLI | [Official version 2.0.2 documentation](https://docs.tabsdata.com/2.0.2/cli/tdk/) calls its command-line client `tdk` | Same command spelling |
| TDK Dictionary CLI | [agmmnn/tdk-cli README](https://github.com/agmmnn/tdk-cli/blob/master/README.MD) and [PyPI](https://pypi.org/project/tdk-cli/) show package `tdk-cli` and command `tdk` | Same command and the same unqualified CLI name |
| Synthesized toolkit CLI | [Official CLI reference](https://docs.synthesized.io/tdk/latest/user_guide/040_reference/api_reference/command_line_interface) documents `tdk --help` | Same command spelling in another software category |
| This project | [Public package manifest](../../package.json) exports `tdk` and `tdk-cli` | Both visible executable names overlap with other public names |

These are name overlaps between separate products. They do not establish legal
ownership, actual confusion among TDK users, or shared product categories.

A practical risk is executable resolution: a shell can find a different `tdk`
earlier on its search path, and global installation locations may conflict.
Whether that happens depends on the installation method and environment; it was
not reproduced here. Changing only the marketing name would leave that risk in
the command itself. [The migration plan](migration.md) therefore treats the
canonical command separately from an optional compatibility alias.

## Checks performed

[The dated JSON snapshot](name-checks-2026-10-09.json) records each requested URL,
UTC check time, response status, and the relevant returned identifier. It covers
eight candidates, with seven checks per candidate:

- Unscoped npm metadata for the bare name and the `-cli` variant.
- PyPI metadata for the bare name.
- GitHub repository search for `<candidate> in:name`, and the exact account URL.
- `.com` and `.dev` domain records through the RDAP service listed in
  [IANA's bootstrap](https://data.iana.org/rdap/dns.json).

An HTTP 200 means a record was returned. HTTP 404 means that endpoint returned no
record for that exact identifier at that time. It does not reserve a namespace,
guarantee registration, or clear a name. Other errors would be inconclusive.
GitHub repository counts include longer matching names, not only exact matches.
They are search observations, not a count of competing products.

| Candidate | npm bare / `-cli` | PyPI bare | GitHub name-query matches | Exact GitHub account | `.com` RDAP | `.dev` RDAP |
| --- | --- | --- | --- | --- | --- | --- |
| Inforio | 404 / 404 | 404 | 15 | 200 | 200 | 404 |
| Loopraft | 404 / 404 | 404 | 0 | 404 | 404 | 404 |
| Devorio | 404 / 404 | 404 | 7 | 200 | 200 | 404 |
| Devweave | 404 / 404 | 404 | 38 | 200 | 200 | 404 |
| Tiltkit | 404 / 404 | 404 | 1 | 404 | 404 | 404 |
| Stackloom | 404 / 200 | 404 | 9 | 200 | 200 | 200 |
| Stackora | 404 / 404 | 404 | 29 | 200 | 200 | 200 |
| Stackpilot | 200 / 404 | 200 | 155 | 200 | 200 | 200 |

## Inforio specifically

Inforio was explicitly requested for investigation. It has a practical lowercase
ASCII command spelling, but its meaning does not directly communicate local
multi-service development. That is an editorial assessment to test with readers.

There is an existing [Inforío news organization in Uruguay](https://inforio.com.uy/quienes-somos/).
Accent removal and capitalization make its name close to `inforio`; this creates
a discoverability consideration even though it operates in another category.
The exact GitHub account returned a record, and `inforio.com` has a domain record.
The account and domain records do not establish who owns the news organization
or whether those namespaces could ever be acquired.

The npm and PyPI checks returned no record for the queried names. That does not
make Inforio an unused brand. Keep it in the comparison because it is the
requested candidate, while testing search results, spoken spelling, and the
association with information/news before investing in it.

## Ranked screening shortlist

The order below is the researcher's judgment, using category fit, typing and
spelling, observed collision risk, and room for the product to evolve. It is not
a user preference score or a trademark assessment.

| Rank | Candidate | Rationale | Disposition |
| --- | --- | --- | --- |
| 1 | Loopraft | Suggests a development loop and making things; the checked endpoints returned no matching records | Advance to comprehension and spoken-spelling testing. The spelling may be mistaken for “Loopcraft”; test that explicitly |
| 2 | Inforio | Requested candidate; broad enough for a product family, but weak immediate category meaning and an existing news brand | Compare with Loopraft only after reviewing the known brand and namespace risks |
| 3 | Devorio | The `dev` prefix suggests developers; domain/account records exist, and the repository query includes longer names | Hold for deeper collision checks; do not infer a clean brand from missing npm metadata |
| 4 | Tiltkit | Accurately signals the dependency, but may imply Tilt affiliation and constrain future identity; [TiltKit](https://github.com/chaert-s/TiltKit) is already a SwiftUI package | Consider as a technical descriptor, not the preferred independent product name |
| 5 | Devweave | Suggests connecting development components; multiple [same-name repositories](https://github.com/sahuhasrh/devweave) and account/domain records exist | Deprioritize given the aim of reducing software-name overlap |
| 6 | Stackora | Suggests a stack, but is already used by [a software workspace project](https://github.com/gnmsss/Stackora) and matching developer projects | Deprioritize; another crowded software identity would weaken the rationale for renaming |
| 7 | Stackloom | A useful composition metaphor, but `stackloom-cli` exists on npm and [Stackloom](https://github.com/ooiai/stackloom) is already a software project | Exclude from the leading shortlist |
| 8 | Stackpilot | Clear stack-management association, but the bare name exists in both npm and PyPI and many repository names match | Exclude from the leading shortlist |

Recommendation: test Loopraft first, with Inforio retained as the requested
comparison. Use the descriptor **local multi-service development, built on Docker
and Tilt** with each candidate so the test measures the identity and category
together. Do not shorten either command back to `tdk`; that would retain the
known overlap.

## Remaining checks before adoption

Scoped npm ownership, other domains and social platforms, language/cultural
review, trademark research, and spoken spelling were not checked. A registry
404 cannot stand in for any of them. Search data should be refreshed immediately
before reservation or release.

Direct TDK user comprehension and preference remain unknown. The
[ten public voices](public-feedback.md) offer useful naming lessons, but none
evaluated these candidates. Review the results with maintainers, complete the
remaining checks for the leading names, and record the accepted identity before
starting the [migration sequence](migration.md).

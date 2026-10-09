# Naming research and next steps

Research date: 9 October 2026. Related work:
[#990](https://github.com/tdk-landscape/tdk-cli-core/issues/990).
This is a screening result and a record of rejected directions, not a final
name selection. Maintainers have not accepted a new name. Following further
category research, the earlier recommendation to advance Loopraft and compare
Inforio is withdrawn; neither name has user validation.

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

This first-pass screen was checked on 9 October 2026. The table summarizes eight
candidates across package registries, GitHub, and `.com` / `.dev` domain records:

- Unscoped npm metadata for the bare name and the `-cli` variant.
- PyPI metadata for the bare name.
- GitHub repository search for `<candidate> in:name`, and the exact account URL.
- `.com` and `.dev` domain records through the RDAP service listed in
  [IANA's bootstrap](https://data.iana.org/rdap/dns.json).

The package columns show whether those exact names returned a registry record;
GitHub counts are substring search results and can include longer names. Domain
records indicate registrations. These are quick collision checks, not namespace
reservations, trademark clearance, or a measure of product confusion.

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
make Inforio an unused brand. It remains in the record only because it was
requested for investigation; the evidence does not support advancing it.

## First-pass names: do not advance

The first pass mixed generic developer terms with invented `-io` and `-kit`
blends. The ranking was the researcher's judgment, not a user preference score;
the user has since rejected this direction. Keep the dated namespace results as
an audit trail, not as an active shortlist. None of these names was tested with
developers.

| Candidate | Why it was considered | Current disposition |
| --- | --- | --- |
| Loopraft | Invented `loop` + `craft` blend; no records in the limited queried endpoints | Withdrawn: sounds constructed and may be misheard as “Loopcraft”; no user validation |
| Inforio | Requested by the issue author | Keep only in the evidence record: unclear category meaning and existing Inforío news brand / namespace overlaps |
| Devorio | Invented `dev` + `-orio` blend | Withdrawn: generic prefix and account/domain matches |
| Tiltkit | Signals the current implementation dependency | Withdrawn: risks implying affiliation and is already a SwiftUI package name |
| Devweave | Metaphor for connecting components | Withdrawn: generic developer blend and multiple matching software identities |
| Stackora | Signals a software stack | Withdrawn: generic suffix and existing software workspace identity |
| Stackloom | Metaphor for composing a stack | Withdrawn: `stackloom-cli` package and existing software project |
| Stackpilot | Signals stack management | Withdrawn: bare package names already exist and the query is crowded |

**No candidate is recommended.** The category descriptor can carry the
explanation while a future product name earns distinctiveness, pronunciation,
and searchability. The current working descriptor remains **local
multi-service development, built on Docker and Tilt**; it does not imply an
accepted product identity.

## Additional category and naming research

The first search missed projects close enough to change the naming bar:

| Project | Public evidence | Naming lesson for this project |
| --- | --- | --- |
| Open Workbench | [Maintainer's 2025 update](https://www.reddit.com/r/golang/comments/1mkk3me/update_on_my_go_cli_you_gave_feedback_i_listened/) describes a Go CLI with a `workbench.yaml` manifest, multi-service local development, and generated Docker Compose. The [project repository](https://github.com/jashkahar/open-workbench-platform) documents the tool. | This is a direct category neighbor, not merely a generic “developer tool.” `Workbench` is already used for a closely matching job and should not be proposed. |
| Switchyard | Its [product site](https://switchyard.davidcuellar.tech/) calls it a local development command center; its [CLI docs](https://switchyard.davidcuellar.tech/docs/cli/) cover managing local projects and services. | The local-operations metaphor is already used by a close product. Do not use Switchyard or assume adding a suffix makes it distinct. |
| Trellis | [Trellis documentation](https://trellis.dev/docs/overview/) describes running and supervising local application services. | A pleasant organic metaphor is still crowded when another tool already occupies the same workflow and name. |
| Yard / Railyard | [Yard's CLI](https://useyard.app/docs/install/cli) manages workspaces and runners; the [@kranehq/yard repository](https://github.com/calasanmarko/yard/tree/main/packages/cli) routes local dev servers; [Railyard](https://railyard.run/docs/cli) is a separate deploy CLI. | Short place-and-infrastructure words collide across adjacent developer products and commands. |

The 2025 Open Workbench discussion also reports that its maintainer sought
feedback and evolved the product after hearing that local multi-service
development was a pain point. This is evidence of another project pursuing the
category, not proof of TDK demand, adoption, superiority, or name preference.
The [ten public comments collected here](public-feedback.md) did not assess
Loopraft, Inforio, or any name for TDK.

The next naming round should start from a fresh search and distinctiveness brief,
then compare a small set with developers before another domain/package sweep.
Reject a candidate early if a local-development or multi-service tool already
uses it. Include spoken spelling, unaided recall, category association, and
search-result recognition in that evaluation. No name should advance on an
empty registry result alone.

## Remaining checks before adoption

Scoped npm ownership, other domains and social platforms, language/cultural
review, trademark research, and spoken spelling were not checked. A registry
404 cannot stand in for any of them. Search data should be refreshed after a
new shortlist exists, before reservation or release.

Direct TDK user comprehension and preference remain unknown. Review the
category and naming criteria with maintainers, test fresh candidates with real
developers, complete the remaining checks, and record an accepted identity
before starting the [migration sequence](migration.md).

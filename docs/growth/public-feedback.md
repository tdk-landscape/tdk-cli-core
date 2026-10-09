# Ten public voices: naming and local development

Researched on 9 October 2026 for
[#990](https://github.com/tdk-landscape/tdk-cli-core/issues/990).
These are ten distinct public Hacker News handles with original comment links.
They are not fictional personas or interviews. The handles' offline identities
and relationship to TDK were not verified, and none of the comments below is
direct feedback about TDK or Inforio.

The sample deliberately covers naming problems and competing development
preferences. Five comments come from one
[Devbox launch discussion](https://news.ycombinator.com/item?id=45421302), and
five from one [Tilt discussion](https://news.ycombinator.com/item?id=43806296).
It is a convenience sample, not a representative survey. The source metadata in
the table below links directly to each original comment. Dates are the UTC
posting dates, not research dates.

## Naming lessons from a real incident

Each summary is a paraphrase. The proposed action is our interpretation for TDK.

| Public commenter and date | What they said about Devbox | Proposed action for TDK |
| --- | --- | --- |
| [guerra](https://news.ycombinator.com/item?id=45424843), 2025-09-30 | Mistook the new project for Jetify's existing Devbox | Test whether a candidate leads readers to the intended project |
| [poopsmithe](https://news.ycombinator.com/item?id=45424078), 2025-09-30 | Flagged the existing Devbox name and linked its documentation | Check public product names alongside package namespaces |
| [bryanlarsen](https://news.ycombinator.com/item?id=45422527), 2025-09-30 | Objected to incompatible tools also sharing the `devbox.json` filename | Inventory command and configuration compatibility before a rename |
| [gdotdesign](https://news.ycombinator.com/item?id=45422812), 2025-09-30 | Identified another DevBox tool collection they had built since 2021 | Search adjacent software categories as well as direct competitors |
| [TheRealBadDev](https://news.ycombinator.com/item?id=45433426), 2025-10-01 | Acknowledged missing research before designing the similarly named product | Complete naming research before investing in the rollout |

This incident demonstrates name confusion for Devbox. It does not prove that the
same confusion has occurred for TDK. The naming and configuration concerns are
useful analogies; the commenters' legal or moral opinions are not adopted as legal
findings for this project.

## Local development preferences

| Public commenter and date | What they said about Tilt or their workflow | Proposed action for TDK |
| --- | --- | --- |
| [siliconc0w](https://news.ycombinator.com/item?id=43807429), 2025-04-26 | Described a speed/fidelity trade-off as local dependencies grow | Demonstrate selective startup, rather than always running the whole application |
| [hdjrudni](https://news.ycombinator.com/item?id=43816963), 2025-04-28 | Preferred DevSpace's fit with existing configuration and fast synchronization | Make gradual adoption and integration costs visible |
| [sigmonsays](https://news.ycombinator.com/item?id=43862830), 2025-05-01 | Preferred native application development with containerized external dependencies | Do not assume every target developer wants containerized application development |
| [Noumenon72](https://news.ycombinator.com/item?id=43807284), 2025-04-26 | Valued Tilt's visibility into logs, updates, and service outcomes | Show the service contract beside the runtime tools that consume it |
| [cirego](https://news.ycombinator.com/item?id=43811750), 2025-04-27 | Valued reusing production Kubernetes specifications during development | Explain TDK's local-only scope to avoid a parity expectation it cannot meet |

These comments describe preferences and experiences in 2025, not the present
feature limits of those tools. Current comparisons use the primary documentation
linked in [the category analysis](README.md#alternatives-and-the-adoption-question).

## What remains unknown

The public research establishes ten linked technical comments and a naming
incident in an adjacent category. It supplies zero direct TDK naming responses,
zero completed interviews, and no validated preference between Loopraft and
Inforio. A public handle is not proof of a unique, independently verified person.

Before committing to the name and positioning, show actual prospective users the
short description and candidate names. Ask what the product does, which category
they would search for, how they would spell the spoken name, and which project a
name search finds. Record the actual response and context; do not convert this
public sample into fabricated answers to those questions.

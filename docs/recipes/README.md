# Recipes

One file per outside tool, each checked by running the tool for real.

| Recipe | What it covers |
| --- | --- |
| [moon](moon.md) | A persistent moon task that runs `tdk up` |

Add a recipe when a tool needs more than a Dockerfile: say what was run, with which versions, what happened, and the
limits you hit. Frameworks that only need a Dockerfile belong in [`examples/byo/`](../../examples/byo/README.md).

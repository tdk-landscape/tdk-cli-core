# `tdk ui` key bindings

`tdk ui` opens an interactive terminal dashboard for the running stack. The keys below are the ones the dashboard handles.

| Key | Does |
|---|---|
| `1`–`5` | Jump to Overview, Resources, Events, Files, Config |
| `Tab` / `Shift+Tab` | Next / previous tab |
| `↑`/`↓` or `j`/`k` | Move the highlight |
| `g` / `G`, `Home` / `End` | First / last item |
| `PgUp` / `PgDn` | Move one page |
| `Enter` or `Space` | Open the highlighted stack, service or file |
| `Esc` | Back one level (file → service → stack). On the top screen it only shows "Press q to quit" |
| `/` | Search. `Enter` keeps the filter, `Esc` clears it |
| `r` | Refresh. On Events it reloads events |
| `e` | Toggle enabled-only and all services |
| `t` | Toggle footer tooltips |
| `m` | Toggle mouse support |
| `?` | Show the help panel. Any key closes it |
| `q` | Quit |

## Flags

- `--no-animations`: disable animations (static spinner text).
- `--high-contrast`: enable high-contrast colours.

## Events tab

The Events tab reads from Tilt, so Tilt must be running. If it is not, the tab shows "Tilt is not running or its UI is unreachable" and suggests `tdk up`. Press `r` on that tab to retry.

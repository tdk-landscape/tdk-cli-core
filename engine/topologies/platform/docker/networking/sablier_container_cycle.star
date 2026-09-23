# =============================================================================
# On-demand scaling: Sablier + Traefik (label-based, Traefik >=3.6)
# =============================================================================
# Sablier stops idle containers and wakes them on the next request, so a
# machine only pays memory/CPU for the services actually in use right now --
# the mechanism behind running many more services than would fit if everything
# stayed resident. See github.com/sablierapp/sablier-traefik-plugin.
#
# Traefik >=3.6 added native support for routing to non-running containers
# (traefik.docker.allownonrunning), so the middleware is defined as plain
# Docker labels on the SAME container being put to sleep -- no separate
# file-provider config or always-on placeholder service is needed. This is
# the modern replacement for the old acouvreur/sablier file-provider
# workaround (that project is archived; sablierapp/sablier is the successor).

SABLIER_INTERNAL_URL = "http://sablier:10000"
SABLIER_DEFAULT_SESSION_DURATION = "10m"


def _sablier_config(manifest):
    """Return (enabled, group, session_duration) for a manifest's `sablier` block.

    Opt-in per resource:
        sablier:
          enable: true
          group: <name>            # optional; resources sharing a group wake
                                    # and sleep together (defaults to `stack`)
          sessionDuration: <dur>   # optional Go duration (default 10m)

    Sablier is a Premium feature (requires TDK_LICENSE_KEY; see
    hasSablierLicense() in cli/src/generator/extension-fetch.ts). The real
    enforcement is server-side, in the CLI's `generateMasterConfigs()` choke
    point (template-engine.ts), which actually verifies the key grants
    "sablier" and downgrades `sablier.enable` to false in service.json when
    it doesn't. Starlark has no fetch, so it can't verify that -- this is
    just a local backstop: a hand-edited `sablier.enable: true` with no key
    configured at all is still blocked here, even if `tdk project` was
    never re-run to write the downgrade back to disk.
    """
    cfg = manifest.get('sablier', {}) if manifest else {}
    if not cfg.get('enable', False):
        return False, "", ""
    if os.environ.get('TDK_LICENSE_KEY', '') == '':
        return False, "", ""
    group = cfg.get('group') or (manifest.get('stack', '') if manifest else '') or 'default'
    session_duration = cfg.get('sessionDuration', SABLIER_DEFAULT_SESSION_DURATION)
    return True, group, session_duration


def _sablier_middleware_name(res_name):
    return res_name + "-sablier"


def _sablier_middleware_suffix(manifest, res_name):
    """Return (middleware_suffix, enabled) for a manifest's Sablier block.

    `middleware_suffix` is a `,<res_name>-sablier` fragment ready to append to
    an existing `middlewares=` label list. The middleware itself is defined by
    `_sablier_container_labels` as labels on this SAME container -- Traefik's
    Docker provider discovers it there directly.
    """
    enabled, _group, _session_duration = _sablier_config(manifest)
    if not enabled:
        return "", False
    return "," + _sablier_middleware_name(res_name), True


def _sablier_container_labels(manifest, res_name, indent):
    """Docker labels that put `res_name` under Sablier's on-demand start/stop.

    - `sablier.enable` / `sablier.group` let the Sablier container discover
      this workload and group it with others that should wake/sleep together.
    - The `plugin.sablier.*` labels define the Traefik middleware inline.
    - `traefik.docker.allownonrunning=true` (Traefik >=3.6) keeps the router
      registered while the container is stopped, so the next request wakes it.
    """
    enabled, group, session_duration = _sablier_config(manifest)
    if not enabled:
        return ""
    middleware = _sablier_middleware_name(res_name)
    lines = [
        indent + '- "sablier.enable=true"',
        indent + '- "sablier.group=' + group + '"',
        indent + '- "traefik.http.middlewares.' + middleware + '.plugin.sablier.group=' + group + '"',
        indent + '- "traefik.http.middlewares.' + middleware + '.plugin.sablier.sablierUrl=' + SABLIER_INTERNAL_URL + '"',
        indent + '- "traefik.http.middlewares.' + middleware + '.plugin.sablier.sessionDuration=' + session_duration + '"',
        indent + '- "traefik.docker.allownonrunning=true"',
    ]
    return "\n" + "\n".join(lines)

def _sablier_middleware_suffix(manifest):
    """Return (middleware_suffix, group, enabled) for a manifest's Sablier block.

    When a workload opts in via a `sablier` block, it is fronted by the file-provider
    middleware `sablier-<group>@file` (defined in the platform proxy dynamic config).
    The leading comma lets callers append the suffix to an existing middlewares list.
    """
    sablier_cfg = manifest.get('sablier', {}) if manifest else {}
    if not sablier_cfg.get('enable', False):
        return "", "", False
    group = sablier_cfg.get('group', manifest.get('stack', '') if manifest else '')
    if not group:
        return ",sablier-base@file", "", True
    return ",sablier-" + group + "@file", group, True


def _sablier_container_labels(group, indent):
    """Container labels that let Sablier discover, wake, and stop this workload.

    `traefik.docker.allownonrunning=true` keeps the router registered while the
    container is stopped, so the next request can trigger the wake.
    """
    lines = [indent + '- "sablier.enable=true"']
    if group:
        lines.append(indent + '- "sablier.group=' + group + '"')
    lines.append(indent + '- "traefik.docker.allownonrunning=true"')
    return "\n" + "\n".join(lines)

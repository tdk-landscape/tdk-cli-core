/** Requested names that match no discovered service (the Tiltfile silently enables everything for an unknown focus name). */
export function findUnknownServices(requested, candidates) {
    const known = new Set(candidates.map((resource) => resource.name));
    return requested.filter((name) => !known.has(name));
}
/**
 * The requested services plus their `dependsOn` closure. This mirrors what the generated Tiltfile enables for
 * `--focus=<service>` (see get_all_needed_services in engine/topologies/tilt/config/profiles.star) so the CLI can report
 * the same set. Shared infrastructure (Postgres, Traefik, the golden images) is always enabled by the Tiltfile and is not listed here.
 * A dependsOn entry that is not a discovered service is ignored.
 */
export function resolveOnlySelection(requested, all) {
    const byName = new Map(all.map((resource) => [resource.name, resource]));
    const wanted = new Set();
    const visit = (name) => {
        if (wanted.has(name) || !byName.has(name))
            return;
        wanted.add(name);
        for (const dep of byName.get(name)?.config?.dependsOn ?? [])
            visit(dep);
    };
    for (const name of requested)
        visit(name);
    return {
        selected: all.filter((resource) => wanted.has(resource.name)),
        dependencies: all.map((r) => r.name).filter((n) => wanted.has(n) && !requested.includes(n)),
    };
}

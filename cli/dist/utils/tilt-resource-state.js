/**
 * A Tilt resource that is not built and running yet: still waiting (`pending`, `none`) or building right now
 * (`in_progress`). Readiness must treat all of these as not ready.
 */
export function isTiltResourcePending(updateStatus, runtimeStatus) {
    return (updateStatus === "pending" ||
        updateStatus === "in_progress" ||
        updateStatus === "none" ||
        runtimeStatus === "pending" ||
        runtimeStatus === "none");
}
//# sourceMappingURL=tilt-resource-state.js.map
export type ContainerRuntimeStatus = "running" | "unresponsive" | "missing";
/** Whether Docker, Colima, or Podman is reachable, hung, or absent. */
export declare function getContainerRuntimeStatus(): ContainerRuntimeStatus;
//# sourceMappingURL=docker.d.ts.map
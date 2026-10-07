/**
 * Applies only the result of the most recently started load. A slow earlier load that finishes after a newer one is
 * dropped, so a poll that outlasts its interval cannot put older data back on screen.
 */
export function latestOnly<T>(
  apply: (value: T) => void,
): (load: () => Promise<T>) => Promise<void> {
  let latest = 0;
  return async (load) => {
    const id = ++latest;
    const value = await load();
    if (id === latest) apply(value);
  };
}

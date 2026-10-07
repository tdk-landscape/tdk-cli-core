/**
 * The next step for a service whose host port another process already holds. The occupant is not named: finding it
 * needs the OS, so the command that finds it is given instead.
 */
export function portConflictFix(message: string): string | null {
  const match = message.match(/^host port (\d+) is already allocated$/);
  if (!match) return null;
  const port = match[1];
  return `Fix: stop the process using port ${port} (find it with: lsof -nP -iTCP:${port} -sTCP:LISTEN), or change "port" in the service's service.json and run tdk up`;
}

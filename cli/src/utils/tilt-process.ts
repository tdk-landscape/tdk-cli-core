import { execFileSync } from "node:child_process";

type CommandRunner = (command: string, args: string[]) => string;

const run: CommandRunner = (command, args) =>
  execFileSync(command, args, { encoding: "utf-8", stdio: "pipe", windowsHide: true });

/** Refuse to target arbitrary listeners: only stop a Tilt process on the requested UI port. */
export function findTiltProcessIdsOnPort(
  port: number,
  platform = process.platform,
  commandRunner: CommandRunner = run,
): number[] {
  if (!Number.isInteger(port) || port < 1 || port > 65535) return [];

  if (platform === "win32") {
    const script = `$port=${port}; Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $p=Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -eq 'tilt') { $_.OwningProcess } } | Sort-Object -Unique`;
    try {
      return commandRunner("powershell.exe", ["-NoProfile", "-Command", script])
        .split(/\s+/)
        .map(Number)
        .filter((pid) => Number.isInteger(pid) && pid > 0);
    } catch {
      return [];
    }
  }

  let pids: number[];
  try {
    pids = commandRunner("lsof", ["-nP", "-t", `-iTCP:${port}`, "-sTCP:LISTEN"])
      .split(/\s+/)
      .map(Number)
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  } catch {
    return [];
  }

  return pids.filter((pid) => {
    try {
      const name = commandRunner("ps", ["-p", String(pid), "-o", "comm="]).trim();
      return name.split(/[\\/]/).at(-1) === "tilt";
    } catch {
      return false;
    }
  });
}

export function stopTiltOnPort(
  port: number,
  platform = process.platform,
  commandRunner: CommandRunner = run,
): number[] {
  const pids = findTiltProcessIdsOnPort(port, platform, commandRunner);
  for (const pid of pids) {
    try {
      if (platform === "win32") commandRunner("taskkill.exe", ["/PID", String(pid), "/F"]);
      else commandRunner("kill", ["-TERM", String(pid)]);
    } catch {
      // The process may exit between the listener lookup and the termination request.
    }
  }
  return pids;
}

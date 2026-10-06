import { PassThrough } from "node:stream";
import { render } from "ink";
import { expect, it, vi } from "vitest";
import { TUIApp } from "../ui.js";

const ANSI_SGR = new RegExp([String.fromCharCode(0x1b), "\\[[0-?]*[ -/]*[@-~]"].join(""), "g");

vi.mock("../../utils/services.js", () => ({
  clearMetadataCache: vi.fn(),
  discoverStacks: () =>
    Array.from({ length: 30 }, (_, i) => ({
      name: `stack-${String(i).padStart(2, "0")}`,
      resources: [],
      resourceCount: 0,
    })),
  discoverResources: () => [{ name: "api", path: "/tmp/test/api", stack: "stack-00" }],
  getResourceMetadata: vi.fn(),
  getStackMetadata: vi.fn(),
}));
vi.mock("../../utils/paths.js", () => ({ findProjectRoot: () => "/tmp/test" }));

function streams() {
  const stdin = new PassThrough() as unknown as NodeJS.ReadStream;
  Object.assign(stdin, {
    isTTY: true,
    isRaw: false,
    setRawMode: () => {},
    ref: () => {},
    unref: () => {},
  });
  const stdout = new PassThrough() as unknown as NodeJS.WriteStream;
  Object.assign(stdout, { isTTY: true, columns: 100, rows: 24 });
  const stderr = new PassThrough() as unknown as NodeJS.WriteStream;
  Object.assign(stderr, { isTTY: true, columns: 100, rows: 24 });
  let output = "";
  stdout.on("data", (data) => {
    output += String(data);
  });
  return { stdin, stdout, stderr, output: () => output };
}

it("navigates with vim keys and terminal page/home/end sequences while search receives text", async () => {
  const io = streams();
  const app = render(<TUIApp animated={false} />, {
    stdin: io.stdin,
    stdout: io.stdout,
    stderr: io.stderr,
    interactive: true,
    exitOnCtrlC: false,
    patchConsole: false,
  });
  const send = async (key: string) => {
    io.stdin.write(key);
    await new Promise((resolve) => setTimeout(resolve, 30));
    await app.waitUntilRenderFlush();
  };
  const selected = () =>
    io
      .output()
      .replace(ANSI_SGR, "")
      .match(/▓▒░ stack-\d+/g)
      ?.at(-1);
  try {
    await new Promise((resolve) => setTimeout(resolve, 30));
    await app.waitUntilRenderFlush();
    expect(selected(), io.output()).toBe("▓▒░ stack-00");
    await send("j");
    expect(selected()).toBe("▓▒░ stack-01");
    await send("k");
    expect(selected()).toBe("▓▒░ stack-00");
    await send("G");
    expect(selected()).toBe("▓▒░ stack-29");
    await send("g");
    expect(selected()).toBe("▓▒░ stack-00");
    await send("\x1b[6~");
    expect(selected()).toBe("▓▒░ stack-10");
    await send("\x1b[5~");
    expect(selected()).toBe("▓▒░ stack-00");
    await send("\x1b[F");
    expect(selected()).toBe("▓▒░ stack-29");
    await send("\x1b[H");
    expect(selected()).toBe("▓▒░ stack-00");
    await send("\x0b");
    expect(selected()).toBe("▓▒░ stack-00");
    await send("\x1bk");
    expect(selected()).toBe("▓▒░ stack-00");
    io.stdout.rows = 30;
    io.stdout.emit("resize");
    await new Promise((resolve) => setTimeout(resolve, 30));
    await send("\x1b[6~");
    expect(selected()).toBe("▓▒░ stack-16");
    await send("g");
    await send("/");
    await send("j");
    await send("k");
    await send("g");
    expect(io.output()).toContain("Search: jkg_");
    await send("\x1b");
    await send("G");
    await send("\r");
    expect(io.output()).toContain("Selected stack: stack-29");
  } finally {
    app.unmount();
    io.stdin.destroy();
    io.stdout.destroy();
    io.stderr.destroy();
  }
});

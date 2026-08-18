// Child-process helpers for the smoke/hub scripts: spawn long-running
// servers, wait for their ports, and guarantee teardown on exit.
import { spawn, execFileSync } from "node:child_process";
import net from "node:net";

const children = new Set();

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

/** Spawn a long-running process (relay server, dev server). */
export function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: "inherit", ...opts });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

/** Run a command to completion; reject on non-zero exit. */
export function runToCompletion(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = run(cmd, args, opts);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

/** `npm <args>` to completion (e.g. --prefix <dir> run build:ci). */
export function npmRun(args, opts = {}) {
  return runToCompletion(npm, args, opts);
}

/** Synchronous npm call that returns stdout (e.g. `npm pack`). */
export function npmCapture(args, opts = {}) {
  return execFileSync(npm, args, { encoding: "utf8", ...opts }).trim();
}

export function killAll() {
  for (const child of children) child.kill("SIGTERM");
}
process.on("exit", killAll);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    killAll();
    process.exit(130);
  });
}

/** True if something is listening on 127.0.0.1:port. */
export function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

export async function waitForPort(port, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timed out waiting for port ${port}`);
}

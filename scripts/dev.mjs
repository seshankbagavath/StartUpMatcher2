#!/usr/bin/env node
/**
 * LiftOff dev supervisor — one command to run the whole stack.
 *
 *   pnpm dev
 *
 * Responsibilities:
 *  - Ensure PostgreSQL is reachable; start it if a local cluster is configured.
 *  - Build the API once, then run it with crash-restart (exponential backoff).
 *  - Run the Vite frontend (with the PORT/BASE_PATH it requires).
 *  - Prefix + interleave logs; shut everything down cleanly on Ctrl-C.
 *
 * No external dependencies — just Node.
 *
 * Config via env (all optional; sensible defaults):
 *   API_PORT        default 3001
 *   WEB_PORT        default 5173
 *   DB_HOST/DB_PORT default 127.0.0.1 / 5432   (reachability check)
 *   PGBIN/PGDATA    path to a local PG cluster to auto-start if down
 *   SKIP_BUILD=1    skip the one-time API build
 */
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = path.join(ROOT, "artifacts", "api-server");
const WEB_DIR = path.join(ROOT, "artifacts", "startup-hub");

const API_PORT = process.env.API_PORT ?? "3001";
const WEB_PORT = process.env.WEB_PORT ?? "5173";
const DB_HOST = process.env.DB_HOST ?? "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT ?? "5432");
const isWin = process.platform === "win32";

// ── tiny colored logger ────────────────────────────────────────────────────
const COLORS = { api: "\x1b[36m", web: "\x1b[35m", db: "\x1b[33m", sys: "\x1b[32m" };
const RESET = "\x1b[0m";
function log(tag, line) {
  const color = COLORS[tag] ?? "";
  for (const l of String(line).split(/\r?\n/)) {
    if (l.trim() !== "") process.stdout.write(`${color}[${tag}]${RESET} ${l}\n`);
  }
}

// ── postgres helpers ───────────────────────────────────────────────────────
function tcpOpen(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeout);
    sock.once("connect", () => done(true));
    sock.once("timeout", () => done(false));
    sock.once("error", () => done(false));
    sock.connect(port, host);
  });
}

/** Best-effort: derive a local PG cluster path (env first, then a scoop default). */
function resolvePg() {
  let bin = process.env.PGBIN;
  let data = process.env.PGDATA;
  if (!bin || !data) {
    const home = process.env.USERPROFILE || process.env.HOME || "";
    const scoop = path.join(home, "scoop", "apps", "postgresql", "current");
    if (fs.existsSync(scoop)) {
      bin ||= path.join(scoop, "bin");
      data ||= path.join(scoop, "data");
    }
  }
  if (bin && data && fs.existsSync(bin) && fs.existsSync(data)) return { bin, data };
  return null;
}

async function ensurePostgres() {
  if (await tcpOpen(DB_HOST, DB_PORT)) {
    log("db", `PostgreSQL reachable on ${DB_HOST}:${DB_PORT}`);
    return;
  }
  const pg = resolvePg();
  if (!pg) {
    log("db", `PostgreSQL NOT reachable on ${DB_HOST}:${DB_PORT} and no local cluster found.`);
    log("db", "Start your database (or set PGBIN/PGDATA), then re-run. Continuing anyway…");
    return;
  }
  log("db", `Starting PostgreSQL from ${pg.bin}…`);
  const ctl = path.join(pg.bin, isWin ? "pg_ctl.exe" : "pg_ctl");
  spawnSync(ctl, ["-D", pg.data, "-l", path.join(pg.data, "server.log"), "start"], {
    stdio: "ignore",
  });
  for (let i = 0; i < 15; i++) {
    if (await tcpOpen(DB_HOST, DB_PORT)) {
      log("db", "PostgreSQL is up.");
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  log("db", "Timed out waiting for PostgreSQL — continuing; the API will retry.");
}

// ── process supervision ────────────────────────────────────────────────────
const children = new Set();
let shuttingDown = false;

function pipe(tag, child) {
  child.stdout?.on("data", (d) => log(tag, d.toString()));
  child.stderr?.on("data", (d) => log(tag, d.toString()));
}

/** Spawn a long-running process and restart it if it exits unexpectedly. */
function supervise(tag, cmd, args, opts, { restart = true } = {}) {
  let restarts = 0;
  let backoff = 1000;

  const start = () => {
    const child = spawn(cmd, args, { ...opts, shell: opts.shell ?? false });
    children.add(child);
    pipe(tag, child);

    child.on("exit", (code, signal) => {
      children.delete(child);
      if (shuttingDown) return;
      log(tag, `exited (code=${code ?? "null"} signal=${signal ?? "none"}).`);
      if (!restart) return;
      // Reset backoff if it had been running a while.
      restarts += 1;
      const delay = Math.min(backoff, 8000);
      backoff = Math.min(backoff * 2, 8000);
      log("sys", `restarting [${tag}] in ${delay}ms (restart #${restarts})…`);
      setTimeout(() => {
        if (!shuttingDown) start();
      }, delay);
    });
    child.on("error", (err) => log(tag, `spawn error: ${err.message}`));
    return child;
  };
  start();
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log("sys", "shutting down…");
  for (const child of children) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(0), 500);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  log("sys", "LiftOff dev — starting stack");
  await ensurePostgres();

  // Build the API once so dist/index.mjs is fresh (esbuild is fast).
  if (process.env.SKIP_BUILD !== "1") {
    log("sys", "building API…");
    const build = spawnSync("pnpm", ["--filter", "@workspace/api-server", "run", "build"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    });
    if (build.status !== 0) {
      log("sys", "API build failed — fix the error above and re-run.");
      process.exit(1);
    }
  }

  // API: run the bundled server with crash-restart.
  supervise(
    "api",
    process.execPath,
    ["--env-file=.env", "--enable-source-maps", "./dist/index.mjs"],
    { cwd: API_DIR, env: { ...process.env, PORT: API_PORT } },
  );

  // Frontend: Vite needs PORT + BASE_PATH; disable Git-Bash path mangling.
  supervise(
    "web",
    "pnpm",
    ["--filter", "@workspace/startup-hub", "run", "dev"],
    {
      cwd: ROOT,
      shell: true,
      env: { ...process.env, PORT: WEB_PORT, BASE_PATH: "/", MSYS_NO_PATHCONV: "1" },
    },
  );

  log("sys", `API → http://localhost:${API_PORT}/api   Web → http://localhost:${WEB_PORT}/`);
  log("sys", "press Ctrl-C to stop everything.");
}

main().catch((err) => {
  log("sys", `fatal: ${err.stack || err}`);
  process.exit(1);
});

import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");

const { version } = JSON.parse(
  readFileSync(resolve(repoRoot, "package.json"), "utf8"),
);

const isDev = process.argv.includes("--dev");

function shortCommit() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "nogit";
  }
}

function timestamp() {
  // yyyymmdd-hhmm, UTC so builds from different machines sort together
  return new Date().toISOString().replace(/[-:]/g, "").slice(0, 13).replace("T", "-");
}

const ARCHIVE_PREFIX = `game-cyberpunk2077`;

const archiveName = isDev
  ? `${ARCHIVE_PREFIX}-dev-${version}+${shortCommit()}-${timestamp()}.7z`
  : `${ARCHIVE_PREFIX}-${version}.7z`;

// 7z appends to an existing archive rather than replacing it
rmSync(resolve(repoRoot, archiveName), { force: true });

execFileSync("7z", ["a", archiveName, "./dist/*"], {
  cwd: repoRoot,
  stdio: "inherit",
});

console.log(`\nPackaged ${archiveName}`);
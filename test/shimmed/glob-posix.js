//
// Minimal stand-in for `glob`, used only by `test/unit/mods.example.ts`.
//
// Why this exists:
//
//   `jest.linux.config.ts` remaps `path` to win32 for every module in the
//   registry, including `node_modules`. Real `glob` then tries to walk the
//   posix filesystem with win32 path semantics and matches nothing, which
//   silently empties the example-mod suite. Only `glob.sync` is used, and
//   only with a single `dir/mods.example.*.ts` style pattern, so a tiny
//   posix-only implementation is enough.
//
//   This shim is wired up by `jest.linux.config.ts` ONLY.
//
const fs = require(`node:fs`);
const nodePath = require(`node:path`);

const escapeForRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);

const patternAsRegex = (filenamePattern) =>
  new RegExp(`^${filenamePattern.split(`*`).map(escapeForRegex).join(`.*`)}$`);

const sync = (pattern) => {
  const dir = nodePath.posix.dirname(pattern);
  const matchesPattern = patternAsRegex(nodePath.posix.basename(pattern));

  return fs
    .readdirSync(dir)
    .filter((entry) => matchesPattern.test(entry))
    .map((entry) => nodePath.posix.join(dir, entry))
    .sort();
};

module.exports = { sync };
module.exports.default = module.exports;

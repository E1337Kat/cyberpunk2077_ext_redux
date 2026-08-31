//
// Force win32 path semantics for OUR code when running tests on a posix host.
//
// Why this exists:
//
//   Vortex only runs on Windows, and the layout constants in
//   `src/installers.layouts.ts` are written with Windows separators
//   (e.g. `path.join('r6\\tweaks\\')`). On Windows, `path` === `path.win32`
//   so everything lines up. On Linux/macOS, `path.sep` is `/` while those
//   constants keep their literal backslashes, so `FileTree` (which splits
//   on `path.sep`) never matches a canonical prefix and most of the
//   installer suite fails for reasons that have nothing to do with the code.
//
//   This shim is wired up by `jest.linux.config.ts` ONLY. The default
//   `npm test` / CI path (Windows) never loads it.
//
// Note: `path.win32.win32 === path.win32`, so both
//   `import path from "path"` and `import { win32 } from "path"` work.
//
// `node:path` is used deliberately - a plain `require("path")` would be
// remapped back to this file and recurse.
//
const realPath = require(`node:path`);

module.exports = realPath.win32;

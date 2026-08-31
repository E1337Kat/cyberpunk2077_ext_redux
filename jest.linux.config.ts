import type { Config } from "@jest/types";

import baseConfig from "./jest.config";

//
// Jest config for running the suite on a posix host (Linux/macOS/WSL-as-posix).
//
// `npm test` uses `jest.config.ts` and is the config CI runs on Windows.
// That is still the authoritative one - use this only for local iteration
// on a posix box, where the default config fails ~173 tests purely because
// `path.sep` is `/`.
//
// See `test/shimmed/path-win32.js` and `test/shimmed/glob-posix.js` for why.
//
// Known remaining failures with this config (6, all in `ini` examples):
// the examples that use `mock-fs` register posix paths while the installer
// reads a win32 path, so `fs.readFileSync` misses. Verify those on Windows.
//
const config: Config.InitialOptions = {
  ...baseConfig,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    "^glob$": `<rootDir>/test/shimmed/glob-posix.js`,
    "^path$": `<rootDir>/test/shimmed/path-win32.js`,
  },
};

export default config;

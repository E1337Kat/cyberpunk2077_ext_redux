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
// 6 `ini` examples are skipped under this config because reasons.
// Verify anything about the `ini` examples on Windows.
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

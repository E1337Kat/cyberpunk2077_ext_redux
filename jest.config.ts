import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.ts$": `ts-jest`,
  },
  globals: {
    "ts-jest": {
      tsconfig: `test/tsconfig.jest.json`,
    },
  },
  moduleDirectories: [`node_modules`, `src`],
  moduleNameMapper: {
    "@vortex-api-test-shimmed": `<rootDir>/test/shimmed/vortex-api-test-shimmed.ts`,
  },
  setupFilesAfterEnv: [`jest-expect-message`],
};

export default config;

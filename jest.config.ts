import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "test/tsconfig.jest.json",
    },
  },
  moduleDirectories: ["node_modules", "src"],
};

export default config;

import {
  VortexProfile,
} from "../../src/vortex-wrapper";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fail = (...args: any[]) => {
  throw new Error(`This is a test shim and shouldn't be called, args: ${args}`);
};

export const mockedActiveProfile: VortexProfile = {
  id: `xyZzZyx`,
  name: `Test Profile`,
  gameId: `cyberpunk2077`,
  lastActivated: 0,
  modState: {},
};

export const fs = {
  ensureDirWritableAsync: jest.fn(),
  statAsync: jest.fn(),
  writeFileAsync: jest.fn(),
  renameAsync: jest.fn(),
};

export const selectors = {
  activeProfile: (..._args): VortexProfile => mockedActiveProfile,
};

export const util = {
  GameStoreHelper: {
    findByAppId: jest.fn(),
  },
  getSafe: jest.fn(),
  NotFound: jest.fn(),
  opn: jest.fn(),
  renderModName: jest.fn(),
};

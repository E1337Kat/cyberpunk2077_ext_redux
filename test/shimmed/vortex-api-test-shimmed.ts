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
  ensureDirAsync: jest.fn(),
  ensureDirWritableAsync: jest.fn(),
  moveAsync: jest.fn(),
  removeAsync: jest.fn(),
  rmdirAsync: jest.fn(),
  statAsync: jest.fn(),
  writeFileAsync: jest.fn(),
  renameAsync: jest.fn(),
};

export const selectors = {
  activeGameId: jest.fn(),
  activeProfile: (..._args): VortexProfile => mockedActiveProfile,
  getMod: jest.fn(),
  getModInstallPath: jest.fn(),
  modsForGame: jest.fn(),
};

export const actions = {
  setModAttribute: jest.fn(),
};

export const util = {
  deleteOrNop: jest.fn(),
  GameStoreHelper: {
    findByAppId: jest.fn(),
  },
  getSafe: jest.fn(),
  NotFound: jest.fn(),
  opn: jest.fn(),
  renderModName: jest.fn(),
  toPromise: jest.fn(),
  walk: jest.fn(),
};

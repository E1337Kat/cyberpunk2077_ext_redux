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
  readFileAsync: jest.fn(),
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
  setFBLoadOrder: jest.fn(),
  setModAttribute: jest.fn(),
};

// Runs the queued work one at a time, in the order it was handed over.
// `tryOnly` turns a request away while something is already running.
export const makeQueue = <T>(): (
  func: () => PromiseLike<T>,
  tryOnly: boolean,
) => Promise<T | undefined> => {
  let running = 0;
  let queued: Promise<unknown> = Promise.resolve();

  return (func: () => PromiseLike<T>, tryOnly: boolean): Promise<T | undefined> => {
    if (tryOnly && running > 0) {
      return Promise.resolve(undefined);
    }

    running += 1;

    const thisOne = queued.then(() => func());

    queued = thisOne.catch(() => undefined).then(() => { running -= 1; });

    return thisOne;
  };
};

export const util = {
  makeQueue,
  deleteOrNop: jest.fn(),
  GameStoreHelper: {
    findByAppId: jest.fn(),
  },
  getManifest: jest.fn(),
  getSafe: jest.fn(),
  NotFound: jest.fn(),
  opn: jest.fn(),
  renderModName: jest.fn(),
  toPromise: <ResT>(func: (cb: (err: Error | null, res?: ResT) => void) => void): Promise<ResT> =>
    new Promise((resolve, reject) => {
      func((err, res) => {
        if (err === null || err === undefined) {
          resolve(res as ResT);
        } else {
          reject(err);
        }
      });
    }),
  walk: jest.fn(),
};

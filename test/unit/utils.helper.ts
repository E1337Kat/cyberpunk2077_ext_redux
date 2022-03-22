/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as path from "path";
import { Console } from "console";
import { mockDeep, MockProxy } from "jest-mock-extended";
import { VortexApi } from "../../src/vortex-wrapper";
import { installerPipeline } from "../../src/installers";
import { fileTreeFromPaths } from "../../src/filetree";
import { InstallerType } from "../../src/installers.types";

export const GAME_ID = "cyberpunk2077";

// This is the most nonsense of all nonsense, but under some
// conditions it seems to be possible for jest to override
// `console`...
//
// eslint-disable-next-line no-global-assign
console = new Console(process.stdout, process.stderr);

// This also contains a log, don't forget... may need to mock it.
export const mockVortexApi: MockProxy<VortexApi> = mockDeep<VortexApi>();

export const mockVortexLog = jest.fn();

if (process.env.DEBUG) {
  // eslint-disable-next-line no-console
  mockVortexLog.mockImplementation((...args) => console.log("Log:", args));
}

export const getFallbackInstaller = () => {
  const fallbackInstaller = installerPipeline[installerPipeline.length - 1];

  test("last installer in pipeline is the fallback", () => {
    expect(fallbackInstaller.type).toBe(InstallerType.Fallback);
  });

  return fallbackInstaller;
};

export const matchSpecific = async (installer, modFiles: string[]) =>
  installer.testSupported(
    mockVortexApi,
    mockVortexLog,
    modFiles,
    fileTreeFromPaths(modFiles),
    GAME_ID,
  );

export const matchInstaller = async (modFiles: string[]) => {
  for (const installer of installerPipeline) {
    const result = await matchSpecific(installer, modFiles);

    if (result.supported) {
      return installer;
    }
  }

  return undefined;
};

export const pathHierarchyFor = (entirePath: string): string[] => {
  const pathSegments = path.normalize(entirePath).split(path.sep);

  const hierarchy: string[] = pathSegments.reduce(
    (supers: string[], segment: string) =>
      supers.concat(path.join(supers[supers.length - 1], segment, path.sep)),
    [""],
  );

  return hierarchy.slice(1);
};

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as path from "path";
import { mock, MockProxy } from "jest-mock-extended";
import { VortexAPI } from "../../src/vortex-wrapper";
import { installerPipeline, InstallerType } from "../../src/installers";

export const GAME_ID = "cyberpunk2077";

export const mockVortexAPI: MockProxy<VortexAPI> = mock<VortexAPI>();

export const mockVortexLog = jest.fn();

if (process.env.DEBUG) {
  // eslint-disable-next-line no-console
  mockVortexLog.mockImplementation((...args) => console.log("Log:", args));
}

export const getFallbackInstaller = () => {
  const fallbackInstaller = installerPipeline[installerPipeline.length - 1];

  test("last installer in pipeline is the fallback", () => {
    expect(fallbackInstaller.type).toBe(InstallerType.FallbackForOther);
  });

  return fallbackInstaller;
};

export const matchSpecific = async (installer, modFiles: string[]) =>
  installer.testSupported(mockVortexAPI, mockVortexLog, modFiles, GAME_ID);

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

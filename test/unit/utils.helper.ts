/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { mock, mockFn, MockProxy } from "jest-mock-extended";
import * as Vortex from "vortex-api/lib/types/api";
import {
  installerPipeline,
  InstallerType,
  VortexLogFunc,
} from "../../src/installers";

export const GAME_ID = "cyberpunk2077";

export const mockVortexAPI: MockProxy<Vortex.IExtensionApi> =
  mock<Vortex.IExtensionApi>();

export const mockVortexLog: VortexLogFunc = mockFn<VortexLogFunc>();

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

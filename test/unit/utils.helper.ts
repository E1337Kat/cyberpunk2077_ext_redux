/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { installerPipeline, InstallerType } from "../../src/installers";

export const GAME_ID = "cyberpunk2077";

export const getFallbackInstaller = () => {
  const fallbackInstaller = installerPipeline[installerPipeline.length - 1];

  test("last installer in pipeline is the fallback", () => {
    expect(fallbackInstaller.type).toBe(InstallerType.FallbackForOther);
  });

  return fallbackInstaller;
};

export const matchSpecific = async (installer, modFiles: string[]) =>
  installer.testSupported(modFiles, GAME_ID);

export const matchInstaller = async (modFiles: string[]) => {
  for (const installer of installerPipeline) {
    const result = await matchSpecific(installer, modFiles);

    if (result.supported) {
      return installer;
    }
  }

  return undefined;
};

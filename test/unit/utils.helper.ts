import { installerPipeline } from "../../src/installers";

const GAME_ID = "cyberpunk2077";

export const matchInstaller = async (modFiles: string[]) => {
  for (const installer of installerPipeline) {
    const result = await installer.testSupported(modFiles, GAME_ID);

    if (result.supported) {
      return installer;
    }
  }

  return undefined;
};

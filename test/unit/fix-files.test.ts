import { installerPipeline, InstallerType } from "../../src/installers";
import { ArchiveOnly } from "./mods.example";

const GAME_ID = "cyberpunk2077";

const matchInstaller = async (modFiles: string[]) =>
  installerPipeline.find(
    async (installer) =>
      (await installer.testSupported(modFiles, GAME_ID)).supported,
  );

describe("Selecting the installer for a mod type", () => {
  describe("archive-only mods", () => {
    ArchiveOnly.forEach(async (mod, kind) => {
      test(`selects the archive-only installer when ${kind}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer.type).toBe(InstallerType.ArchiveOnly);
      });
    });
  });
});

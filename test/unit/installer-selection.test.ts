import { installerPipeline, InstallerType } from "../../src/installers";
import { ArchiveOnlyMods } from "./example-mods";

const GAME_ID = "cyberpunk2077";

const matchInstaller = async (modFiles: string[]) =>
  installerPipeline.find(
    async (installer) =>
      (await installer.testSupported(modFiles, GAME_ID)).supported,
  );

describe("archive-only mods", () => {
  Object.entries(ArchiveOnlyMods).forEach(async ([kind, files]) => {
    test(`recognizes an archive-only mod when ${kind}`, async () => {
      const installer = await matchInstaller(files);
      expect(installer.type).toBe(InstallerType.ArchiveOnly);
    });

    test(`selects the archive-only installer when ${kind}`, async () => {
      const installer = await matchInstaller(files);
      expect(installer.type).toBe(InstallerType.ArchiveOnly);
    });
  });
});

import { installerPipeline, InstallerType } from "../../src/installers";
import { ArchiveOnly } from "./mods.example";
import { matchInstaller } from "./utils.helper";

const GAME_ID = "cyberpunk2077";

describe("Transforming modules to instructions", () => {
  describe("archive-only mods", () => {
    ArchiveOnly.forEach(async (mod, kind) => {
      test(`produce the expected instructions ${kind}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.ArchiveOnly);

        const installResult = await installer.install(
          mod.inFiles,
          null,
          null,
          null,
        );

        expect(installResult.instructions).toEqual(mod.outInstructions);
      });
    });
  });
});

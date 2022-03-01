import { GameEntryNotFound } from "vortex-api/lib/types/IGameStore";
import {
  installerPipeline,
  InstallerType,
  InstallerWithPriority,
} from "../../src/installers";
import { ArchiveOnly, CetMod } from "./mods.example";
import { matchInstaller } from "./utils.helper";

describe("Selecting the installer for a mod type", () => {
  describe("CET mods", () => {
    CetMod.forEach(async (mod, kind) => {
      test(`selects the CET installer when ${kind}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.CET);
      });
    });
  });

  describe("archive-only mods", () => {
    ArchiveOnly.forEach(async (mod, kind) => {
      test(`selects the archive-only installer when ${kind}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.ArchiveOnly);
      });
    });
  });
});

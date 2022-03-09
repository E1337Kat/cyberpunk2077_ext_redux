import { InstallerType } from "../../src/installers";
import { AllModTypes, ArchiveOnly, CetMod, IniMod } from "./mods.example";
import {
  getFallbackInstaller,
  matchInstaller,
  matchSpecific,
} from "./utils.helper";

describe("Selecting the installer for a mod type", () => {
  describe("CET mods", () => {
    CetMod.forEach(async (mod, desc) => {
      test(`selects the CET installer when ${desc}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.CET);
      });
    });
  });

  describe("Ini and Reshade mods", () => {
    IniMod.forEach(async (mod, desc) => {
      test(`selects the archive-only installer when ${desc}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.INI);
      });
    });
  });

  describe("archive-only mods", () => {
    ArchiveOnly.forEach(async (mod, desc) => {
      test(`selects the archive-only installer when ${desc}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.ArchiveOnly);
      });
    });
  });

  describe("fallback for anything that doesn't match other installers", () => {
    const fallbackInstaller = getFallbackInstaller();

    AllModTypes.forEach((type) => {
      type.forEach(async (mod, desc) => {
        test(`doesn’t match mod matched by specific installer when ${desc}`, async () => {
          const result = await matchSpecific(fallbackInstaller, mod.inFiles);
          expect(result.supported).toBeFalsy();
        });
      });
    });
  });
});

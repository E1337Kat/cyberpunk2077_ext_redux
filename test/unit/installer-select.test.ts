import { AllModTypes } from "./mods.example";
import {
  getFallbackInstaller,
  matchInstaller,
  matchSpecific,
} from "./utils.helper";

describe("Selecting the installer for a mod type", () => {
  AllModTypes.forEach((examples, set) => {
    describe(`${set} mods`, () => {
      examples.forEach(async (mod, desc) => {
        test(`select the ${mod.expectedInstallerType} installer when ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);
        });
      });
    });
  });

  describe("fallback for anything that doesn't match other installers", () => {
    const fallbackInstaller = getFallbackInstaller();

    AllModTypes.forEach((set) => {
      set.forEach(async (mod, desc) => {
        test(`doesn’t match mod matched by specific installer when ${desc}`, async () => {
          const result = await matchSpecific(fallbackInstaller, mod.inFiles);
          expect(result.supported).toBeFalsy();
        });
      });
    });
  });
});

import * as path from "path";
import { AllModTypes } from "./mods.example";
import {
  getFallbackInstaller,
  matchInstaller,
  mockVortexAPI,
  mockVortexLog,
} from "./utils.helper";

const fakeInstallDir = path.join("C:\\magicstuff\\maybemodziporsomething");

describe("Transforming modules to instructions", () => {
  AllModTypes.forEach((examples, set) => {
    describe(`${set} mods`, () => {
      examples.forEach(async (mod, desc) => {
        test(`produce the expected instructions when ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);

          const installResult = await installer.install(
            mockVortexAPI,
            mockVortexLog,
            mod.inFiles,
            fakeInstallDir,
            null,
            null,
          );

          expect(installResult.instructions).toEqual(mod.outInstructions);
        });
      });
    });
  });

  describe("fallback for anything that doesn't match other installers", () => {
    const fallbackInstaller = getFallbackInstaller();

    AllModTypes.forEach((type) => {
      type.forEach(async (mod, desc) => {
        test(`doesn’t produce any instructions handled by specific installers when ${desc}`, async () => {
          const installResult = await fallbackInstaller.install(
            mockVortexAPI,
            mockVortexLog,
            mod.inFiles,
            fakeInstallDir,
            null,
            null,
          );

          expect(installResult.instructions).toEqual([]);
        });
      });
    });
  });
});

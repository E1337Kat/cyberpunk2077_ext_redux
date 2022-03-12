import { fileTreeFromPaths } from "../../src/filetree";
import {
  AllExpectedInstallFailures,
  AllModTypes,
  FAKE_STAGING_PATH,
} from "./mods.example";
import {
  getFallbackInstaller,
  matchInstaller,
  mockVortexAPI,
  mockVortexLog,
} from "./utils.helper";

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
            fileTreeFromPaths(mod.inFiles),
            FAKE_STAGING_PATH,
            null,
            null,
          );

          expect(installResult.instructions).toEqual(mod.outInstructions);
        });
      });
    });
  });

  AllExpectedInstallFailures.forEach((examples, set) => {
    describe(`install attempts that should fail, ${set}`, () => {
      examples.forEach(async (mod, desc) => {
        test(`rejects with an error when ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);

          expect(() =>
            installer.install(
              mockVortexAPI,
              mockVortexLog,
              mod.inFiles,
              fileTreeFromPaths(mod.inFiles),
              FAKE_STAGING_PATH,
              null,
              null,
            ),
          ).rejects.toThrowError(mod.failure);
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
            fileTreeFromPaths(mod.inFiles),
            FAKE_STAGING_PATH,
            null,
            null,
          );

          expect(installResult.instructions).toEqual([]);
        });
      });
    });
  });
});

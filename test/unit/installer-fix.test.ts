import {
  AllExpectedInstallFailures,
  AllModTypes,
  FAKE_STAGING_PATH,
} from "./mods.example";
import * as path from "path";
import { InstallerType } from "../../src/installers";
import {  ArchiveOnly, CetMod, IniMod } from "./mods.example";
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
            FAKE_STAGING_PATH,
            null,
            null,
          );

          expect(installResult.instructions).toEqual(mod.outInstructions);
        });
      });
    });
  });

  describe("Transforming modules to instructions", () => {
    describe("Ini and Reshade mods", () => {
      IniMod.forEach(async (mod, kind) => {
        test(`produce the expected instructions ${kind}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(InstallerType.INI);

          const installResult = await installer.install(
            mockVortexAPI,
            mockVortexLog,
            mod.inFiles,
            FAKE_STAGING_PATH,
            null,
            null,
          );

          expect(installResult.instructions).toEqual(mod.outInstructions);
        });
      });
    });
  });

  describe("archive-only mods", () => {
    ArchiveOnly.forEach(async (mod, kind) => {
      test(`produce the expected instructions ${kind}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.ArchiveOnly);

        const installResult = await installer.install(
          mockVortexAPI,
          mockVortexLog,
          mod.inFiles,
          FAKE_STAGING_PATH,
          null,
          null,
        );

        expect(installResult.instructions).toEqual(mod.outInstructions);
      });
    });
  });

  AllExpectedInstallFailures.forEach((examples, set) => {
    describe(`${set} mods`, () => {
      examples.forEach(async (mod, desc) => {
        test(`produce the expected instructions when ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);

          expect(() =>
            installer.install(
              mockVortexAPI,
              mockVortexLog,
              mod.inFiles,
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

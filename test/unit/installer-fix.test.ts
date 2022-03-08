import * as path from "path";
import { InstallerType } from "../../src/installers";
import { AllModTypes, ArchiveOnly, CetMod } from "./mods.example";
import {
  getFallbackInstaller,
  matchInstaller,
  mockVortexAPI,
  mockVortexLog,
} from "./utils.helper";

const fakeInstallDir = path.join("C:\\magicstuff\\maybemodziporsomething");

describe("Transforming modules to instructions", () => {
  describe("CET mods", () => {
    CetMod.forEach(async (mod, kind) => {
      test(`produce the expected instructions ${kind}`, async () => {
        const installer = await matchInstaller(mod.inFiles);
        expect(installer).toBeDefined();
        expect(installer.type).toBe(InstallerType.CET);

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
          fakeInstallDir,
          null,
          null,
        );

        expect(installResult.instructions).toEqual(mod.outInstructions);
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

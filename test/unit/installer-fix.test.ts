import { notEmpty, mockDeep, MockProxy } from "jest-mock-extended";
import mockFs from "mock-fs";
import { InstallChoices } from "../../src/dialogs";
import { fileTreeFromPaths } from "../../src/filetree";
import { VortexApi, VortexDialogResult } from "../../src/vortex-wrapper";
import {
  AllExpectedInstallFailures,
  AllExpectedInstallPromptables,
  AllModTypes,
  FAKE_STAGING_PATH,
} from "./mods.example";
import { matchInstaller, mockVortexApi, mockVortexLog } from "./utils.helper";

// Should switch this to compute the path in case changed, but eh..
/*
const fakeModZipfileStructure = FAKE_STAGING_PATH.split(path.sep).reduceRight<object>(
  (subDir: object, dir: string) => Object.fromEntries([[dir, subDir]]),
  fakeStagingDirContent,
);
*/

describe("Transforming modules to instructions", () => {
  beforeEach(() =>
    mockFs({
      unno: {
        why: {
          this: {
            "vortexusesthezipfileasdir-3429 4": {
              "myawesomeconfig.ini": "[Secret setting]\nFrogs=Purple",
              "serious.ini": "[super serious]\nWings=false",
              "superreshade.ini":
                "KeyPCGI_One@RadiantGI.fx=46,0,0,0\nPreprocessorDefinitions=SMOOTHNORMALS=1",
              fold1: {
                "myawesomeconfig.ini": "[Secret setting]\nFrogs=Purple",
                "serious.ini": "[super serious]\nWings=false",
                "superreshade.ini":
                  "KeyPCGI_One@RadiantGI.fx=46,0,0,0\nPreprocessorDefinitions=SMOOTHNORMALS=1",
                "reshade-shaders": {
                  Shaders: { "fancy.fx": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
                  Textures: { "lut.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
                },
              },
              "reshade-shaders": {
                Shaders: { "fancy.fx": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
                Textures: { "lut.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
              },
            },
          },
        },
      },
    }),
  );
  afterEach(() => mockFs.restore());

  AllModTypes.forEach((examples, set) => {
    describe(`${set} mods`, () => {
      examples.forEach(async (mod, desc) => {
        test(`produce the expected instructions when ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);

          const installResult = await installer.install(
            mockVortexApi,
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

  AllExpectedInstallPromptables.forEach((examples, set) => {
    describe(`install attempts that should prompt to proceed/cancel, ${set}`, () => {
      examples.forEach(async (mod, desc) => {
        test(`proceeds to produce fallback install when choosing to proceed on ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);

          // This, um, may need some cleaning up. -.-
          const mockResult: VortexDialogResult = {
            action: InstallChoices.Proceed,
            input: undefined,
          };
          const mockApi: MockProxy<VortexApi> = mockDeep<VortexApi>();
          mockApi.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve<VortexDialogResult>(mockResult));

          const installResult = await installer.install(
            mockApi,
            mockVortexLog,
            mod.inFiles,
            fileTreeFromPaths(mod.inFiles),
            FAKE_STAGING_PATH,
            null,
            null,
          );

          expect(installResult.instructions).toEqual(mod.proceedOutInstructions);
        });
        test(`rejects the install when choosing to cancel on ${desc}`, async () => {
          const installer = await matchInstaller(mod.inFiles);
          expect(installer).toBeDefined();
          expect(installer.type).toBe(mod.expectedInstallerType);

          // This, um, may need some cleaning up. -.-
          const mockResult: VortexDialogResult = {
            action: InstallChoices.Cancel,
            input: undefined,
          };
          const mockApi: MockProxy<VortexApi> = mockDeep<VortexApi>();
          mockApi.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve<VortexDialogResult>(mockResult));

          const expectation = expect(
            installer.install(
              mockApi,
              mockVortexLog,
              mod.inFiles,
              fileTreeFromPaths(mod.inFiles),
              FAKE_STAGING_PATH,
              null,
              null,
            ),
          );

          await expectation.rejects.toThrowError(new Error(mod.cancelErrorMessage));
        });
      });
    });
  });

  AllExpectedInstallFailures.forEach((examples, set) => {
    describe(`install attempts that should fail, ${set}`, () => {
      examples.forEach(async (mod, desc) => {
        test(`rejects with an error when ${desc}`, async () => {
          let message;

          try {
            // wow
            const installer = await matchInstaller(mod.inFiles);
            expect(installer).toBeDefined();
            expect(installer.type).toBe(mod.expectedInstallerType);

            await installer.install(
              mockVortexApi,
              mockVortexLog,
              mod.inFiles,
              fileTreeFromPaths(mod.inFiles),
              FAKE_STAGING_PATH,
              null,
              null,
            );
          } catch (error) {
            // such type
            message = error.message;
          } finally {
            if (message) {
              // much fp
              expect(message).toEqual(mod.failure);
            } else {
              // very safety
              expect(message, `should've rejected for ${desc}`).toEqual(mod.failure);
            }
          }
        });
      });
    });
  });

  /*
  describe("Verifying that the fallback is last in the pipeline", () => {
    const fallbackInstaller = getFallbackInstaller();

    AllModTypes.forEach((type) => {
      type.forEach(async (mod, desc) => {
        test(`doesn’t produce any instructions handled by specific installers when ${desc}`, async () => {
          const installResult = await fallbackInstaller.install(
            mockVortexApi,
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
  */
});

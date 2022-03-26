import { notEmpty, mockDeep, DeepMockProxy } from "jest-mock-extended";
import mockFs from "mock-fs";
import { InstallChoices } from "../../src/dialogs";
import { GAME_ID } from "../../src/index.metadata";
import { internalPipelineInstaller, wrapInstall } from "../../src/installers";
import { VortexDialogResult, VortexExtensionContext } from "../../src/vortex-wrapper";
import {
  AllExpectedDirectFailures,
  AllExpectedInstallPromptables,
  AllExpectedSuccesses,
  FAKE_STAGING_PATH,
} from "./mods.example";
import { getMockVortexLog } from "./utils.helper";

// Should switch this to compute the path in case changed, but eh..
/*
const fakeModZipfileStructure = FAKE_STAGING_PATH.split(path.sep).reduceRight<object>(
  (subDir: object, dir: string) => Object.fromEntries([[dir, subDir]]),
  fakeStagingDirContent,
);
*/

describe("Transforming modules to instructions", () => {
  beforeEach(() => {
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
    });
  });

  afterEach(() => mockFs.restore());

  AllExpectedSuccesses.forEach((examples, set) => {
    describe(`${set} mods`, () => {
      examples.forEach(async (mod, desc) => {
        test(`produce the expected instructions when ${desc}`, async () => {
          //
          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          mockVortexExtensionContext.api.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve(true));

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog() },
            internalPipelineInstaller,
          );

          const installResult = await wrappedInstall(
            mod.inFiles,
            FAKE_STAGING_PATH,
            GAME_ID,
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
          const mockResult: VortexDialogResult = {
            action: InstallChoices.Proceed,
            input: undefined,
          };

          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          mockVortexExtensionContext.api.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve<VortexDialogResult>(mockResult));

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog },
            internalPipelineInstaller,
          );

          const installResult = await wrappedInstall(
            mod.inFiles,
            FAKE_STAGING_PATH,
            GAME_ID,
            null,
          );

          expect(installResult.instructions).toEqual(mod.proceedOutInstructions);
        });
        test(`rejects the install when choosing to cancel on ${desc}`, async () => {
          const mockResult: VortexDialogResult = {
            action: InstallChoices.Cancel,
            input: undefined,
          };

          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          mockVortexExtensionContext.api.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve<VortexDialogResult>(mockResult));

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog },
            internalPipelineInstaller,
          );

          const expectation = expect(
            wrappedInstall(mod.inFiles, FAKE_STAGING_PATH, GAME_ID, null),
          );

          await expectation.rejects.toThrowError(new Error(mod.cancelErrorMessage));
        });
      });
    });
  });

  AllExpectedDirectFailures.forEach((examples, set) => {
    describe(`mods that installers reject without prompt, ${set}`, () => {
      examples.forEach((mod, desc) => {
        test(`rejects the install outright when ${desc}`, async () => {
          //

          const mockVortexExtensionContext: DeepMockProxy<VortexExtensionContext> =
            mockDeep<VortexExtensionContext>();

          mockVortexExtensionContext.api.showDialog
            .calledWith(notEmpty(), notEmpty(), notEmpty(), notEmpty())
            .mockReturnValue(Promise.resolve(true));

          const wrappedInstall = wrapInstall(
            mockVortexExtensionContext,
            { log: getMockVortexLog },
            internalPipelineInstaller,
          );

          const expectation = expect(
            wrappedInstall(mod.inFiles, FAKE_STAGING_PATH, GAME_ID, null),
          );

          await expectation.rejects.toThrowError(new Error(mod.failure));
        }); // t
      }); // fE
    }); // d
  }); // fE
});

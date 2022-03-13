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

const mockFs = require("mock-fs");

describe("Transforming modules to instructions", () => {
  beforeEach(() =>
    mockFs({
      unno: {
        why: {
          this: {
            "mymegamod-43335455-wth-1": {
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
              FAKE_STAGING_PATH,
              null,
              null,
            ),
          ).rejects.toThrowError(mod.failure);
        });
      });
    });
  });

  describe("Verifying that the fallback is last in the pipeline", () => {
    const fallbackInstaller = getFallbackInstaller();
  });
  // describe("fallback for anything that doesn't match other installers", () => {
  //   const fallbackInstaller = getFallbackInstaller();

  //   AllModTypes.forEach((type) => {
  //     type.forEach(async (mod, desc) => {
  //       test(`doesn’t produce any instructions handled by specific installers when ${desc}`, async () => {
  //         const installResult = await fallbackInstaller.install(
  //           mockVortexAPI,
  //           mockVortexLog,
  //           mod.inFiles,
  //           FAKE_STAGING_PATH,
  //           null,
  //           null,
  //         );

  //         expect(installResult.instructions).toEqual([]);
  //       });
  //     });
  //   });
  // });
});

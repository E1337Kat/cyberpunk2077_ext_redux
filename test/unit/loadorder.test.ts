import path from "path";
// import * as mockedVortexApi from "vortex-api";
import mockFs from "mock-fs";
import {
  isLeft,
  isRight,
} from "fp-ts/lib/Either";
import {
  encodeLoadOrder,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
  ModsDotJson,
  encodeModsDotJsonLoadOrder,
  decodeModsDotJsonLoadOrder,
  V100LoadOrder,
  decodeAndMigrateLoadOrder,
} from "../../src/load_order.types";
import {
  loadOrderToREDdeployRunParameters,
  makeModsDotJsonLoadOrderFrom,
  makeV2077LoadOrderFrom,
  maybeCompilableMod,
  pruneToSparseLoadOrder,
  rebuildModsDotJsonLoadOrder,
} from "../../src/load_order";
import {
  REDdeployManual,
} from "../../src/tools.redmodding";
import {
  VortexRunParameters,
} from "../../src/vortex-wrapper";
import {
  REDMODDING_RTTI_METADATA_FILE_PATH,
} from "../../src/redmodding.metadata";

import * as loTestData from "./loadorder.example";
import {
  getMockVortexLog,
} from "./utils.helper";
import {
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_BASEDIR,
  REDMOD_CUSTOMSOUNDS_DIRNAME,
  REDMOD_INFO_FILENAME,
  REDMOD_SCRIPTS_DIRNAME,
  REDMOD_TWEAKS_DIRNAME,
} from "../../src/installers.layouts";

import {
  jsonpp,
} from "../../src/util.functions";
import {
  REDmodInfo,
} from "../../src/installers.types";
import {
  myREDmodInfoJson,
} from "./mods.example.redmod";

const FAKE_GAMEDIR_PATH = `C:\\fake\\gamedir`;

const tweakREDmodInfo: REDmodInfo = {
  name: `Tweaking for Tweaks`,
  version: `1.4`,
};
const tweakREDmodInfoJson = jsonpp(tweakREDmodInfo);

const scriptREDmodInfo: REDmodInfo = {
  name: `Script kiddies plusplus`,
  version: `1.4`,
};
const scriptREDmodInfoJson = jsonpp(scriptREDmodInfo);

const soundREDmodInfo: REDmodInfo = {
  name: `Awesome sound mod les gooooo`,
  version: `1.4`,
  customSounds: [
    {
      name: `cool_sound`,
      type: `mod_sfx_2d`,
      file: `cool_sound.wav`,
      gain: 1.0,
      pitch: 0.1,
    },
  ],
};
const soundREDmodInfoJson = jsonpp(soundREDmodInfo);


const fileSystem =
  {
    [FAKE_GAMEDIR_PATH]: {
      [REDMOD_BASEDIR]: {
        [`Tweaking for Tweaks`]: {
          [REDMOD_INFO_FILENAME]: tweakREDmodInfoJson,
          [REDMOD_TWEAKS_DIRNAME]: {
            [`base`]: {
              [`gameplay`]: {
                [`static_data`]: {
                  [`tweak_tweak_baby.tweak`]: ``,
                },
              },
            },
          },
        },
        [`#POPPY DRESS (V2077 Autoconverted)`]: {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          [REDMOD_ARCHIVES_DIRNAME]: {
            [`meow.archive`]: ``,
          },
        },
        [`ScriptKitties`]: {
          [REDMOD_INFO_FILENAME]: scriptREDmodInfoJson,
          [REDMOD_SCRIPTS_DIRNAME]: {
            [`exec`]: {
              [`cool_scripts.script`]: ``,
            },
          },
        },
        [`AuskaWorks - Guinevere's Always-On Chrome`]: {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          [REDMOD_ARCHIVES_DIRNAME]: {
            [`meow.archive`]: ``,
          },
        },
        [`Better_Apartment_Views`]: {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          [REDMOD_ARCHIVES_DIRNAME]: {
            [`meow.archive`]: ``,
          },
        },
        [`PanamRomancedEnhanced`]: {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          [REDMOD_ARCHIVES_DIRNAME]: {
            [`meow.archive`]: ``,
          },
        },
        [`PanamRomancedEnhancedPrivacy`]: {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          [REDMOD_ARCHIVES_DIRNAME]: {
            [`meow.archive`]: ``,
          },
        },
        [`AwesomeSound`]: {
          [REDMOD_INFO_FILENAME]: soundREDmodInfoJson,
          [REDMOD_CUSTOMSOUNDS_DIRNAME]: {
            [`cool_sound.wav`]: ``,
          },
        },
      },
    },
  };

describe(`Load Order`, () => {
  beforeEach(() => {
    mockFs(fileSystem);
  });
  afterEach(() => { mockFs.restore(); });


  describe(`Types and Serialization`, () => {
    test(`LoadOrder encodes and decodes roundtrip`, () => {
      const loadOrder: LoadOrder = {
        loadOrderFormatVersion: LOAD_ORDER_TYPE_VERSION,
        ownerVortexProfileId: `testprofileid`,
        generatedAt: `2021-01-01T00:00:00.000Z`,
        entriesInOrderWithEarlierWinning: [
          {
            vortexId: `testvortexid`,
            vortexModId: `testvortexmodid`,
            vortexModVersion: `testvortexmodversion`,
            redmodName: `testredmodname`,
            redmodVersion: `testredmodversion`,
            redmodPath: `testredmodpath`,
            enabled: true,
            modsDotJsonEntry: {
              folder: `testredmodpath`,
              enabled: true,
              deployed: true,
              deployedVersion: `testredmodversion`,
              customSounds: [{
                name: `testmodSound`,
                type: `mod_skip`,
              }],
            },
          },
        ],
      };

      const encoded = encodeLoadOrder(loadOrder);

      const decoded = decodeAndMigrateLoadOrder(encoded);

      if (isLeft(decoded)) {
        throw decoded.left;
      }

      expect(decoded.right).toEqual(loadOrder);
    });

    test(`Old Load Order is migrated to current`, () => {
      const v100loadOrder: V100LoadOrder = {
        loadOrderFormatVersion: `1.0.0`,
        ownerVortexProfileId: `testprofileid`,
        generatedAt: `2021-01-01T00:00:00.000Z`,
        entriesInOrderWithEarlierWinning: [
          {
            vortexId: `testvortexid`,
            vortexModId: `testvortexmodid`,
            vortexModVersion: `testvortexmodversion`,
            redmodName: `testredmodname`,
            redmodVersion: `testredmodversion`,
            redmodPath: `testredmodpath`,
            enabled: true,
          },
        ],
      };

      const v100Entry = v100loadOrder.entriesInOrderWithEarlierWinning[0];

      const expectedCurrentLO: LoadOrder = {
        ...v100loadOrder,
        loadOrderFormatVersion: LOAD_ORDER_TYPE_VERSION,
        entriesInOrderWithEarlierWinning: [
          {
            ...v100Entry,
            modsDotJsonEntry: {
              folder: path.basename(v100Entry.redmodPath),
              enabled: v100Entry.enabled,
              deployed: true,
              deployedVersion: v100Entry.redmodVersion,
              customSounds: [],
            },
          },
        ],
      };

      const encoded = jsonpp(v100loadOrder);

      const decoded = decodeAndMigrateLoadOrder(encoded);

      if (isLeft(decoded)) {
        throw decoded.left;
      }

      expect(decoded.right).toEqual(expectedCurrentLO);
    });

    test(`Load Order decoding fails if not current nor migratable version`, () => {
      const junk = jsonpp({ yay: 3 });

      const decoded = decodeAndMigrateLoadOrder(junk);

      if (isRight(decoded)) {
        throw new Error(`Expected decoding to fail`);
      }
    });

    test(`ModsDotJson encodes and decodes roundtrip`, () => {
      const loadOrder: ModsDotJson = {
        mods: [
          {
            folder: `testredmodpath`,
            enabled: true,
            deployed: true,
            deployedVersion: `testredmodversion`,
            customSounds: [{
              name: `testmodSound`,
              type: `mod_skip`,
            }],
          },
        ],
      };

      const encoded = encodeModsDotJsonLoadOrder(loadOrder);

      const decoded = decodeModsDotJsonLoadOrder(encoded);

      if (isLeft(decoded)) {
        throw decoded.left;
      }

      expect(decoded.right).toEqual(loadOrder);
    });

  }); // Types and Serialization


  describe(`Vortex load order to v2077 load order mapping`, () => {

    test(`makeV2077LoadOrderFrom Vortex load order does exactly that`, () => {
      const fakeDate = Date.now();
      const expectedDateString = new Date(fakeDate).toISOString();

      const fakeOwnerVortexProfileId = `xyZzyZx`;

      const { vortexLoadOrder } = loTestData;

      const expectedV2077LoadOrder: LoadOrder = {
        ...loTestData.v2077LoadOrder,
        generatedAt: expectedDateString,
      };

      const generatedV2077LoadOrder =
        makeV2077LoadOrderFrom(vortexLoadOrder, fakeOwnerVortexProfileId, fakeDate);

      expect(generatedV2077LoadOrder).toEqual(expectedV2077LoadOrder);
    });

    test(`makeModsDotJsonLoadOrderFrom Vortex load order does exactly that`, () => {
      const { vortexLoadOrder } = loTestData;

      const expectedV2077LoadOrder: ModsDotJson = {
        ...loTestData.savedModsDotJsonLoadOrder,
      };

      const generatedV2077LoadOrder =
      makeModsDotJsonLoadOrderFrom(vortexLoadOrder);

      expect(generatedV2077LoadOrder).toEqual(expectedV2077LoadOrder);
    });

  }); // Load Order Mapping


  describe(`REDdeploy parameter generation`, () => {
    describe(`maybeCompilableMod()`, () => {
      describe(`when compilable redmod`, () => {
        test(`should be compilable `, async () => {
          const scriptkitty = {
            vortexId: `Script kiddies plusplus-345345-2-4-8-1663254950`,
            vortexModId: `345345`,
            vortexModVersion: `2.4.8`,
            redmodName: `Script kiddies plusplus`,
            redmodVersion: `1.4`,
            redmodPath: `mods\\ScriptKitties`,
            enabled: true,
            modsDotJsonEntry: {
              folder: `ScriptKitties`,
              enabled: true,
              deployed: true,
              deployedVersion: `1.4`,
              customSounds: [],
            },
          };

          const actual = await maybeCompilableMod({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, scriptkitty);

          expect(actual).toBeTruthy();
        });
      });

      describe(`when non-compilable redmod`, () => {
        test(`should be non compilable `, async () => {
          const someRedmodPath = {
            vortexId: `redmod version-5401-1-e3-1664115429`,
            vortexModId: `5401`,
            vortexModVersion: `1.e3`,
            redmodName: `Better_Apartment_Views`,
            redmodVersion: `1.e3`,
            redmodPath: `mods\\Better_Apartment_Views`,
            enabled: true,
            modsDotJsonEntry: {
              folder: `Better_Apartment_Views`,
              enabled: true,
              deployed: true,
              deployedVersion: `1.e3`,
              customSounds: [],
            },
          };

          const actual = await maybeCompilableMod({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, someRedmodPath);

          expect(actual).toBeFalsy();
        });
      });

      describe(`when non-existant`, () => {
        test(`should produce valid error`, async () => {
          const someRedmodPath = {
            vortexId: `nothing`,
            vortexModId: `5401`,
            vortexModVersion: `1`,
            redmodName: `Nothing`,
            redmodVersion: `1`,
            redmodPath: `mods\\not_a_prespecified_mod`,
            enabled: true,
            modsDotJsonEntry: {
              folder: `not_a_prespecified_mod`,
              enabled: true,
              deployed: true,
              deployedVersion: `1`,
              customSounds: [],
            },
          };

          const actual = await maybeCompilableMod({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, someRedmodPath);

          expect(actual).toBeFalsy();
        });
      });

    });

    describe(`pruneToSparseLoadOrder()`, () => {

      describe(`when prunable LO exists`, () => {
        const expected = loTestData.v2077CompilableLoadOrder;

        test(`does not equal the previous`, async () => {

          mockFs(fileSystem);
          const actual: LoadOrder =
            await pruneToSparseLoadOrder({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, loTestData.v2077LoadOrder);
          expect(actual).not.toEqual(loTestData.v2077LoadOrder);
          mockFs.restore();
        });

        test(`gets pruned`, async () => {
          const actual: LoadOrder =
            await pruneToSparseLoadOrder({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, loTestData.v2077LoadOrder);
          expect(actual).toEqual(expected);
        });
      });

      describe(`when not pruneable`, () => {
        const expected = loTestData.v2077CompilableLoadOrder;

        test(`is not different`, async () => {
          const actual: LoadOrder =
            await pruneToSparseLoadOrder({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, expected);
          expect(actual).toEqual(expected);
        });
      });
    });

    describe(`loadOrderToREDdeployRunParameters()`, () => {

      test(`does not use unecessary amount of mods`, async () => {
        const v2077LoadOrderToDeploy =
          await pruneToSparseLoadOrder({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, loTestData.v2077LoadOrder);

        const expectedRedDeployParameters: VortexRunParameters = {
          executable: `${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`,
          args: [
            `deploy`,
            `-force`,
            `-rttiSchemaFile=`,
            `"${path.join(`${FAKE_GAMEDIR_PATH}\\${REDMODDING_RTTI_METADATA_FILE_PATH}`)}"`,
            `-mod=`,
            `"Tweaking for Tweaks"`,
            `"#POPPY DRESS (V2077 Autoconverted)"`,
            `"ScriptKitties"`,
            `"AuskaWorks - Guinevere's Always-On Chrome"`,
            `"Better_Apartment_Views"`,
            `"PanamRomancedEnhanced"`,
            `"PanamRomancedEnhancedPrivacy"`,
            `"AwesomeSound"`,
          ],
          options: {
            cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
            shell: false,
            detach: false,
            expectSuccess: true,
          },
        };

        const redDeployParamsGenerated =
          loadOrderToREDdeployRunParameters(FAKE_GAMEDIR_PATH, v2077LoadOrderToDeploy);

        expect(redDeployParamsGenerated).not.toEqual(expectedRedDeployParameters);
      });

      test(`produces sparse parameter list only`, async () => {

        const v2077LoadOrderToDeploy =
          await pruneToSparseLoadOrder({ log: getMockVortexLog() }, FAKE_GAMEDIR_PATH, loTestData.v2077LoadOrder);

        const expectedRedDeployParameters: VortexRunParameters = {
          executable: `${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`,
          args: [
            `deploy`,
            `-force`,
            `-rttiSchemaFile=`,
            `"${path.join(`${FAKE_GAMEDIR_PATH}\\${REDMODDING_RTTI_METADATA_FILE_PATH}`)}"`,
            `-mod=`,
            `"Tweaking for Tweaks"`,
            `"ScriptKitties"`,
            `"AwesomeSound"`,
          ],
          options: {
            cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
            shell: false,
            detach: false,
            expectSuccess: true,
          },
        };

        const redDeployParamsGenerated =
          loadOrderToREDdeployRunParameters(FAKE_GAMEDIR_PATH, v2077LoadOrderToDeploy);

        expect(redDeployParamsGenerated).toEqual(expectedRedDeployParameters);
      });

      test(`produces correct parameters to run default REDdeploy if no mods in LO`, () => {

        const noModsInLoadOrder: LoadOrder = {
          ...loTestData.v2077LoadOrder,
          entriesInOrderWithEarlierWinning: [],
        };

        const expectedRedDeployParameters: VortexRunParameters = {
          executable: `${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`,
          args: [
            `deploy`,
            `-force`,
            `-rttiSchemaFile=`,
            `"${path.join(`${FAKE_GAMEDIR_PATH}\\${REDMODDING_RTTI_METADATA_FILE_PATH}`)}"`,
          ],
          options: {
            cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
            shell: false,
            detach: false,
            expectSuccess: true,
          },
        };

        const redDeployParamsGenerated =
          loadOrderToREDdeployRunParameters(FAKE_GAMEDIR_PATH, noModsInLoadOrder);

        expect(redDeployParamsGenerated).toEqual(expectedRedDeployParameters);
      });

    });

  }); // Load Order

  describe(`Merging mods.json with full LO`, () => {

    test(`merges together the mods.json preferring the deployed listing`, () => {
      const expectedV2077LoadOrder: ModsDotJson = {
        ...loTestData.rebuiltModsDotJsonLoadOrder,
      };

      const generatedModsDotJsonLoadOrder =
      rebuildModsDotJsonLoadOrder(
        { log: getMockVortexLog() },
        loTestData.savedModsDotJsonLoadOrder.mods,
        loTestData.deployedModsDotJsonLoadOrder.mods,
      );

      expect(generatedModsDotJsonLoadOrder).toEqual(expectedV2077LoadOrder);

    });
  }); // Rebuild mods.json

}); // Load Order

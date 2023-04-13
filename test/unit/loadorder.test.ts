import path from "path";
// import * as mockedVortexApi from "vortex-api";
import mockFs from "mock-fs";
import {
  isLeft,
} from "fp-ts/lib/Either";
import {
  decodeLoadOrder,
  encodeLoadOrder,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
  ModsDotJson,
  encodeModsDotJsonLoadOrder,
  decodeModsDotJsonLoadOrder,
} from "../../src/load_order.types";
import {
  loadOrderToREDdeployRunParameters,
  makeModsDotJsonLoadOrderFrom,
  makeV2077LoadOrderFrom,
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
  mockedFsLayout,
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
import { myREDmodInfoJson } from "./mods.example.redmod";

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


const fileSystem = mockedFsLayout(
  {
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
);

describe(`Load Order`, () => {

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

      const decoded = decodeLoadOrder(encoded);

      if (isLeft(decoded)) {
        throw decoded.left;
      }

      expect(decoded.right).toEqual(loadOrder);
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
        ...loTestData.modsDotJsonLoadOrder,
      };

      const generatedV2077LoadOrder =
      makeModsDotJsonLoadOrderFrom(vortexLoadOrder);

      expect(generatedV2077LoadOrder).toEqual(expectedV2077LoadOrder);
    });

  });


  describe(`REDdeploy parameter generation`, () => {
    beforeEach(() => { mockFs.restore(); });
    afterEach(() => { mockFs.restore(); });

    test(`does not use unecessary amount of mods`, () => {
      mockFs.restore();
      mockFs(fileSystem);

      const v2077LoadOrderToDeploy = loTestData.v2077LoadOrder;
      const expectedRedDeployParameters: VortexRunParameters = {
        executable: `${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`,
        args: [
          `deploy`,
          `-force`,
          `-root=`,
          `"${FAKE_GAMEDIR_PATH}"`,
          `-rttiSchemaFile=`,
          `"${path.join(`${FAKE_GAMEDIR_PATH}\\${REDMODDING_RTTI_METADATA_FILE_PATH}`)}"`,
          `-mod=`,
          `"#POPPY DRESS (V2077 Autoconverted)"`,
          `"AuskaWorks - Guinevere's Always-On Chrome"`,
          `"Better_Apartment_Views"`,
          `"PanamRomancedEnhanced"`,
          `"PanamRomancedEnhancedPrivacy"`,
        ],
        options: {
          cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
          shell: false,
          detach: true,
          expectSuccess: true,
        },
      };

      const redDeployParamsGenerated =
        loadOrderToREDdeployRunParameters(FAKE_GAMEDIR_PATH, v2077LoadOrderToDeploy);

      expect(redDeployParamsGenerated).not.toEqual(expectedRedDeployParameters);
    });

    test(`produces sparse parameter list only`, () => {
      mockFs.restore();
      mockFs(fileSystem);

      const v2077LoadOrderToDeploy = loTestData.v2077LoadOrder;
      const expectedRedDeployParameters: VortexRunParameters = {
        executable: `${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`,
        args: [
          `deploy`,
          `-force`,
          `-root=`,
          `"${FAKE_GAMEDIR_PATH}"`,
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
          detach: true,
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
          `-root=`,
          `"${FAKE_GAMEDIR_PATH}"`,
          `-rttiSchemaFile=`,
          `"${path.join(`${FAKE_GAMEDIR_PATH}\\${REDMODDING_RTTI_METADATA_FILE_PATH}`)}"`,
        ],
        options: {
          cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
          shell: false,
          detach: true,
          expectSuccess: true,
        },
      };

      const redDeployParamsGenerated =
        loadOrderToREDdeployRunParameters(FAKE_GAMEDIR_PATH, noModsInLoadOrder);

      expect(redDeployParamsGenerated).toEqual(expectedRedDeployParameters);
    });

  }); // Load Order

}); // Load Order

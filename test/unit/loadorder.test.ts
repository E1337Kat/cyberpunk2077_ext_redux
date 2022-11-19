import path from "path";
// import * as mockedVortexApi from "vortex-api";
import {
  isLeft,
} from "fp-ts/lib/Either";
import {
  decodeLoadOrder,
  encodeLoadOrder,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
} from "../../src/load_order.types";
import {
  loadOrderToREDdeployRunParameters,
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

const FAKE_GAMEDIR_PATH = `C:\\fake\\gamedir`;


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

  });


  describe(`REDdeploy parameter generation`, () => {

    test(`produces correctly formatted parameter list with all necessary parameters`, () => {

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
          shell: true,
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
          shell: true,
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

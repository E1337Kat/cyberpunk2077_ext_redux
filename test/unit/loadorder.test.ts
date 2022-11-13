import path from "path";
// import * as mockedVortexApi from "vortex-api";
import { isLeft } from "fp-ts/lib/Either";
import {
  decodeLoadOrder,
  encodeLoadOrder,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
} from "../../src/load_order.types";
import { loadOrderToREDdeployRunParameters } from "../../src/load_order";

import { REDmodManualDeploy } from "../../src/redmodding";
import { VortexRunParameters } from "../../src/vortex-wrapper";
import { REDMODDING_RTTI_METADATA_FILE_PATH } from "../../src/redmodding.metadata";

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

  describe(`REDdeploy parameter generation`, () => {

    test(`produces correctly formatted parameter list with all necessary parameters`, () => {

      const v2077LoadOrderToDeploy = loTestData.v2077LoadOrder;
      const expectedRedDeployParameters: VortexRunParameters = {
        executable: `${FAKE_GAMEDIR_PATH}\\${REDmodManualDeploy.executable()}`,
        args: [
          `deploy`,
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
          cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDmodManualDeploy.executable()}`),
          shell: true,
        },
      };

      const redDeployParamsGenerated =
        loadOrderToREDdeployRunParameters(FAKE_GAMEDIR_PATH, v2077LoadOrderToDeploy);

      expect(redDeployParamsGenerated).toEqual(expectedRedDeployParameters);
    });

  }); // Load Order

}); // Load Order

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
  ModList,
} from "../../src/load_order.types";
import {
  loadOrderToREDdeployModList,
  makeV2077LoadOrderFrom,
  redmodDeployRunParameters,
} from "../../src/load_order";
import {
  REDdeployManual,
} from "../../src/tools.redmodding";
import {
  VortexRunParameters,
} from "../../src/vortex-wrapper";
import {
  REDMODDING_RTTI_METADATA_FILE_PATH,
  V2077_MODLIST_PATH,
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
          `-modlist=`,
          `"${path.join(FAKE_GAMEDIR_PATH, V2077_MODLIST_PATH)}`,
        ],
        options: {
          cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
          shell: true,
          detach: true,
          expectSuccess: true,
        },
      };
      const expectedModList: ModList = loTestData.v2077ModList;

      const redDeployParamsGenerated =
        redmodDeployRunParameters(FAKE_GAMEDIR_PATH);

      expect(redDeployParamsGenerated).toEqual(expectedRedDeployParameters);

      const redDeployModListGenerated =
        loadOrderToREDdeployModList(v2077LoadOrderToDeploy);

      expect(redDeployModListGenerated).toEqual(expectedModList);
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
          `-modlist=`,
          `"${path.join(FAKE_GAMEDIR_PATH, V2077_MODLIST_PATH)}`,
        ],
        options: {
          cwd: path.dirname(`${FAKE_GAMEDIR_PATH}\\${REDdeployManual.executable()}`),
          shell: true,
          detach: true,
          expectSuccess: true,
        },
      };

      const expectedModList: ModList = loTestData.emptyV2077ModList;

      const redDeployParamsGenerated =
        redmodDeployRunParameters(FAKE_GAMEDIR_PATH);

      expect(redDeployParamsGenerated).toEqual(expectedRedDeployParameters);

      const redDeployModListGenerated =
        loadOrderToREDdeployModList(noModsInLoadOrder);

      expect(redDeployModListGenerated).toEqual(expectedModList);
    });

  }); // Load Order

}); // Load Order

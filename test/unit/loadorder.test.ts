// import * as mockedVortexApi from "vortex-api";
import {
  isLeft,
} from "fp-ts/lib/Either";
import {
  none,
  some,
} from "fp-ts/lib/Option";
import {
  mockedActiveProfile,
} from "@vortex-api-test-shimmed";
import {
  ARCHIVE_LOAD_ORDER_ID,
  decodeLoadOrder,
  encodeLoadOrder,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
  ModList,
  REDMOD_LOAD_ORDER_ID,
} from "../../src/load_order.types";
import {
  loadOrderToREDdeployModList,
  makeV2077LoadOrderFrom,
} from "../../src/load_order";
import {
  loadOrderFromVortexState,
} from "../../src/load_order.functions";
import {
  VortexState,
} from "../../src/vortex-wrapper";

import * as loTestData from "./loadorder.example";


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


  describe(`REDdeploy modlist generation`, () => {

    test(`lists the enabled mods in load order`, () => {

      const expectedModList: ModList = loTestData.v2077ModList;

      const redDeployModListGenerated =
        loadOrderToREDdeployModList(loTestData.v2077LoadOrder);

      expect(redDeployModListGenerated).toEqual(expectedModList);
    });

    test(`is empty when the load order has no mods`, () => {

      const noModsInLoadOrder: LoadOrder = {
        ...loTestData.v2077LoadOrder,
        entriesInOrderWithEarlierWinning: [],
      };

      const expectedModList: ModList = loTestData.emptyV2077ModList;

      const redDeployModListGenerated =
        loadOrderToREDdeployModList(noModsInLoadOrder);

      expect(redDeployModListGenerated).toEqual(expectedModList);
    });

  }); // Load Order


  describe(`REDmod load order in Vortex state`, () => {

    const legacyOrder = loTestData.vortexLoadOrder.slice(0, 1);
    const namedOrder = loTestData.vortexLoadOrder.slice(1, 2);

    const stateWith = (persistent: object): VortexState =>
      ({ persistent } as unknown as VortexState);

    test(`reads the named REDmod load order when Vortex keeps one`, () => {
      const vortexState = stateWith({
        loadOrder: { [mockedActiveProfile.id]: legacyOrder },
        loadOrders: { [mockedActiveProfile.id]: { [REDMOD_LOAD_ORDER_ID]: namedOrder } },
      });

      expect(loadOrderFromVortexState(vortexState, mockedActiveProfile)).toEqual(some(namedOrder));
    });

    test(`reads the profile's load order when Vortex keeps no named REDmod order`, () => {
      const vortexState = stateWith({
        loadOrder: { [mockedActiveProfile.id]: legacyOrder },
        loadOrders: { [mockedActiveProfile.id]: { [ARCHIVE_LOAD_ORDER_ID]: namedOrder } },
      });

      expect(loadOrderFromVortexState(vortexState, mockedActiveProfile)).toEqual(some(legacyOrder));
    });

    test(`reads the profile's load order on a Vortex without named load orders`, () => {
      const vortexState = stateWith({ loadOrder: { [mockedActiveProfile.id]: legacyOrder } });

      expect(loadOrderFromVortexState(vortexState, mockedActiveProfile)).toEqual(some(legacyOrder));
    });

    test(`is empty when the profile has no load order`, () => {
      expect(loadOrderFromVortexState(stateWith({}), mockedActiveProfile)).toEqual(none);
    });

  }); // REDmod load order in Vortex state

}); // Load Order

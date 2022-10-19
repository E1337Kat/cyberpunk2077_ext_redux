import { isLeft } from 'fp-ts/lib/Either';
import {
  decodeLoadOrder,
  encodeLoadOrder,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
} from '../../src/load_order.types';

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

}); // Load Order

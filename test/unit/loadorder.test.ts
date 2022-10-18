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
        typeVersion: LOAD_ORDER_TYPE_VERSION,
        generatedAt: `2021-01-01T00:00:00.000Z`,
        entriesInOrderWithEarlierWinning: [
          {
            id: `test`,
            version: `1.0.0`,
            displayName: `Test`,
            enabledInVortex: true,
            modId: `5555`,
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

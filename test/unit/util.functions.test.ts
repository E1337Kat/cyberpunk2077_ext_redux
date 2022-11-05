import { nestedRecordFrom } from "../../src/util.functions";

describe(`Utility functions`, () => {

  describe(`nestedRecordsFrom()`, () => {

    test(`produces expected record from list of keys`, () => {
      const keys = [`a`, `b`, `c`];

      const nested = nestedRecordFrom(keys);

      expect(nested).toEqual({
        a: {
          b: {
            c: {},
          },
        },
      });
    });

    test(`produces expected record from list of keys, with optional innermost record as given`, () => {
      const keys = [`a`, `b`, `c`];

      const nested = nestedRecordFrom(keys, { d: `e` });

      expect(nested).toEqual({
        a: {
          b: {
            c: {
              d: `e`,
            },
          },
        },
      });
    });
  });
});

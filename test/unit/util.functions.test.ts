import {
  runInNewContext,
} from "node:vm";
import {
  getErrorCode,
  nestedRecordFrom,
} from "../../src/util.functions";

describe(`Utility functions`, () => {

  describe(`getErrorCode()`, () => {

    test(`reads the code of an error`, () => {
      expect(getErrorCode(Object.assign(new Error(`gone`), { code: `ENOENT` }))).toBe(`ENOENT`);
    });

    test(`reads the code of an error raised in another realm`, () => {
      const errorFromAnotherRealm = runInNewContext(`Object.assign(new Error("gone"), { code: "ENOENT" })`);

      expect(getErrorCode(errorFromAnotherRealm)).toBe(`ENOENT`);
    });

    test.each([
      [`an error without a code`, new Error(`no code`)],
      [`a numeric code`, Object.assign(new Error(`numeric`), { code: 2 })],
      [`a string`, `ENOENT`],
      [`nothing`, undefined],
    ])(`is null for %s`, (_description, caught) => {
      expect(getErrorCode(caught)).toBeNull();
    });

  });

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

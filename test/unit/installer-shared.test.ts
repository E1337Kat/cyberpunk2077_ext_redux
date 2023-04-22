import path from "path";
import mock from "mock-fs";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  mapLeft,
  map,
} from "fp-ts/lib/Either";
import {
  dirFromDisk,
  dirFromDiskTE,
} from "../../src/installers.shared";

describe(`Filesystem abstraction functions`, () => {
  beforeEach(() => {
    // use very simple mock structure
    mock({
      a: {
        b: `c`,
        d: {},
      },
    });
  });
  afterEach(() => { mock.restore(); });

  describe(`await dirFromDisk()`, () => {
    test(`produces expected dir contents`, async () => {
      const { Dirent, constants } = jest.requireActual(`fs`);
      const somePath = path.join(`a`);

      const directory = new Dirent(`b`, constants.UV_DIRENT_DIR);
      const file = new Dirent(`d`, constants.UV_DIRENT_FILE);
      const expected = [directory, file];


      const actual = await dirFromDisk({ relativePath: somePath, pathOnDisk: somePath })();

      expect(actual.map((val) => val.entry.name)).toEqual(expected.map((val) => val.name));
    });
  });

  describe(`await dirFromDiskTE()`, () => {
    test(`produces expected dir contents`, async () => {
      const { Dirent, constants } = jest.requireActual(`fs`);
      const somePath = path.join(`a`);

      const directory = new Dirent(`b`, constants.UV_DIRENT_DIR);
      const file = new Dirent(`d`, constants.UV_DIRENT_FILE);
      const expected = [directory, file];

      const actual = await dirFromDiskTE({ relativePath: somePath, pathOnDisk: somePath })();

      pipe(
        actual,
        mapLeft((e) => {
          expect(e).toBeNull();
        }),
        map((dirs) => {
          expect(dirs.map((val) => val.entry.name)).toEqual(expected.map((val) => val.name));
        }),
      );
    });
    test(`gives error on unreadable`, async () => {
      const somePath = path.join(`not`, `existant`, ``);
      const actual = await dirFromDiskTE({ relativePath: somePath, pathOnDisk: somePath })();
      const expectedReadError = `Error: ENOENT, no such file or directory`;

      pipe(
        actual,
        mapLeft((e) => {
          expect(e.message).toMatch(`Failed to read directory ${somePath} (on disk ${somePath}): ${expectedReadError}`);
        }),
        map((dirs) => {
          expect(dirs).toBeNull();
        }),
      );
    });
  });
});

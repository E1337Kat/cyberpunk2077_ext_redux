import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  tmpdir,
} from "node:os";
import {
  join,
} from "node:path";
import {
  archiveLoadOrderFrom,
  modListFor,
  readArchiveLoadOrder,
  readDefaultArchiveLoadOrder,
  writeArchiveModList,
} from "../../src/load_order.archive";
import {
  VortexLoadOrderEntry,
} from "../../src/vortex-wrapper";
import {
  RUNNING_WITH_WIN32_PATH_SHIM,
} from "./utils.helper";

const archiveEntry = (fileName: string, modId?: string): VortexLoadOrderEntry => ({
  id: fileName,
  name: fileName,
  enabled: true,
  modId,
});

const idsOf = (loadOrder: readonly { id: string }[]): string[] =>
  loadOrder.map((entry) => entry.id);

describe(`Archive load order`, () => {

  describe(`archiveLoadOrderFrom`, () => {
    test(`orders the archives ASCII-alphabetically without a modlist`, () => {
      const loadOrder = archiveLoadOrderFrom([`b.archive`, `a.archive`, `A.archive`], undefined, {});

      expect(idsOf(loadOrder)).toEqual([`A.archive`, `a.archive`, `b.archive`]);
    });

    test(`puts the listed archives first in modlist order, then the rest ASCII-alphabetically`, () => {
      const loadOrder = archiveLoadOrderFrom(
        [`a.archive`, `b.archive`, `c.archive`, `d.archive`],
        [`c.archive`, `a.archive`],
        {},
      );

      expect(idsOf(loadOrder)).toEqual([`c.archive`, `a.archive`, `b.archive`, `d.archive`]);
    });

    test(`matches modlist names regardless of case and skips archives that are gone`, () => {
      const loadOrder = archiveLoadOrderFrom(
        [`bar.archive`, `Foo.archive`],
        [`gone.archive`, `foo.archive`],
        {},
      );

      expect(idsOf(loadOrder)).toEqual([`Foo.archive`, `bar.archive`]);
    });

    test(`names the Vortex mod each archive was deployed from`, () => {
      const loadOrder = archiveLoadOrderFrom(
        [`Managed.archive`, `unmanaged.archive`],
        undefined,
        { "managed.archive": `vortex-mod-1` },
      );

      expect(loadOrder).toEqual([
        archiveEntry(`Managed.archive`, `vortex-mod-1`),
        archiveEntry(`unmanaged.archive`),
      ]);
    });
  });

  describe(`modListFor`, () => {
    test(`needs no modlist for ASCII-alphabetical order`, () => {
      const loadOrder = [archiveEntry(`A.archive`), archiveEntry(`a.archive`), archiveEntry(`b.archive`)];

      expect(modListFor(loadOrder)).toBeUndefined();
    });

    test(`lists every archive in load order once the order differs`, () => {
      const loadOrder = [archiveEntry(`b.archive`), archiveEntry(`a.archive`), archiveEntry(`c.archive`)];

      expect(modListFor(loadOrder)).toEqual([`b.archive`, `a.archive`, `c.archive`]);
    });
  });

  // Real files in a temp dir, which the win32 path shim on a posix host can't address.
  (RUNNING_WITH_WIN32_PATH_SHIM ? describe.skip : describe)(`on disk`, () => {
    let archiveModDir: string;

    const placeFiles = async (...fileNames: string[]): Promise<void> => {
      await Promise.all(fileNames.map((fileName) => writeFile(join(archiveModDir, fileName), ``)));
    };

    const modListPath = (): string => join(archiveModDir, `modlist.txt`);

    beforeEach(async () => {
      archiveModDir = join(await mkdtemp(join(tmpdir(), `v2077-archive-`)), `mod`);
      await mkdir(archiveModDir);
    });

    afterEach(async () => {
      await rm(join(archiveModDir, `..`), { recursive: true, force: true });
    });

    test(`reads the archives, leaving out other files, in the order of the modlist`, async () => {
      await placeFiles(`a.archive`, `b.archive`, `c.archive`, `a.archive.xl`);
      await writeFile(modListPath(), `c.archive\r\nb.archive\r\n`);

      expect(idsOf(await readArchiveLoadOrder(archiveModDir, {})))
        .toEqual([`c.archive`, `b.archive`, `a.archive`]);
    });

    test(`reads the default order alphabetically, whatever the modlist says`, async () => {
      await placeFiles(`a.archive`, `b.archive`, `c.archive`);
      await writeFile(modListPath(), `c.archive\r\nb.archive\r\n`);

      expect(idsOf(await readDefaultArchiveLoadOrder(archiveModDir, {})))
        .toEqual([`a.archive`, `b.archive`, `c.archive`]);
    });

    test(`reads no archives when the archive directory is missing`, async () => {
      expect(await readArchiveLoadOrder(join(archiveModDir, `missing`), {})).toEqual([]);
    });

    test(`writes a modlist once the order differs from the default`, async () => {
      await writeArchiveModList(archiveModDir, [archiveEntry(`b.archive`), archiveEntry(`a.archive`)]);

      expect(await readFile(modListPath(), `utf8`)).toBe(`b.archive\r\na.archive`);
      expect(await readdir(archiveModDir)).toEqual([`modlist.txt`]);
    });

    test(`removes the modlist when the order is back to the default`, async () => {
      await writeFile(modListPath(), `b.archive\r\na.archive`);

      await writeArchiveModList(archiveModDir, [archiveEntry(`a.archive`), archiveEntry(`b.archive`)]);

      expect(await readdir(archiveModDir)).toEqual([]);
    });

    test(`leaves no modlist behind for the default order`, async () => {
      await writeArchiveModList(archiveModDir, [archiveEntry(`a.archive`)]);

      expect(await readdir(archiveModDir)).toEqual([]);
    });
  });

}); // Archive load order

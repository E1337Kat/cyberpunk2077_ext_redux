import path from "path";
import {
  isLeft,
  isRight,
} from "fp-ts/lib/Either";
import {
  ARCHIVE_MOD_CANONICAL_PREFIX,
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_BASEDIR,
  REDMOD_INFO_FILENAME,
} from "../../src/installers.layouts";
import {
  REDmodInfoArrayForVortex,
} from "../../src/installers.types";
import {
  applyStagingChanges,
  dirsEmptiedBy,
  FileRelocation,
  looksAutoconvertedByAnOlderVersion,
  planConversionToREDmod,
  planRevertToArchiveMod,
  redmodModuleNameFrom,
  redmodModuleNameNotYetTaken,
  StagingChanges,
  StagingFileOps,
} from "../../src/redmod.conversion";

const archivePath = (...parts: string[]): string =>
  path.join(ARCHIVE_MOD_CANONICAL_PREFIX, ...parts);

const redmodPath = (moduleName: string, ...parts: string[]): string =>
  path.join(REDMOD_BASEDIR, moduleName, ...parts);

const unwrapRight = <L, R>(either: { _tag: string; right?: R; left?: L }): R => {
  if (!isRight(either as never)) {
    throw new Error(`Expected a Right, got: ${JSON.stringify(either)}`);
  }
  return (either as { right: R }).right;
};

const leftMessage = (either: unknown): string => {
  if (!isLeft(either as never)) {
    throw new Error(`Expected a Left, got: ${JSON.stringify(either)}`);
  }
  return ((either as { left: Error }).left).message;
};

describe(`Naming a REDmod module after a mod`, () => {
  test(`keeps a name that's already usable as a directory`, () => {
    expect(unwrapRight(redmodModuleNameFrom(`Panam Romanced Enhanced`)))
      .toEqual(`Panam Romanced Enhanced`);
  });

  test(`replaces dots, which REDmod can't resolve in a module directory`, () => {
    expect(unwrapRight(redmodModuleNameFrom(`Nova LUT 2.1`)))
      .toEqual(`Nova LUT 2_1`);
  });

  test(`replaces path separators and the rest of the reserved set`, () => {
    expect(unwrapRight(redmodModuleNameFrom(`Weathers/Nights: "Redux" <v2>?`)))
      .toEqual(`Weathers_Nights_ _Redux_ _v2__`);
  });

  test(`refuses a name with nothing usable left in it`, () => {
    expect(leftMessage(redmodModuleNameFrom(`   `)))
      .toContain(`Can't build a REDmod name`);
  });
});

describe(`Keeping REDmod module directories unique`, () => {
  test(`leaves a free name alone`, () => {
    expect(redmodModuleNameNotYetTaken(`Nova LUT`, new Set([`Other Mod`])))
      .toEqual(`Nova LUT`);
  });

  test(`numbers a name that's taken`, () => {
    expect(redmodModuleNameNotYetTaken(`Nova LUT`, new Set([`Nova LUT`])))
      .toEqual(`Nova LUT 2`);
  });

  test(`keeps counting past names that are also taken`, () => {
    expect(redmodModuleNameNotYetTaken(`Nova LUT`, new Set([`Nova LUT`, `Nova LUT 2`])))
      .toEqual(`Nova LUT 3`);
  });

  test(`treats names differing only in case as taken, since the filesystem does`, () => {
    expect(redmodModuleNameNotYetTaken(`Nova LUT`, new Set([`nova lut`])))
      .toEqual(`Nova LUT 2`);
  });
});

describe(`Converting an archive mod to a REDmod`, () => {
  test(`moves every archive into the module's archives directory`, () => {
    const plan = unwrapRight(planConversionToREDmod(
      `nova-lut-1`,
      `Nova LUT`,
      `2.1`,
      [archivePath(`nova_lut.archive`), archivePath(`nova_lut_extra.archive`)],
    ));

    expect(plan.changes.relocations).toEqual([
      {
        from: archivePath(`nova_lut.archive`),
        to: redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut.archive`),
      },
      {
        from: archivePath(`nova_lut_extra.archive`),
        to: redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut_extra.archive`),
      },
    ]);
  });

  test(`takes the .xl files along, since a REDmod's archives directory holds those too`, () => {
    const plan = unwrapRight(planConversionToREDmod(
      `xl-mod-1`,
      `ArchiveXL Mod`,
      `1.0`,
      [archivePath(`thing.archive`), archivePath(`thing.xl`)],
    ));

    expect(plan.changes.relocations.map(({ to }) => to)).toEqual([
      redmodPath(`ArchiveXL Mod`, REDMOD_ARCHIVES_DIRNAME, `thing.archive`),
      redmodPath(`ArchiveXL Mod`, REDMOD_ARCHIVES_DIRNAME, `thing.xl`),
    ]);
  });

  test(`preserves subdirectories under the archive prefix`, () => {
    const plan = unwrapRight(planConversionToREDmod(
      `nested-1`,
      `Nested`,
      `1.0`,
      [archivePath(`variant`, `nested.archive`)],
    ));

    expect(plan.changes.relocations).toEqual([{
      from: archivePath(`variant`, `nested.archive`),
      to: redmodPath(`Nested`, REDMOD_ARCHIVES_DIRNAME, `variant`, `nested.archive`),
    }]);
  });

  test(`generates the info.json REDmod needs to see the module`, () => {
    const plan = unwrapRight(planConversionToREDmod(
      `nova-lut-1`,
      `Nova LUT`,
      `2.1`,
      [archivePath(`nova_lut.archive`)],
    ));

    expect(plan.changes.filesToGenerate).toEqual([{
      at: redmodPath(`Nova LUT`, REDMOD_INFO_FILENAME),
      content: JSON.stringify({ name: `Nova LUT`, version: `2.1` }, null, 2),
    }]);
  });

  test(`records the REDmod info the load order reads`, () => {
    const plan = unwrapRight(planConversionToREDmod(
      `nova-lut-1`,
      `Nova LUT`,
      `2.1`,
      [archivePath(`nova_lut.archive`)],
    ));

    expect(plan.redmodInfo).toEqual({
      name: `Nova LUT`,
      version: `2.1`,
      relativePath: redmodPath(`Nova LUT`),
      vortexModId: `nova-lut-1`,
    });
  });

  test(`matches the archive prefix regardless of case, as Windows does`, () => {
    const plan = unwrapRight(planConversionToREDmod(
      `shouty-1`,
      `Shouty`,
      `1.0`,
      [path.join(`Archive`, `PC`, `Mod`, `shouty.archive`)],
    ));

    expect(plan.changes.relocations).toEqual([{
      from: path.join(`Archive`, `PC`, `Mod`, `shouty.archive`),
      to: redmodPath(`Shouty`, REDMOD_ARCHIVES_DIRNAME, `shouty.archive`),
    }]);
  });

  test(`refuses a mod that has anything outside the archive directory`, () => {
    const plan = planConversionToREDmod(
      `mixed-1`,
      `Mixed`,
      `1.0`,
      [archivePath(`mixed.archive`), path.join(`bin`, `x64`, `plugins`, `mixed.dll`)],
    );

    expect(leftMessage(plan)).toContain(`mixed.dll`);
  });

  test(`refuses a readme sitting among the archives, which REDmod wouldn't accept`, () => {
    const plan = planConversionToREDmod(
      `readme-1`,
      `Readme`,
      `1.0`,
      [archivePath(`readme.archive`), archivePath(`readme.txt`)],
    );

    expect(leftMessage(plan)).toContain(`readme.txt`);
  });

  test(`refuses a mod with no archives at all to convert`, () => {
    const plan = planConversionToREDmod(
      `xl-only-1`,
      `XL Only`,
      `1.0`,
      [archivePath(`lonely.xl`)],
    );

    expect(leftMessage(plan)).toContain(`no .archive files`);
  });
});

describe(`Reverting a converted REDmod back to an archive mod`, () => {
  const convertedRedmodInfos: REDmodInfoArrayForVortex = [{
    name: `Nova LUT`,
    version: `2.1`,
    relativePath: redmodPath(`Nova LUT`),
    vortexModId: `nova-lut-1`,
  }];

  test(`puts the archives back where they started`, () => {
    const plan = unwrapRight(planRevertToArchiveMod(
      convertedRedmodInfos,
      [
        redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut.archive`),
        redmodPath(`Nova LUT`, REDMOD_INFO_FILENAME),
      ],
    ));

    expect(plan.changes.relocations).toEqual([{
      from: redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut.archive`),
      to: archivePath(`nova_lut.archive`),
    }]);
  });

  test(`removes the generated info.json`, () => {
    const plan = unwrapRight(planRevertToArchiveMod(
      convertedRedmodInfos,
      [
        redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut.archive`),
        redmodPath(`Nova LUT`, REDMOD_INFO_FILENAME),
      ],
    ));

    expect(plan.changes.filesToDelete).toEqual([redmodPath(`Nova LUT`, REDMOD_INFO_FILENAME)]);
  });

  test(`round-trips a conversion back to exactly the files it started from`, () => {
    const originalFiles = [
      archivePath(`nova_lut.archive`),
      archivePath(`variant`, `nova_lut_alt.archive`),
      archivePath(`nova_lut.xl`),
    ];

    const conversion = unwrapRight(planConversionToREDmod(
      `nova-lut-1`,
      `Nova LUT`,
      `2.1`,
      originalFiles,
    ));

    const filesAfterConversion = [
      ...conversion.changes.relocations.map(({ to }) => to),
      ...conversion.changes.filesToGenerate.map(({ at }) => at),
    ];

    const revert = unwrapRight(planRevertToArchiveMod(
      [conversion.redmodInfo],
      filesAfterConversion,
    ));

    expect(revert.changes.relocations.map(({ to }) => to).sort()).toEqual([...originalFiles].sort());
  });

  test(`refuses a REDmod carrying more than archives, which we never produced`, () => {
    const plan = planRevertToArchiveMod(
      convertedRedmodInfos,
      [
        redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut.archive`),
        redmodPath(`Nova LUT`, `tweaks`, `nova.tweak`),
        redmodPath(`Nova LUT`, REDMOD_INFO_FILENAME),
      ],
    );

    expect(leftMessage(plan)).toContain(`nova.tweak`);
  });

  test(`refuses a mod holding several REDmods`, () => {
    const plan = planRevertToArchiveMod(
      [...convertedRedmodInfos, { ...convertedRedmodInfos[0], name: `Second` }],
      [redmodPath(`Nova LUT`, REDMOD_ARCHIVES_DIRNAME, `nova_lut.archive`)],
    );

    expect(leftMessage(plan)).toContain(`2 REDmods`);
  });

  test(`refuses a module with no archives left to restore`, () => {
    const plan = planRevertToArchiveMod(
      convertedRedmodInfos,
      [redmodPath(`Nova LUT`, REDMOD_INFO_FILENAME)],
    );

    expect(leftMessage(plan)).toContain(`no archives`);
  });
});

describe(`Recognizing mods the old autoconvert setting converted`, () => {
  test(`spots the version tag that conversion left behind`, () => {
    expect(looksAutoconvertedByAnOlderVersion([{
      name: `Nova LUT (V2077 Autoconverted)`,
      version: `2.1+V2077RED`,
      relativePath: redmodPath(`Nova LUT`),
      vortexModId: `nova-lut-1`,
    }])).toBe(true);
  });

  test(`leaves a mod that shipped as a REDmod alone`, () => {
    expect(looksAutoconvertedByAnOlderVersion([{
      name: `Real REDmod`,
      version: `2.1`,
      relativePath: redmodPath(`Real REDmod`),
      vortexModId: `real-1`,
    }])).toBe(false);
  });
});

describe(`Cleaning up directories a conversion empties`, () => {
  test(`lists the emptied directories deepest first, so each is empty when reached`, () => {
    const changes: StagingChanges = {
      relocations: [{
        from: archivePath(`variant`, `nested.archive`),
        to: redmodPath(`Nested`, REDMOD_ARCHIVES_DIRNAME, `variant`, `nested.archive`),
      }],
      filesToGenerate: [],
      filesToDelete: [],
    };

    expect(dirsEmptiedBy(changes)).toEqual([
      archivePath(`variant`).replace(/\\$/, ``),
      path.join(`archive`, `pc`, `mod`),
      path.join(`archive`, `pc`),
      `archive`,
    ]);
  });
});

describe(`Applying changes to the staging folder`, () => {
  const recordingOps = (
    failOn?: string,
  ): { ops: StagingFileOps; moves: FileRelocation[]; written: string[]; deleted: string[] } => {
    const moves: FileRelocation[] = [];
    const written: string[] = [];
    const deleted: string[] = [];

    return {
      moves,
      written,
      deleted,
      ops: {
        move: async (from: string, to: string): Promise<void> => {
          if (from === failOn) {
            throw new Error(`Disk said no`);
          }
          moves.push({ from, to });
        },
        writeFile: async (at: string): Promise<void> => {
          written.push(at);
        },
        deleteFile: async (at: string): Promise<void> => {
          deleted.push(at);
        },
        removeDirIfEmpty: async (): Promise<void> => undefined,
      },
    };
  };

  const twoArchiveChanges: StagingChanges = {
    relocations: [
      { from: archivePath(`one.archive`), to: redmodPath(`M`, REDMOD_ARCHIVES_DIRNAME, `one.archive`) },
      { from: archivePath(`two.archive`), to: redmodPath(`M`, REDMOD_ARCHIVES_DIRNAME, `two.archive`) },
    ],
    filesToGenerate: [{ at: redmodPath(`M`, REDMOD_INFO_FILENAME), content: `{}` }],
    filesToDelete: [],
  };

  test(`moves every file and writes what it generates`, async () => {
    const { ops, moves, written } = recordingOps();

    await applyStagingChanges(ops, twoArchiveChanges);

    expect(moves).toHaveLength(2);
    expect(written).toEqual([redmodPath(`M`, REDMOD_INFO_FILENAME)]);
  });

  test(`puts back what it already moved when a later move fails`, async () => {
    const { ops, moves } = recordingOps(archivePath(`two.archive`));

    await expect(applyStagingChanges(ops, twoArchiveChanges)).rejects.toThrow(`Disk said no`);

    expect(moves).toEqual([
      { from: archivePath(`one.archive`), to: redmodPath(`M`, REDMOD_ARCHIVES_DIRNAME, `one.archive`) },
      { from: redmodPath(`M`, REDMOD_ARCHIVES_DIRNAME, `one.archive`), to: archivePath(`one.archive`) },
    ]);
  });

  test(`doesn't generate files when a move failed`, async () => {
    const { ops, written } = recordingOps(archivePath(`one.archive`));

    await expect(applyStagingChanges(ops, twoArchiveChanges)).rejects.toThrow(`Disk said no`);

    expect(written).toEqual([]);
  });
});

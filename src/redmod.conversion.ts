import path from "path";
import {
  Either,
  left,
  right,
} from "fp-ts/lib/Either";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  filter,
  map,
  partition,
  some as any,
} from "fp-ts/ReadonlyArray";
import {
  replace as replaceIn,
} from "fp-ts/lib/string";
import {
  normalizeDir,
  pathIn,
  pathStartsWith,
  safeNormalizePath,
} from "./filetree";
import {
  ARCHIVE_MOD_CANONICAL_PREFIX,
  ARCHIVE_MOD_FILE_EXTENSION,
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_ARCHIVES_VALID_EXTENSIONS,
  REDMOD_AUTOCONVERTED_VERSION_TAG,
  REDMOD_BASEDIR,
  REDMOD_INFO_FILENAME,
} from "./installers.layouts";
import {
  REDmodInfo,
  REDmodInfoArrayForVortex,
  REDmodInfoForVortex,
} from "./installers.types";
import {
  jsonpp,
} from "./util.functions";

//
// Converting an installed archive mod into a REDmod, and back again.
//
// Everything here works on the mod as it sits in the staging folder, so it
// needs no install instructions and no download to re-extract.
//

//
// Types
//

export interface FileRelocation {
  from: string;
  to: string;
}

export interface GeneratedFile {
  at: string;
  content: string;
}

// Everything a conversion does to one mod's staging folder, as paths relative
// to that mod's own staging directory.
export interface StagingChanges {
  relocations: readonly FileRelocation[];
  filesToGenerate: readonly GeneratedFile[];
  filesToDelete: readonly string[];
}

export interface ConversionToREDmod {
  changes: StagingChanges;
  redmodInfo: REDmodInfoForVortex;
}

export interface RevertToArchiveMod {
  changes: StagingChanges;
}

//
// Naming
//

// REDmod resolves modules by directory name, and dots in it break the lookup.
// Path separators and the rest of the Windows-reserved set would break the
// directory outright.
const UNUSABLE_IN_MODULE_DIRNAME = /[.<>:"/\\|?*]/g;

export const redmodModuleNameFrom = (modName: string): Either<Error, string> => {
  const usableAsDirname = pipe(
    modName,
    replaceIn(UNUSABLE_IN_MODULE_DIRNAME, `_`),
    replaceIn(/\s+/g, ` `),
    (name) => name.trim(),
  );

  return usableAsDirname === ``
    ? left(new Error(`Can't build a REDmod name out of '${modName}'`))
    : right(usableAsDirname);
};

// Two mods can share a display name, and two REDmods can't share a directory.
// The set is normalized once so the collision check stays a hash lookup.
export const redmodModuleNameNotYetTaken = (
  wanted: string,
  alreadyTaken: ReadonlySet<string>,
): string => {
  const takenAndNormalized =
    new Set(pipe([...alreadyTaken], map(safeNormalizePath)));

  // Bounded by the number of mods that could collide, so it always terminates
  let candidate = wanted;
  let suffix = 1;

  while (takenAndNormalized.has(safeNormalizePath(candidate))) {
    suffix += 1;
    candidate = `${wanted} ${suffix}`;
  }

  return candidate;
};

//
// Path helpers
//

const asDirPrefix = (dir: string): string =>
  `${normalizeDir(dir)}${path.sep}`;

const isUnder = (dirPrefix: string): ((relativePath: string) => boolean) =>
  pathStartsWith(asDirPrefix(dirPrefix));

// Callers normalize paths before planning, so case differences don't change
// length and the prefix can be sliced off directly.
const withoutPrefix = (dirPrefix: string): ((relativePath: string) => string) => {
  const prefixLength = asDirPrefix(dirPrefix).length;

  return (relativePath: string) => relativePath.slice(prefixLength);
};

const hasREDmoddableExtension = (relativePath: string): boolean =>
  pathIn(REDMOD_ARCHIVES_VALID_EXTENSIONS)(path.extname(relativePath));

//
// Planning: archive mod -> REDmod
//

export const planConversionToREDmod = (
  vortexModId: string,
  redmodModuleName: string,
  redmodVersion: string,
  stagingFiles: readonly string[],
): Either<Error, ConversionToREDmod> => {
  const { right: filesToConvert, left: filesElsewhere } = pipe(
    stagingFiles,
    partition(isUnder(ARCHIVE_MOD_CANONICAL_PREFIX)),
  );

  if (filesElsewhere.length > 0) {
    return left(new Error(`Only mods that are purely archives can be converted, and this one also has ${filesElsewhere.join(`, `)}`));
  }

  const { left: filesThatAreNotArchives } = pipe(
    filesToConvert,
    partition(hasREDmoddableExtension),
  );

  if (filesThatAreNotArchives.length > 0) {
    return left(new Error(`A REDmod's archives directory only takes ${REDMOD_ARCHIVES_VALID_EXTENSIONS.join(` and `)} files, and this mod also has ${filesThatAreNotArchives.join(`, `)}`));
  }

  const hasSomethingToLoad = pipe(
    filesToConvert,
    any((file) => path.extname(file) === ARCHIVE_MOD_FILE_EXTENSION),
  );

  if (!hasSomethingToLoad) {
    return left(new Error(`There are no ${ARCHIVE_MOD_FILE_EXTENSION} files here to convert`));
  }

  const redmodModuleDir =
    path.join(REDMOD_BASEDIR, redmodModuleName);

  const redmodArchivesDir =
    path.join(redmodModuleDir, REDMOD_ARCHIVES_DIRNAME);

  const relocations = pipe(
    filesToConvert,
    map((from): FileRelocation => ({
      from,
      to: path.join(redmodArchivesDir, withoutPrefix(ARCHIVE_MOD_CANONICAL_PREFIX)(from)),
    })),
  );

  const infoJson: REDmodInfo = {
    name: redmodModuleName,
    version: redmodVersion,
  };

  return right({
    changes: {
      relocations,
      filesToGenerate: [{
        at: path.join(redmodModuleDir, REDMOD_INFO_FILENAME),
        content: jsonpp(infoJson),
      }],
      filesToDelete: [],
    },
    redmodInfo: {
      name: redmodModuleName,
      version: redmodVersion,
      relativePath: normalizeDir(redmodModuleDir),
      vortexModId,
    },
  });
};

//
// Planning: REDmod -> archive mod
//
// Accepts exactly the shape the conversion above creates. Any other REDmod has
// no archive layout to go back to.
//

export const planRevertToArchiveMod = (
  redmodInfos: REDmodInfoArrayForVortex,
  stagingFiles: readonly string[],
): Either<Error, RevertToArchiveMod> => {
  if (redmodInfos.length !== 1) {
    return left(new Error(`Only a mod converted from a single archive mod can be reverted, and this one has ${redmodInfos.length} REDmods in it`));
  }

  const redmodModuleDir =
    normalizeDir(redmodInfos[0].relativePath);

  const redmodArchivesDir =
    path.join(redmodModuleDir, REDMOD_ARCHIVES_DIRNAME);

  const infoJsonPath =
    path.join(redmodModuleDir, REDMOD_INFO_FILENAME);

  const { right: archivesToRestore, left: everythingElse } = pipe(
    stagingFiles,
    partition(isUnder(redmodArchivesDir)),
  );

  const leftoversThatAreNotTheInfoJson = pipe(
    everythingElse,
    filter((file) => safeNormalizePath(file) !== safeNormalizePath(infoJsonPath)),
  );

  if (leftoversThatAreNotTheInfoJson.length > 0) {
    return left(new Error(`Only a converted archive mod can be reverted, and this one also has ${leftoversThatAreNotTheInfoJson.join(`, `)}`));
  }

  if (archivesToRestore.length < 1) {
    return left(new Error(`There are no archives in ${redmodArchivesDir} to restore`));
  }

  const relocations = pipe(
    archivesToRestore,
    map((from): FileRelocation => ({
      from,
      to: path.join(ARCHIVE_MOD_CANONICAL_PREFIX, withoutPrefix(redmodArchivesDir)(from)),
    })),
  );

  return right({
    changes: {
      relocations,
      filesToGenerate: [],
      filesToDelete: [infoJsonPath],
    },
  });
};

//
// Recognizing what we've already done
//

// Autoconverted mods carry the tag in their version rather than the marker
// attribute, and are revertible on that basis.
export const looksAutoconvertedByAnOlderVersion = (
  redmodInfos: REDmodInfoArrayForVortex,
): boolean =>
  pipe(
    redmodInfos,
    any((redmodInfo) => redmodInfo.version.includes(REDMOD_AUTOCONVERTED_VERSION_TAG)),
  );

//
// Applying a plan
//
// The ops are injected, so all real IO belongs to the Vortex layer.
//

export interface StagingFileOps {
  move: (from: string, to: string) => Promise<void>;
  writeFile: (at: string, content: string) => Promise<void>;
  deleteFile: (at: string) => Promise<void>;
  removeDirIfEmpty: (dir: string) => Promise<void>;
}

const selfAndParentsOf = (dir: string): readonly string[] => {
  const selfAndParents: string[] = [];

  for (let current = dir; current !== `.` && current !== path.sep; current = path.dirname(current)) {
    selfAndParents.push(current);
  }

  return selfAndParents;
};

// Every directory a set of relocations may empty out, deepest first so each one
// is already empty by the time we reach it. Whether it actually ended up empty
// is left to the caller, since files we never touched can still be in there.
export const dirsEmptiedBy = (changes: StagingChanges): readonly string[] => {
  const dirsFilesLeft = new Set(pipe(
    [...changes.relocations.map(({ from }) => from), ...changes.filesToDelete],
    map((file) => path.dirname(file)),
  ));

  const everyDirUpToTheModRoot = pipe(
    [...dirsFilesLeft],
    map(selfAndParentsOf),
    (parentLists) => parentLists.flat(),
  );

  return [...new Set(everyDirUpToTheModRoot)].sort((a, b) => b.length - a.length);
};

// A half-applied conversion is worse than a failed one, so a failure partway
// through puts back whatever already moved before giving up.
export const applyStagingChanges = async (
  ops: StagingFileOps,
  changes: StagingChanges,
): Promise<void> => {
  const alreadyMoved: FileRelocation[] = [];

  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const relocation of changes.relocations) {
      // eslint-disable-next-line no-await-in-loop
      await ops.move(relocation.from, relocation.to);
      alreadyMoved.push(relocation);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const { at, content } of changes.filesToGenerate) {
      // eslint-disable-next-line no-await-in-loop
      await ops.writeFile(at, content);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const at of changes.filesToDelete) {
      // eslint-disable-next-line no-await-in-loop
      await ops.deleteFile(at);
    }
  } catch (err) {
    // eslint-disable-next-line no-restricted-syntax
    for (const relocation of alreadyMoved.reverse()) {
      // eslint-disable-next-line no-await-in-loop
      await ops.move(relocation.to, relocation.from);
    }

    throw err;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const dir of dirsEmptiedBy(changes)) {
    // eslint-disable-next-line no-await-in-loop
    await ops.removeDirIfEmpty(dir);
  }
};

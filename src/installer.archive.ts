import path from "path";
import { showArchiveInstallWarning } from "./ui.dialogs";
import {
  PathFilter,
  FileTree,
  filesUnder,
  Glob,
  findAllSubdirsWithSome,
  FILETREE_ROOT,
  fileTreeFromPaths,
  subdirsIn,
  filesIn,
} from "./filetree";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import {
  ARCHIVE_MOD_FILE_EXTENSION,
  ARCHIVE_MOD_CANONICAL_PREFIX,
  MaybeInstructions,
  NoInstructions,
  ArchiveLayout,
  ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX,
  Instructions,
  LayoutToInstructions,
  InvalidLayout,
  NoLayout,
  ARCHIVE_MOD_XL_EXTENSION,
  ARCHIVE_MOD_EXTENSIONS,
  ExtraArchiveLayout,
} from "./installers.layouts";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  moveFromTo,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType, V2077InstallFunc, V2077TestFunc } from "./installers.types";
import {
  VortexApi,

  VortexLogFunc,
  VortexTestResult,

  VortexInstallResult,

} from "./vortex-wrapper";

//

const matchArchive: PathFilter = (file: string): boolean =>
  path.extname(file) === ARCHIVE_MOD_FILE_EXTENSION;

const matchArchiveXL = (filePath: string): boolean =>
  path.extname(filePath) === ARCHIVE_MOD_XL_EXTENSION;

const matchArchiveOrXL = (filePath: string): boolean =>
  ARCHIVE_MOD_EXTENSIONS.includes(path.extname(filePath));

const matchNonArchive = (filePath: string): boolean => !matchArchiveOrXL(filePath);

const findArchiveXLFiles = (fileTree: FileTree): string[] =>
  filesIn(ARCHIVE_MOD_CANONICAL_PREFIX, matchArchiveXL, fileTree);

const findArchiveCanonFiles = (fileTree: FileTree): string[] =>
  filesIn(ARCHIVE_MOD_CANONICAL_PREFIX, matchArchive, fileTree);

const findArchiveHeritageFiles = (fileTree: FileTree): string[] =>
  filesIn(ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX, matchArchive, fileTree);

const findToplevelArchiveOrXLFiles = (fileTree: FileTree): string[] =>
  filesIn(FILETREE_ROOT, matchArchiveOrXL, fileTree);

const findUnknownFilesInCanonDir = (fileTree: FileTree): string[] =>
  filesIn(ARCHIVE_MOD_CANONICAL_PREFIX, matchNonArchive, fileTree);

const findAllArchiveFiles = (fileTree: FileTree): string[] =>
  filesUnder(FILETREE_ROOT, matchArchiveOrXL, fileTree);

const detectArchiveCanonWithXLLayout = (fileTree: FileTree): boolean =>
  findArchiveXLFiles(fileTree).length > 0;

const detectArchiveCanonLayout = (fileTree: FileTree): boolean =>
  findArchiveCanonFiles(fileTree).length > 0;

const detectArchiveHeritageLayout = (fileTree: FileTree): boolean =>
  findArchiveHeritageFiles(fileTree).length > 0;

export const detectExtraArchiveLayouts = (fileTree: FileTree): boolean =>
  detectArchiveCanonWithXLLayout(fileTree) ||
  detectArchiveCanonLayout(fileTree) ||
  detectArchiveHeritageLayout(fileTree);

// Prompts

const warnUserIfArchivesMightNeedManualReview = (
  api: VortexApi,
  chosenInstructions: Instructions,
): boolean => {
  // Trying out the tree-based approach..
  const destinationPaths = chosenInstructions.instructions.map((i) => i.destination);
  const newTree = fileTreeFromPaths(destinationPaths);

  const warnAboutSubdirs = subdirsIn(ARCHIVE_MOD_CANONICAL_PREFIX, newTree).length > 0;

  const hasMultipleTopLevelFiles =
    filesIn(ARCHIVE_MOD_CANONICAL_PREFIX, matchArchive, newTree).length > 1;

  const multipleTopLevelsMightBeIntended =
    chosenInstructions.kind !== ArchiveLayout.Other;

  const warnAboutToplevel = !multipleTopLevelsMightBeIntended && hasMultipleTopLevelFiles;

  const xlsInSubdirs = findAllSubdirsWithSome(
    ARCHIVE_MOD_CANONICAL_PREFIX,
    matchArchiveXL,
    newTree,
  );

  const warnAboutXLs = xlsInSubdirs.length > 0;

  const requiresWarning = warnAboutSubdirs || warnAboutToplevel || warnAboutXLs;

  if (requiresWarning) {
    showArchiveInstallWarning(
      api,
      warnAboutSubdirs,
      warnAboutToplevel,
      warnAboutXLs,
      filesUnder(FILETREE_ROOT, Glob.Any, newTree),
    );
  }

  return requiresWarning;
};

// Layouts

const archiveCanonWithXLLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allArchiveXLFiles = findArchiveXLFiles(fileTree);
  const allArchiveCanonFiles = findArchiveCanonFiles(fileTree);

  // Not ours
  if (allArchiveXLFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  if (allArchiveCanonFiles.length < 1) {
    // This might be a valid case, let's review at some point.
    // Supported for now because it's used in the wild, e.g. in
    // https://www.nexusmods.com/cyberpunk2077/mods/4225?tab=files
    api.log(`info`, `${InstallerType.Archive}: found only *.xl files, installing those`);
  }

  const allExtraFilesInBaseDir = findUnknownFilesInCanonDir(fileTree);

  const allInstructions = [
    ...instructionsForSameSourceAndDestPaths(allArchiveXLFiles),
    ...instructionsForSameSourceAndDestPaths(allArchiveCanonFiles),
    ...instructionsForSameSourceAndDestPaths(allExtraFilesInBaseDir),
  ];

  const hasArchivesOutsideDirsAllowedHere =
    findAllArchiveFiles(fileTree).length !== allInstructions.length;

  if (hasArchivesOutsideDirsAllowedHere) {
    return InvalidLayout.Conflict;
  }

  return {
    kind: ArchiveLayout.XL,
    instructions: allInstructions,
  };
};

export const archiveCanonLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  // Strict check, everything else goes under Other
  const hasCanonFiles = detectArchiveCanonLayout(fileTree);

  if (!hasCanonFiles) {
    return NoInstructions.NoMatch;
  }

  const allFilesInCanonDir = filesUnder(ARCHIVE_MOD_CANONICAL_PREFIX, Glob.Any, fileTree);

  const hasArchivesOutsideCanon =
    findAllArchiveFiles(fileTree).length !== findArchiveCanonFiles(fileTree).length;

  if (hasArchivesOutsideCanon) {
    return InvalidLayout.Conflict;
  }

  return {
    kind: ArchiveLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allFilesInCanonDir),
  };
};

export const archiveHeritageLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  // Strict check, everything else goes under Other
  const hasOldCanonFiles = detectArchiveHeritageLayout(fileTree);

  if (!hasOldCanonFiles) {
    return NoInstructions.NoMatch;
  }

  const oldCanonFiles = filesUnder(
    ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX,
    Glob.Any,
    fileTree,
  );

  const oldToNewMap = oldCanonFiles.map((f: string) => [
    f,
    f.replace(
      path.normalize(ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX),
      path.normalize(ARCHIVE_MOD_CANONICAL_PREFIX),
    ),
  ]);

  return {
    kind: ArchiveLayout.Heritage,
    instructions: instructionsForSourceToDestPairs(oldToNewMap),
  };
};

const archiveOtherDirsToCanonLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allDirsWithArchives = findAllSubdirsWithSome(
    FILETREE_ROOT,
    matchArchiveOrXL,
    fileTree,
  );

  const allFiles = allDirsWithArchives.flatMap((dir: string) =>
    filesUnder(dir, Glob.Any, fileTree));

  const allToPrefixedMap: string[][] = allFiles.map((f: string) =>
    // There may be some non-canonical layouts in the basedir
    (f.startsWith(ARCHIVE_MOD_CANONICAL_PREFIX)
      ? [f, f]
      : [f, path.join(ARCHIVE_MOD_CANONICAL_PREFIX, f)]));

  return {
    kind: ArchiveLayout.Other,
    instructions: instructionsForSourceToDestPairs(allToPrefixedMap),
  };
};

const archiveExtraToplevelLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allToplevelArchiveOrXlFiles = findToplevelArchiveOrXLFiles(fileTree);

  if (allToplevelArchiveOrXlFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const allToplevelToCanonMap = allToplevelArchiveOrXlFiles.map(
    moveFromTo(FILETREE_ROOT, ARCHIVE_MOD_CANONICAL_PREFIX),
  );

  return {
    kind: ExtraArchiveLayout.Toplevel,
    instructions: instructionsForSourceToDestPairs(allToplevelToCanonMap),
  };
};

//
// Instruction generators
//

// Once again we could get fancy, but let's not
const instructionsForStandaloneMod = (
  api: VortexApi,
  fileTree: FileTree,
): MaybeInstructions => {
  const possibleLayoutsToTryInOrder: LayoutToInstructions[] = [
    archiveCanonWithXLLayout,
    archiveCanonLayout,
    archiveHeritageLayout,
    archiveOtherDirsToCanonLayout,
  ];

  const chosenInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    possibleLayoutsToTryInOrder,
  );

  return chosenInstructions;
};

export const instructionsForCanonicalExtras = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const extraCanonArchiveLayoutsAllowedInOtherModTypes = [
    archiveCanonWithXLLayout,
    archiveCanonLayout,
    archiveHeritageLayout,
  ];

  const chosenInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    extraCanonArchiveLayoutsAllowedInOtherModTypes,
  );

  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${InstallerType.Archive}: No valid extra canon archives`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return chosenInstructions;
};

export const instructionsForToplevelExtras = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const chosenInstructions = archiveExtraToplevelLayout(api, undefined, fileTree);

  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${InstallerType.Archive}: No valid extra toplevel archives`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return chosenInstructions;
};

//
// Vortex API
//

//
// testSupport
//

export const testForArchiveMod: V2077TestFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  if (detectArchiveCanonWithXLLayout(fileTree)) {
    return Promise.resolve({ supported: true, requiredFiles: [] });
  }

  let supported: boolean;
  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === ARCHIVE_MOD_FILE_EXTENSION,
  );

  if (filtered.length === 0) {
    log(`info`, `No archives.`);
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  if (files.length > filtered.length) {
    // Figure out what the leftovers are and if they matter
    // such as readmes, usage text, etc.
    const unfiltered = files.filter((f: string) => !filtered.includes(f));

    const importantBaseDirs = [`bin`, `r6`, `red4ext`];
    const hasNonArchive =
      unfiltered.find((f: string) =>
        importantBaseDirs.includes(path.dirname(f).split(path.sep)[0])) !== undefined;

    // there is a base folder for non archive mods, so why bother.
    if (hasNonArchive) {
      log(`info`, `Other mod folder exist... probably an archive as part of those.`);
      return Promise.resolve({
        supported: false,
        requiredFiles: [],
      });
    }

    supported = true;
  } else if (files.length === filtered.length) {
    // all files are archives
    supported = true;
  } else {
    supported = false;
    log(
      `error`,
      `I have no idea why filtering created more files than already existed. Needless to say, this can not be installed.`,
    );
  }

  if (supported !== undefined && supported) {
    log(`info`, `Only archive files, so installing them should be easy peasy.`);
  } else {
    supported = false;
  }

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
};

//
// install
//

export const installArchiveMod: V2077InstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const chosenInstructions = instructionsForStandaloneMod(api, fileTree);

  if (chosenInstructions === NoInstructions.NoMatch) {
    const message = `${InstallerType.Archive} installer failed to generate any instructions!`;
    log(`error`, message, files);
    return Promise.reject(new Error(message));
  }

  if (chosenInstructions === InvalidLayout.Conflict) {
    log(`debug`, `${InstallerType.Archive}: conflicting archive layouts`);

    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Archive,
      fileTree,
    );
  }

  warnUserIfArchivesMightNeedManualReview(api, chosenInstructions);

  return Promise.resolve({ instructions: chosenInstructions.instructions });
};

//
// Internal API for including in other installers
//

export const extraCanonArchiveInstructions = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const canonicalInstructions = instructionsForCanonicalExtras(api, fileTree);

  /*
  const transformedInstructions =
    maybeTransformToREDmod(api, canonicalInstructions, fileTree);
    */

  // We should handle the potentially-conflicting archives case here,
  // but it requires some extra logic (which we should do, just not now)
  // and most likely most real mods do the right thing here and this won't
  // be much of a problem in practice. But we should still fix it because
  // it'll be a better design in addition to the robustness.
  //
  // Improvement/defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/74
  warnUserIfArchivesMightNeedManualReview(api, canonicalInstructions);

  return canonicalInstructions;
};

export const extraToplevelArchiveInstructions = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const toplevelInstructions = instructionsForToplevelExtras(api, fileTree);

  // We should handle the potentially-conflicting archives case here,
  // but it requires some extra logic (which we should do, just not now)
  // and most likely most real mods do the right thing here and this won't
  // be much of a problem in practice. But we should still fix it because
  // it'll be a better design in addition to the robustness.
  //
  // Improvement/defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/74
  warnUserIfArchivesMightNeedManualReview(api, toplevelInstructions);

  return toplevelInstructions;
};

import path from "path";
import { showArchiveInstallWarning } from "./dialogs";
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
  fileCount,
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
} from "./installers.layouts";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType } from "./installers.types";
import {
  VortexApi,
  VortexWrappedTestSupportedFunc,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexInstallResult,
} from "./vortex-wrapper";

//
// To deprecate
//
export const allCanonicalArchiveOnlyFiles = (fileTree: FileTree) =>
  filesUnder(ARCHIVE_MOD_CANONICAL_PREFIX, Glob.Any, fileTree);

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

const findExtraFilesInCanonDir = (fileTree: FileTree): string[] =>
  filesIn(ARCHIVE_MOD_CANONICAL_PREFIX, matchNonArchive, fileTree);

const detectArchiveCanonWithXLLayout = (fileTree: FileTree): boolean =>
  findArchiveXLFiles(fileTree).length > 0;

const detectArchiveCanonLayout = (fileTree: FileTree): boolean =>
  findArchiveCanonFiles(fileTree).length > 0;

const detectArchiveHeritageLayout = (fileTree: FileTree): boolean =>
  findArchiveHeritageFiles(fileTree).length > 0;

// Prompts

const warnUserIfArchivesMightNeedManualReview = (
  api: VortexApi,
  chosenInstructions: Instructions,
) => {
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

  if (warnAboutSubdirs || warnAboutToplevel || warnAboutXLs) {
    showArchiveInstallWarning(
      api,
      warnAboutSubdirs,
      warnAboutToplevel,
      warnAboutXLs,
      destinationPaths,
    );
  }
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

  // Not right
  if (allArchiveCanonFiles.length < 1) {
    return InvalidLayout.Conflict;
  }

  const allExtraFilesInBaseDir = findExtraFilesInCanonDir(fileTree);

  const allInstructions = [
    ...instructionsForSameSourceAndDestPaths(allArchiveXLFiles),
    ...instructionsForSameSourceAndDestPaths(allArchiveCanonFiles),
    ...instructionsForSameSourceAndDestPaths(allExtraFilesInBaseDir),
  ];

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

  const allCanonFiles = filesUnder(ARCHIVE_MOD_CANONICAL_PREFIX, Glob.Any, fileTree);

  return {
    kind: ArchiveLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonFiles),
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
    filesUnder(dir, Glob.Any, fileTree),
  );

  const allToPrefixedMap: string[][] = allFiles.map((f: string) =>
    // There may be some non-canonical layouts in the basedir
    f.startsWith(ARCHIVE_MOD_CANONICAL_PREFIX)
      ? [f, f]
      : [f, path.join(ARCHIVE_MOD_CANONICAL_PREFIX, f)],
  );

  return {
    kind: ArchiveLayout.Other,
    instructions: instructionsForSourceToDestPairs(allToPrefixedMap),
  };
};

export const testForArchiveMod: VortexWrappedTestSupportedFunc = (
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
    log("info", "No archives.");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  if (files.length > filtered.length) {
    // Figure out what the leftovers are and if they matter
    // such as readmes, usage text, etc.
    const unfiltered = files.filter((f: string) => !filtered.includes(f));

    const importantBaseDirs = ["bin", "r6", "red4ext"];
    const hasNonArchive =
      unfiltered.find((f: string) =>
        importantBaseDirs.includes(path.dirname(f).split(path.sep)[0]),
      ) !== undefined;

    // there is a base folder for non archive mods, so why bother.
    if (hasNonArchive) {
      log("info", "Other mod folder exist... probably an archive as part of those.");
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
      "error",
      "I have no idea why filtering created more files than already existed. Needless to say, this can not be installed.",
    );
  }

  if (supported !== undefined && supported) {
    log("info", "Only archive files, so installing them should be easy peasy.");
  } else {
    supported = false;
  }

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
};

// install

export const installArchiveMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  // Once again we could get fancy, but let's not
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

  // Should probably prompt here.
  //
  // Defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/123
  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    const message = `${InstallerType.Archive} installer failed to generate any instructions!`;
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  const haveFilesOutsideSelectedInstructions =
    chosenInstructions.instructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Archive,
      fileTree,
    );
  }

  warnUserIfArchivesMightNeedManualReview(api, chosenInstructions);

  return Promise.resolve({ instructions: chosenInstructions.instructions });
};

const extraArchiveLayoutsAllowedInOtherModTypes = [
  archiveCanonLayout,
  archiveHeritageLayout,
];

export const extraCanonArchiveInstructions = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const archiveLayoutToUse = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    extraArchiveLayoutsAllowedInOtherModTypes,
  );

  if (
    archiveLayoutToUse === NoInstructions.NoMatch ||
    archiveLayoutToUse === InvalidLayout.Conflict
  ) {
    api.log("debug", "No valid extra archives");
    return { kind: NoLayout.Optional, instructions: [] };
  }

  // We should handle the potentially-conflicting archives case here,
  // but it requires some extra logic (which we should do, just not now)
  // and most likely most real mods do the right thing here and this won't
  // be much of a problem in practice. But we should still fix it because
  // it'll be a better design in addition to the robustness.
  //
  // Improvement/defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/74

  return archiveLayoutToUse;
};

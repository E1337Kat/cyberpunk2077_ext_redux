import fs from "fs";
import { win32 } from "path";
import KeyTree from "key-tree";
import {
  findAllSubdirsWithSome,
  dirWithSomeUnder,
  FileTree,
  PathFilter,
  fileTreeFromPaths,
  FILETREE_ROOT,
  subdirsIn,
  filesIn,
  filesUnder,
  pathInTree,
  findDirectSubdirsWithSome,
  dirWithSomeIn,
  fileCount,
  sourcePaths,
} from "./filetree";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexProgressDelegate,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexExtensionContext,
  VortexTestSupportedFunc,
  VortexInstallFunc,
} from "./vortex-wrapper";
import {
  CET_GLOBAL_INI,
  CET_MOD_CANONICAL_INIT_FILE,
  CET_MOD_CANONICAL_PATH_PREFIX,
  RED4EXT_CORE_RED4EXT_DLL,
  RED4EXT_MOD_CANONICAL_BASEDIR,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS,
  Red4ExtLayout,
  REDS_MOD_CANONICAL_EXTENSION,
  REDS_MOD_CANONICAL_PATH_PREFIX,
  RESHADE_MOD_PATH,
  RESHADE_SHADERS_DIR,
  INI_MOD_EXT,
  INI_MOD_PATH,
  MOD_FILE_EXT,
  JSON_FILE_EXT,
  KNOWN_JSON_FILES,
  ASI_MOD_EXT,
  ASI_MOD_PATH,
  ARCHIVE_ONLY_CANONICAL_EXT,
  ARCHIVE_ONLY_CANONICAL_PREFIX,
  ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX,
  ArchiveLayout,
  Instructions,
  LayoutToInstructions,
  NoInstructions,
  MaybeInstructions,
  NoLayout,
  InvalidLayout,
  CetLayout,
  RedscriptLayout,
  FallbackLayout,
  AsiLayout,
} from "./installers.layouts";
import {
  toSamePath,
  toDirInPath,
  instructionsForSourceToDestPairs,
  instructionsForSameSourceAndDestPaths,
  useFirstMatchingLayoutForInstructions,
  moveFromTo,
  useAllMatchingLayouts,
  makeSyntheticName,
} from "./installers.shared";
import {
  showArchiveInstallWarning,
  showRed4ExtReservedDllErrorDialog,
  promptUserOnConflict,
  promptUserToInstallOrCancelOnReachingFallback,
} from "./dialogs";
import {
  testForCetCore,
  installCetCore,
  testForRedscriptCore,
  installRedscriptCore,
  testRed4ExtCore,
  installRed4ExtCore,
  testCoreCsvMerge,
  installCoreCsvMerge,
  testCoreWolvenKitCli,
  installCoreWolvenkit,
} from "./core-installers";
import { exhaustiveMatchFailure, trueish } from "./installers.utils";
import { GAME_ID } from "./index.metadata";
import {
  InstallDecision,
  Installer,
  InstallerType,
  InstallerWithPriority,
} from "./installers.types";

// Ensure we're using win32 conventions
const path = win32;

const PRIORITY_FOR_PIPELINE_INSTALLER = 30; // Fomod is 20. Leave a couple slots if someone wants in before us
const PRIORITY_STARTING_NUMBER = PRIORITY_FOR_PIPELINE_INSTALLER + 1;

// testSupported that always fails
//
export const notSupportedModType: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => Promise.resolve({ supported: false, requiredFiles: [] });

// install that always fails
//
export const notInstallableMod: VortexWrappedInstallFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
  _gameId: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  throw new Error("Should never get here");
};

const matchAsiFile = (file: string) => path.extname(file) === ASI_MOD_EXT;

const matchRedscript = (file: string) =>
  path.extname(file) === REDS_MOD_CANONICAL_EXTENSION;

const allRedscriptFiles = (files: string[]): string[] => files.filter(matchRedscript);

const matchArchive: PathFilter = (file: string): boolean =>
  path.extname(file) === ARCHIVE_ONLY_CANONICAL_EXT;

// Installers
const allFilesInFolder = (folder: string, files: string[]) => {
  const fileTree = new KeyTree({ separator: path.sep });

  files.forEach((file) => fileTree.add(file, file));

  const moddir = fileTree._getNode(folder); // eslint-disable-line no-underscore-dangle

  if (!moddir) {
    return [];
  }

  const moddirPath = path.join(...moddir.fullPath);

  const allTheFiles: string[] = [].concat(
    ...Object.values(fileTree.getSub(moddirPath, true)),
  );

  return allTheFiles;
};

const allCanonicalCetFiles = (files: string[]) =>
  allFilesInFolder(CET_MOD_CANONICAL_PATH_PREFIX, files);

const allCanonicalArchiveOnlyFiles = (files: string[]) =>
  allFilesInFolder(ARCHIVE_ONLY_CANONICAL_PREFIX, files);

//
//
//
//
// Installers
//
// These should come in (roughly) reverse order of priority,
// because the highest-priority ones will use Layouts and
// other parts from the simpler installers.
//
//

// Fallback

const findFallbackFiles = (fileTree: FileTree): string[] =>
  filesUnder(FILETREE_ROOT, fileTree);

const detectFallbackLayout = (_fileTree: FileTree): boolean => true;

const fallbackLayout: LayoutToInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  if (!detectFallbackLayout(fileTree)) {
    throw new Error("Should never get here");
  }

  const allTheFiles = findFallbackFiles(fileTree);

  return {
    kind: FallbackLayout.Unvalidated,
    instructions: instructionsForSameSourceAndDestPaths(allTheFiles),
  };
};

const useFallbackOrFail = (
  api: VortexApi,
  installerType: InstallerType,
  fileTree: FileTree,
  installDecision: InstallDecision,
): Promise<VortexInstallResult> => {
  switch (installDecision) {
    case InstallDecision.UserWantsToCancel: {
      const message = `${installerType}: user chose to cancel installation on conflict`;
      api.log(`info`, message);
      api.log(`debug`, `Input files: `, sourcePaths(fileTree));
      return Promise.reject(new Error(message));
    }
    case InstallDecision.UserWantsToProceed: {
      api.log(`info`, `${installerType}: user chose to continue installation`);
      api.log(`info`, `${installerType}: using fallback layout to install everything`);

      const fallbackInstructions = fallbackLayout(api, undefined, fileTree);

      if (
        fallbackInstructions === InvalidLayout.Conflict ||
        fallbackInstructions === NoInstructions.NoMatch
      ) {
        return Promise.reject(
          new Error(
            `Fallback layout failed, should never get here: ${fallbackInstructions}`,
          ),
        );
      }

      api.log(`info`, `${installerType}: instructions generated by fallback installer`);
      api.log(`debug`, `Instructions`, fallbackInstructions.instructions);

      return Promise.resolve({
        instructions: fallbackInstructions.instructions,
      });
    }
    default: {
      return exhaustiveMatchFailure(installDecision);
    }
  }
};

const useFallbackOrFailBasedOnUserDecision = async (
  api: VortexApi,
  installerType: InstallerType,
  fileTree: FileTree,
): Promise<VortexInstallResult> => {
  const installDecision = await promptUserOnConflict(
    api,
    installerType,
    sourcePaths(fileTree),
  );

  return useFallbackOrFail(api, installerType, fileTree, installDecision);
};

export const testAnyOtherModFallback: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  gameId: string,
): Promise<VortexTestResult> => {
  log("debug", "Fallback installer received Files: ", files);

  // Make sure we're able to support this mod.
  const correctGame = gameId === GAME_ID;
  log("info", "Entering fallback installer: ", gameId);
  if (!correctGame) {
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installAnyModFallback: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const installDecision = await promptUserToInstallOrCancelOnReachingFallback(
    api,
    sourcePaths(fileTree),
  );

  return useFallbackOrFail(api, InstallerType.Fallback, fileTree, installDecision);
};

//
//
//
// ArchiveOnly
//
// Last of the main ones to try, but first defined so that we
// can use the layouts below.
//
//

const detectArchiveCanonLayout = (fileTree: FileTree): boolean =>
  dirWithSomeUnder(ARCHIVE_ONLY_CANONICAL_PREFIX, matchArchive, fileTree);

const archiveCanonLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasCanonFiles = detectArchiveCanonLayout(fileTree);

  if (!hasCanonFiles) {
    return NoInstructions.NoMatch;
  }

  const allCanonFiles = filesUnder(ARCHIVE_ONLY_CANONICAL_PREFIX, fileTree);

  return {
    kind: ArchiveLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonFiles),
  };
};

const detectArchiveHeritageLayout = (fileTree: FileTree): boolean =>
  dirWithSomeUnder(ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX, matchArchive, fileTree);

const archiveHeritageLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasOldCanonFiles = detectArchiveHeritageLayout(fileTree);

  if (!hasOldCanonFiles) {
    return NoInstructions.NoMatch;
  }

  const oldCanonFiles = filesUnder(ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX, fileTree);

  const oldToNewMap = oldCanonFiles.map((f: string) => [
    f,
    f.replace(
      path.normalize(ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX),
      path.normalize(ARCHIVE_ONLY_CANONICAL_PREFIX),
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
  const allDirs = findAllSubdirsWithSome(FILETREE_ROOT, matchArchive, fileTree);

  const allFiles = allDirs.flatMap((dir: string) => filesUnder(dir, fileTree));

  const allToPrefixedMap: string[][] = allFiles.map((f: string) => [
    f,
    path.join(ARCHIVE_ONLY_CANONICAL_PREFIX, f),
  ]);

  return {
    kind: ArchiveLayout.Other,
    instructions: instructionsForSourceToDestPairs(allToPrefixedMap),
  };
};

const warnUserIfArchivesMightNeedManualReview = (
  api: VortexApi,
  chosenInstructions: Instructions,
) => {
  // Trying out the tree-based approach..
  const destinationPaths = chosenInstructions.instructions.map((i) => i.destination);
  const newTree = fileTreeFromPaths(destinationPaths);

  const warnAboutSubdirs = subdirsIn(ARCHIVE_ONLY_CANONICAL_PREFIX, newTree).length > 0;

  const hasMultipleTopLevelFiles =
    filesIn(ARCHIVE_ONLY_CANONICAL_PREFIX, matchArchive, newTree).length > 1;

  const multipleTopLevelsMightBeIntended =
    chosenInstructions.kind !== ArchiveLayout.Other;

  const warnAboutToplevel = !multipleTopLevelsMightBeIntended && hasMultipleTopLevelFiles;

  if (warnAboutSubdirs || warnAboutToplevel) {
    showArchiveInstallWarning(api, warnAboutSubdirs, warnAboutToplevel, destinationPaths);
  }
};

export const testForArchiveOnlyMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  let supported: boolean;
  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === MOD_FILE_EXT,
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

/**
 * Installs files while correcting the directory structure as we go.
 * @param files a list of files to be installed
 * @returns a promise with an array detailing what files to install and how
 */
export const installArchiveOnlyMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  // Once again we could get fancy, but let's not
  const possibleLayoutsToTryInOrder: LayoutToInstructions[] = [
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

  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    const message = "ArchiveOnly installer failed to generate any instructions!";
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  const haveFilesOutsideSelectedInstructions =
    chosenInstructions.instructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    return useFallbackOrFailBasedOnUserDecision(api, InstallerType.ArchiveOnly, fileTree);
  }

  warnUserIfArchivesMightNeedManualReview(api, chosenInstructions);

  log("info", "ArchiveOnly installer installing files.");
  log("debug", "ArchiveOnly instructions: ", chosenInstructions.instructions);

  return Promise.resolve({ instructions: chosenInstructions.instructions });
};

const extraArchiveLayoutsAllowedInOtherModTypes = [
  archiveCanonLayout,
  archiveHeritageLayout,
];

const extraCanonArchiveInstructions = (
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

// CET

const matchCetInitLua = (f: string): boolean =>
  path.basename(f) === CET_MOD_CANONICAL_INIT_FILE;

const findCanonicalCetDirs = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(CET_MOD_CANONICAL_PATH_PREFIX, matchCetInitLua, fileTree);

const detectCetCanonLayout = (fileTree: FileTree): boolean =>
  findCanonicalCetDirs(fileTree).length > 0;

const cetCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonCetFiles = findCanonicalCetDirs(fileTree).flatMap((namedSubdir) =>
    filesUnder(namedSubdir, fileTree),
  );

  if (allCanonCetFiles.length < 1) {
    api.log("debug", "No canonical CET files found.");
    return NoInstructions.NoMatch;
  }

  return {
    kind: CetLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonCetFiles),
  };
};

// CET

// CET mods are detected by:
//
// Canonical:
//  - .\bin\x64\plugins\cyber_engine_tweaks\mods\MODNAME\init.lua
//  - .\r6\scripts\[modname]\*.reds
//
// Fixable: no
//
// Archives: both canonical

export const testForCetMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const hasCetFilesInANamedModDir = detectCetCanonLayout(fileTree);

  if (!hasCetFilesInANamedModDir) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  log("info", `Matching CET installer: ${hasCetFilesInANamedModDir}`);

  return Promise.resolve({
    supported: hasCetFilesInANamedModDir,
    requiredFiles: [],
  });
};

// Install the CET stuff, as well as any archives we find
export const installCetMod: VortexWrappedInstallFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const cetFiles = allCanonicalCetFiles(files);

  if (cetFiles.length === 0) {
    return Promise.reject(
      new Error("CET install but no CET files, should never get here"),
    );
  }

  // Let's grab anything else we might reasonably have
  const archiveOnlyFiles = allCanonicalArchiveOnlyFiles(files);

  const allTheFiles = cetFiles.concat(archiveOnlyFiles);

  const instructions = instructionsForSameSourceAndDestPaths(allTheFiles);

  return Promise.resolve({ instructions });
};

// Reds

// Redscript mods are detected by
//
// Canonical:
//  - .\r6\scripts\[modname]\*.reds
//
// Fixable (everything assumed to be one mod):
//  - .\*.reds
//  - .\r6\scripts\*.reds
//
// Archives:
//  - Canonical both only

const detectRedscriptBasedirLayout = (fileTree: FileTree): boolean =>
  dirWithSomeIn(REDS_MOD_CANONICAL_PATH_PREFIX, matchRedscript, fileTree);

const redscriptBasedirLayout = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirReds = detectRedscriptBasedirLayout(fileTree);

  if (!hasBasedirReds) {
    api.log("debug", "No basedir Redscript files found");
    return NoInstructions.NoMatch;
  }

  const allBasedirAndSubdirFiles = filesUnder(REDS_MOD_CANONICAL_PATH_PREFIX, fileTree);

  const modnamedDir = path.join(REDS_MOD_CANONICAL_PATH_PREFIX, modName);

  const allToBasedirWithSubdirAsModname = allBasedirAndSubdirFiles.map(
    moveFromTo(REDS_MOD_CANONICAL_PATH_PREFIX, modnamedDir),
  );

  return {
    kind: RedscriptLayout.Basedir,
    instructions: instructionsForSourceToDestPairs(allToBasedirWithSubdirAsModname),
  };
};

const findCanonicalRedscriptDirs = (fileTree: FileTree) =>
  findDirectSubdirsWithSome(REDS_MOD_CANONICAL_PATH_PREFIX, matchRedscript, fileTree);

const detectRedscriptCanonOnlyLayout = (fileTree: FileTree): boolean =>
  !detectRedscriptBasedirLayout(fileTree) &&
  findCanonicalRedscriptDirs(fileTree).length > 0;

const redscriptCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonRedscriptFiles = findCanonicalRedscriptDirs(fileTree).flatMap(
    (namedSubdir) => filesUnder(namedSubdir, fileTree),
  );

  if (allCanonRedscriptFiles.length < 1) {
    api.log("error", "No canonical Redscript files found.");
    return NoInstructions.NoMatch;
  }

  // This is maybe slightly annoying to check, but makes
  // logic elsewhere cleaner. I suppose we can decide that
  // layouts need to be robust enough in themselves if they
  // would otherwise depend on some external check that isn't
  // always present.
  //
  // Generally, shouldn't get here.
  //
  const hasBasedirReds = detectRedscriptBasedirLayout(fileTree);

  if (hasBasedirReds) {
    // Errors need to be handled downstream if it's relevant there
    api.log("debug", "No instructions from canon: basedir overrides");
    return NoInstructions.NoMatch;
  }

  return {
    kind: RedscriptLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonRedscriptFiles),
  };
};

export const testForRedscriptMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const redscriptFiles = allRedscriptFiles(files);

  log("debug", "redscriptFiles: ", { redscriptFiles });

  // We could do more detection here but the
  // installer will already need to duplicate
  // all that. Maybe just check whether there
  // are any counterindications?
  if (redscriptFiles.length === 0) {
    log("debug", "No Redscripts");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  log("info", "Matched to Redscript");
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

// Install the Redscript stuff, as well as any archives we find
export const installRedscriptMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  // We could get a lot fancier here, but for now we don't accept
  // subdirectories anywhere other than in a canonical location.

  // .\*.reds
  // eslint-disable-next-line no-underscore-dangle
  const hasToplevelReds = dirWithSomeIn(FILETREE_ROOT, matchRedscript, fileTree);
  const toplevelReds = hasToplevelReds ? filesUnder(FILETREE_ROOT, fileTree) : [];

  // .\r6\scripts\*.reds
  // eslint-disable-next-line no-underscore-dangle
  const hasBasedirReds = dirWithSomeIn(
    REDS_MOD_CANONICAL_PATH_PREFIX,
    matchRedscript,
    fileTree,
  );
  const basedirReds = hasBasedirReds
    ? filesUnder(REDS_MOD_CANONICAL_PATH_PREFIX, fileTree)
    : [];

  const canonSubdirs = findDirectSubdirsWithSome(
    REDS_MOD_CANONICAL_PATH_PREFIX,
    matchRedscript,
    fileTree,
  );
  const hasCanonReds = canonSubdirs.length > 0;
  const canonReds = hasCanonReds
    ? canonSubdirs.flatMap((dir) => filesUnder(dir, fileTree))
    : [];

  const installable = [hasToplevelReds, hasBasedirReds, hasCanonReds].filter(trueish);

  if (installable.length < 1) {
    const message = "No Redscript found, should never get here.";
    log("error", `Redscript Mod installer: ${message}`, files);
    return Promise.reject(new Error(message));
  }

  if (installable.length > 1) {
    return useFallbackOrFailBasedOnUserDecision(api, InstallerType.Redscript, fileTree);
  }

  const modName = makeSyntheticName(destinationPath);

  // Let's grab archives too
  const archiveOnlyFiles = allCanonicalArchiveOnlyFiles(files);

  // Only one of these should exist but why discriminate?
  const allSourcesAndDestinations = [
    canonReds.map(toSamePath),
    basedirReds.map(toDirInPath(REDS_MOD_CANONICAL_PATH_PREFIX, modName)),
    toplevelReds.map(toDirInPath(REDS_MOD_CANONICAL_PATH_PREFIX, modName)),
    archiveOnlyFiles.map(toSamePath),
  ];

  const instructions = allSourcesAndDestinations.flatMap(
    instructionsForSourceToDestPairs,
  );

  return Promise.resolve({ instructions });
};

// Red4Ext

const matchDll = (file: string) => path.extname(file) === ".dll";
const reservedDllDir = (dir: string) =>
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS.includes(path.join(dir, path.sep));
const reservedDllName = (file: string) =>
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS.includes(path.join(file));

const findBasedirRed4ExtFiles = (fileTree: FileTree) =>
  filesUnder(RED4EXT_MOD_CANONICAL_BASEDIR, fileTree);

const detectRed4ExtBasedirLayout = (fileTree: FileTree): boolean =>
  dirWithSomeIn(RED4EXT_MOD_CANONICAL_BASEDIR, matchDll, fileTree);

const red4extBasedirLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirFiles = detectRed4ExtBasedirLayout(fileTree);

  if (!hasBasedirFiles) {
    return NoInstructions.NoMatch;
  }

  const allFilesUnderBase = findBasedirRed4ExtFiles(fileTree);

  const canonicalModnamedPath = path.join(
    RED4EXT_MOD_CANONICAL_BASEDIR,
    modName,
    path.sep,
  );

  const allFromBaseToModname: string[][] = allFilesUnderBase.map(
    moveFromTo(RED4EXT_MOD_CANONICAL_BASEDIR, canonicalModnamedPath),
  );

  return {
    kind: Red4ExtLayout.Basedir,
    instructions: instructionsForSourceToDestPairs(allFromBaseToModname),
  };
};

const findCanonicalRed4ExtDirs = (fileTree: FileTree) =>
  findDirectSubdirsWithSome(RED4EXT_MOD_CANONICAL_BASEDIR, matchDll, fileTree);

const detectRed4ExtCanonOnlyLayout = (fileTree: FileTree): boolean =>
  !detectRed4ExtBasedirLayout(fileTree) && findCanonicalRed4ExtDirs(fileTree).length > 0;

const red4extCanonLayout: LayoutToInstructions = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasCanonFiles = detectRed4ExtCanonOnlyLayout(fileTree);

  if (!hasCanonFiles) {
    return NoInstructions.NoMatch;
  }

  // This is maybe slightly annoying to check, but makes
  // logic elsewhere cleaner. I suppose we can decide that
  // layouts need to be robust enough in themselves if they
  // would otherwise depend on some external check that isn't
  // always present.
  //
  // Generally, we *shouldn't* get here and the problem should
  // have already been detected in test, but..
  //
  const hasBasedirReds = detectRed4ExtBasedirLayout(fileTree);

  if (hasBasedirReds) {
    // Errors need to be handled downstream if it's relevant there
    api.log("debug", "No instructions from canon: basedir overrides");
    return NoInstructions.NoMatch;
  }

  const allCanonFiles = filesUnder(RED4EXT_MOD_CANONICAL_BASEDIR, fileTree);

  return {
    kind: Red4ExtLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonFiles),
  };
};

const red4extToplevelLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const toplevelFiles = filesIn(FILETREE_ROOT, matchDll, fileTree);

  if (toplevelFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  // No messing about: a DLL at top level means this entire
  // thing has to be part of it. Nothing else allowed.

  const allTheFilesEverywhere = filesUnder(FILETREE_ROOT, fileTree);

  const canonicalModnamedPath = path.join(RED4EXT_MOD_CANONICAL_BASEDIR, modName);

  const allFilesToCanon = allTheFilesEverywhere.map(
    moveFromTo(FILETREE_ROOT, canonicalModnamedPath),
  );

  return {
    kind: Red4ExtLayout.Toplevel,
    instructions: instructionsForSourceToDestPairs(allFilesToCanon),
  };
};

const red4extModnamedToplevelLayout: LayoutToInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const toplevelSubdirsWithFiles = findDirectSubdirsWithSome(
    FILETREE_ROOT,
    matchDll,
    fileTree,
  );

  if (toplevelSubdirsWithFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  if (toplevelSubdirsWithFiles.length > 1) {
    return InvalidLayout.Conflict;
  }

  const allToBasedirWithSubdirAsModname: string[][] = toplevelSubdirsWithFiles.flatMap(
    (dir) =>
      filesUnder(dir, fileTree).map(
        moveFromTo(FILETREE_ROOT, RED4EXT_MOD_CANONICAL_BASEDIR),
      ),
  );

  return {
    kind: Red4ExtLayout.Modnamed,
    instructions: instructionsForSourceToDestPairs(allToBasedirWithSubdirAsModname),
  };
};

export const testForRed4ExtMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const allDllSubdirs = findAllSubdirsWithSome(FILETREE_ROOT, matchDll, fileTree);
  const toplevelDlls = filesIn(FILETREE_ROOT, matchDll, fileTree);

  const noDllDirs = allDllSubdirs.length < 1;
  const noToplevelDlls = toplevelDlls.length < 1;

  if (noDllDirs && noToplevelDlls) {
    log("info", "Doesn't look like a Red4Ext mod");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const dangerPaths = [
    ...allDllSubdirs.filter(reservedDllDir),
    ...toplevelDlls.filter(reservedDllName),
  ];

  if (dangerPaths.length !== 0) {
    const message = "Red4Ext Mod Installation Canceled, Dangerous DLL paths!";
    log("error", message, dangerPaths);
    showRed4ExtReservedDllErrorDialog(api, message, dangerPaths);
    return Promise.reject(new Error(message));
  }

  // Red4Ext itself handled elsewhere
  if (pathInTree(RED4EXT_CORE_RED4EXT_DLL, fileTree)) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  // Good enough, this is the right installer, more checks in `install`

  return Promise.resolve({ supported: true, requiredFiles: [] });
};

export const installRed4ExtMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const modName = makeSyntheticName(destinationPath);

  // At this point we know from the test that none of
  // these are in dangerous locations

  // Red4Ext only allows one subdir deep for initially loaded DLLs
  // Move to test?

  // ...And is it a good idea to allow more than one canon subdir?
  const possibleLayoutsToTryInOrder: LayoutToInstructions[] = [
    red4extBasedirLayout,
    red4extCanonLayout,
    red4extToplevelLayout,
    red4extModnamedToplevelLayout,
  ];

  const chosenInstructions = useFirstMatchingLayoutForInstructions(
    api,
    modName,
    fileTree,
    possibleLayoutsToTryInOrder,
  );

  if (chosenInstructions === NoInstructions.NoMatch) {
    const message = "Red4Ext installer failed to generate any instructions!";
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  if (chosenInstructions === InvalidLayout.Conflict) {
    return useFallbackOrFailBasedOnUserDecision(api, InstallerType.Red4Ext, fileTree);
  }

  const extraArchiveLayoutsAllowed = chosenInstructions.kind !== Red4ExtLayout.Toplevel;

  const allInstructions = extraArchiveLayoutsAllowed
    ? [
        ...chosenInstructions.instructions,
        ...extraCanonArchiveInstructions(api, fileTree).instructions,
      ]
    : chosenInstructions.instructions;

  const haveFilesOutsideSelectedInstructions =
    allInstructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    return useFallbackOrFailBasedOnUserDecision(api, InstallerType.Red4Ext, fileTree);
  }

  log("info", "Red4Ext installer installing files.");
  log("debug", "Red4Ext instructions: ", allInstructions);

  return Promise.resolve({ instructions: allInstructions });
};

// JSON Mods

export const testForJsonMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === JSON_FILE_EXT,
  );
  if (filtered.length === 0) {
    log("info", "No JSON files");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  // This little change should allow properly constructed AMM addons to install in the fallback
  const cetModJson = files.filter((file: string) =>
    path.normalize(file).toLowerCase().includes(CET_MOD_CANONICAL_PATH_PREFIX),
  );
  if (cetModJson.length !== 0) {
    log("error", "We somehow got a CET mod in the JSON check");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  let proper = true;
  // check for options.json in the file list
  const options = filtered.some((file: string) => path.basename(file) === "options.json");
  if (options) {
    log("debug", "Options.json files found: ", options);
    proper = filtered.some((f: string) =>
      path.dirname(f).toLowerCase().startsWith(path.normalize("r6/config/settings")),
    );

    if (!proper) {
      const message =
        "Improperly located options.json file found.  We don't know where it belongs.";

      log("info", message);
      return Promise.reject(new Error(message));
    }
  } else if (
    filtered.some((file: string) => KNOWN_JSON_FILES[path.basename(file)] === undefined)
  ) {
    log("error", "Found JSON files that aren't part of the game.");
    return Promise.reject(new Error("Found JSON files that aren't part of the game."));
  }

  log("debug", "We got through it all and it is a JSON mod");
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installJsonMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const jsonFiles: string[] = files.filter(
    (file: string) => path.extname(file) === ".json",
  );
  const otherAllowedFiles = files.filter(
    (file: string) => path.extname(file) === ".txt" || path.extname(file) === ".md",
  );

  const filtered = jsonFiles.concat(otherAllowedFiles);

  let movedJson = false;

  const jsonFileInstructions = filtered.map((file: string) => {
    const fileName = path.basename(file);

    let instPath = file;

    if (KNOWN_JSON_FILES[fileName] !== undefined) {
      instPath = KNOWN_JSON_FILES[fileName];

      log("debug", "instPath set as ", instPath);
      movedJson = movedJson || file !== instPath;
    }

    return {
      type: "copy",
      source: file,
      destination: instPath,
    };
  });

  if (movedJson) {
    log("info", "JSON files were found outside their canonical locations: Fixed");
  }

  log("debug", "Installing JSON files with: ", jsonFileInstructions);

  const instructions = [].concat(jsonFileInstructions);

  return Promise.resolve({ instructions });
};

const testForReshadeFile = (
  log: VortexLogFunc,
  files: string[],
  folder: string,
): boolean => {
  // We're going to make a reasonable assumption here that reshades will
  // only have reshade ini's, so we only need to check the first one

  const fileToExamine = path.join(
    folder,
    files.find((file: string) => path.extname(file) === INI_MOD_EXT),
  );

  const data = fs.readFileSync(fileToExamine, { encoding: "utf8" });

  if (data === undefined) {
    log("error", "unable to read contents of ", fileToExamine);
    return false;
  }
  data.slice(0, 80);
  // eslint-disable-next-line no-useless-escape
  const regex = /^[\[#].+/;
  const testString = data.replace(regex, "");
  if (testString === data) {
    log("info", "Reshade file located.");
    return true;
  }

  return false;
};

// INI (includes Reshade?)
export const testForIniMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  // Make sure we're able to support this mod.
  const correctGame = _gameId === GAME_ID;
  log("info", "Checking for INI files: ", _gameId);
  if (!correctGame) {
    // no mods?
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === INI_MOD_EXT,
  );

  if (filtered.length === 0) {
    log("info", "No INI files.");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  if (
    files.some(
      (file: string) =>
        path.basename(file).includes(CET_MOD_CANONICAL_INIT_FILE) ||
        path.extname(file) === REDS_MOD_CANONICAL_EXTENSION,
    )
  ) {
    log("info", "INI file detected within a CET or Redscript mod, aborting");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  if (files.includes(CET_GLOBAL_INI)) {
    log("info", "CET Installer detected, not processing as INI");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installIniMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  // This installer gets called for both reshade and "normal" ini mods

  const allIniModFiles = files.filter(
    (file: string) => path.extname(file) === INI_MOD_EXT,
  );

  const reshade = testForReshadeFile(log, allIniModFiles, _destinationPath);

  // Set destination depending on file type

  log("info", "Installing ini files: ", allIniModFiles);
  const iniFileInstructions = allIniModFiles.map((file: string) => {
    const fileName = path.basename(file);
    const dest = reshade
      ? path.join(RESHADE_MOD_PATH, path.basename(file))
      : path.join(INI_MOD_PATH, fileName);

    return {
      type: "copy",
      source: file,
      destination: dest,
    };
  });

  const shaderFiles = files.filter(
    (file: string) => file.includes(RESHADE_SHADERS_DIR) && !file.endsWith(path.sep),
  );

  let shaderInstructions = [];

  if (reshade && shaderFiles.length !== 0) {
    log("info", "Installing shader files: ", shaderFiles);
    shaderInstructions = shaderFiles.map((file: string) => {
      const regex = /.*reshade-shaders/;
      const fileName = file.replace(regex, RESHADE_SHADERS_DIR);
      // log("info", "Shader dir Found. Processing: ", fileName);
      const dest = path.join(RESHADE_MOD_PATH, fileName);
      // log("debug", "Shader file: ", dest);
      return {
        type: "copy",
        source: file,
        destination: dest,
      };
    });
  }
  const instructions = [].concat(iniFileInstructions, shaderInstructions);
  log("debug", "Installing ini files with instructions: ", instructions);

  return Promise.resolve({ instructions });
};

const findCanonicalAsiDirs = (fileTree: FileTree) =>
  filesIn(ASI_MOD_PATH, matchAsiFile, fileTree);

const detectASICanonLayout = (fileTree: FileTree): boolean =>
  findCanonicalAsiDirs(fileTree).length > 0;

const findCanonicalAsiFiles = (fileTree: FileTree): string[] =>
  filesUnder(ASI_MOD_PATH, fileTree);

export const testForAsiMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  if (!detectASICanonLayout(fileTree)) {
    log("info", "Doesn't look like an ASI mod");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  return Promise.resolve({ supported: true, requiredFiles: [] });
};

const asiCanonLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirFiles = filesIn(ASI_MOD_PATH, matchAsiFile, fileTree).length > 0;

  if (!hasBasedirFiles) {
    return NoInstructions.NoMatch;
  }

  const allCanonAsiFiles = findCanonicalAsiFiles(fileTree);

  if (allCanonAsiFiles.length === 0) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: AsiLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonAsiFiles),
  };
};

export const installAsiMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const modname = makeSyntheticName(destinationPath);

  const chosenInstructions = asiCanonLayout(api, modname, fileTree);

  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    const message = "ASI installer failed to generate instructions";
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  const { instructions } = chosenInstructions;

  const haveFilesOutsideSelectedInstructions =
    instructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    const message = `Too many files in ASI Mod! ${instructions.length}`;
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  log("info", "ASI installer installing files.");
  log("debug", "ASI instructions: ", instructions);

  return Promise.resolve({ instructions });
};

// MultiType installer

export const testForMultiTypeMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const hasCanonCet = detectCetCanonLayout(fileTree);
  const hasCanonRedscript = detectRedscriptCanonOnlyLayout(fileTree);
  const hasBasedirRedscript = detectRedscriptBasedirLayout(fileTree);
  const hasCanonRed4Ext = detectRed4ExtCanonOnlyLayout(fileTree);
  const hasBasedirRed4Ext = detectRed4ExtBasedirLayout(fileTree);

  // The Onlys may need better naming.. they already check that
  // there's no basedir stuff, so we can use both here without
  // additional checks.
  const hasAtLeastTwoTypes =
    [
      hasCanonCet,
      hasCanonRedscript,
      hasBasedirRedscript,
      hasCanonRed4Ext,
      hasBasedirRed4Ext,
    ].filter(trueish).length > 1;

  if (!hasAtLeastTwoTypes) {
    api.log("debug", "MultiType didn't match");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  api.log("info", "MultiType mod detected", {
    hasCanonCet,
    hasCanonRedscript,
    hasBasedirRedscript,
    hasCanonRed4Ext,
    hasBasedirRed4Ext,
  });

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installMultiTypeMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  // Should extract this to wrapper..
  const modName = makeSyntheticName(destinationPath);

  // This should be more robust. Currently we kinda rely
  // on it being very unlikely that these kinds of mods
  // are broken in ways like having canon and basedir
  // stuff but that's not guaranteed.
  //
  // Defect: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/96

  // Also notable: Basedirs currently *override* Canon.
  // This is probably the desired behavior but I dunno
  // if we could at least make it somehow more obvious
  // in the naming scheme.. it's clearer in specific
  // installers where we choose one layout only.
  const allInstructionSets: LayoutToInstructions[] = [
    cetCanonLayout,
    redscriptBasedirLayout,
    redscriptCanonLayout,
    red4extBasedirLayout,
    red4extCanonLayout,
    archiveCanonLayout,
    archiveHeritageLayout,
  ];

  const allInstructionsPerLayout = useAllMatchingLayouts(
    api,
    modName,
    fileTree,
    allInstructionSets,
  );

  const allInstructions = allInstructionsPerLayout.flatMap((i) => i.instructions);

  // Should still add this..
  // warnUserIfArchivesMightNeedManualReview(api, instrs stils needed);
  const haveFilesOutsideSelectedInstructions =
    allInstructions.length !== fileCount(fileTree);

  if (allInstructionsPerLayout.length < 1 || haveFilesOutsideSelectedInstructions) {
    return useFallbackOrFailBasedOnUserDecision(api, InstallerType.MultiType, fileTree);
  }

  api.log("info", "MultiType installer installing files.");
  api.log("debug", "MultiType instructions: ", allInstructions);

  return Promise.resolve({ instructions: allInstructions });
};

// Setup stuff, pipeline

// Rather than keep the order by entering numbers,
// just keep the array ordered and we tag the
// installers with priority here
const addPriorityFrom = (start: number) => {
  const priorityAdder = (
    prioritized: InstallerWithPriority[],
    installer: Installer,
    index: number,
  ) => prioritized.concat({ priority: start + index, ...installer });

  return priorityAdder;
};

// Define the pipeline that we push mods through
// to find the correct installer. The installers
// are tried in priority order (keep them in order
// here), and the first one that returns `supported: true`
// will be used by Vortex to `install` the mod.
//
// General approach: try to detect the more specialized
// mod types first, and if none of those match, we probably
// have a simpler mod type like INI or Archive on our hands.
//
// Using Vortex parameter names here for convenience.
//
const installers: Installer[] = [
  {
    type: InstallerType.CoreCET,
    id: InstallerType.CoreCET,
    testSupported: testForCetCore,
    install: installCetCore,
  },
  {
    type: InstallerType.CoreRedscript,
    id: InstallerType.CoreRedscript,
    testSupported: testForRedscriptCore,
    install: installRedscriptCore,
  },
  {
    type: InstallerType.CoreRed4ext,
    id: InstallerType.CoreRed4ext,
    testSupported: testRed4ExtCore,
    install: installRed4ExtCore,
  },
  {
    type: InstallerType.CoreCSVMerge,
    id: InstallerType.CoreCSVMerge,
    testSupported: testCoreCsvMerge,
    install: installCoreCsvMerge,
  },
  {
    type: InstallerType.CoreWolvenKit,
    id: InstallerType.CoreWolvenKit,
    testSupported: testCoreWolvenKitCli,
    install: installCoreWolvenkit,
  },
  {
    type: InstallerType.ASI,
    id: InstallerType.ASI,
    testSupported: testForAsiMod,
    install: installAsiMod,
  },
  {
    type: InstallerType.MultiType,
    id: InstallerType.MultiType,
    testSupported: testForMultiTypeMod,
    install: installMultiTypeMod,
  },
  // Remove this once the mixes are fully moved,
  // currently this CET logic actually
  // Deprecate: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/82
  // {
  //   type: InstallerType.RedCetMix,
  //   id: "cp2077-red-cet-mixture-mod",
  //   testSupported: testForRedCetMixedMod,
  //   install: installRedCetMixedMod,
  // },
  {
    type: InstallerType.CET,
    id: InstallerType.CET,
    testSupported: testForCetMod,
    install: installCetMod,
  },
  {
    type: InstallerType.Redscript,
    id: InstallerType.Redscript,
    testSupported: testForRedscriptMod,
    install: installRedscriptMod,
  },
  {
    type: InstallerType.Red4Ext,
    id: InstallerType.Red4Ext,
    testSupported: testForRed4ExtMod,
    install: installRed4ExtMod,
  },
  /*
  {
    type: InstallerType.TweakDB,
    id: "cp2077-tweakdb-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.AXL,
    id: "cp2077-axl-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
*/
  {
    type: InstallerType.INI,
    id: InstallerType.INI,
    testSupported: testForIniMod,
    install: installIniMod,
  },
  /*
  {
    type: InstallerType.Config,
    id: "cp2077-config-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.Reshade,
    id: "cp2077-reshade-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.LUT,
    id: "cp2077-lut-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  }, */

  {
    type: InstallerType.Json,
    id: InstallerType.Json,
    testSupported: testForJsonMod,
    install: installJsonMod,
  },
  {
    type: InstallerType.ArchiveOnly,
    id: InstallerType.ArchiveOnly,
    testSupported: testForArchiveOnlyMod,
    install: installArchiveOnlyMod,
  },
  {
    type: InstallerType.Fallback,
    id: InstallerType.Fallback,
    testSupported: testAnyOtherModFallback,
    install: installAnyModFallback,
  },
];

export const installerPipeline: InstallerWithPriority[] = installers.reduce(
  addPriorityFrom(PRIORITY_STARTING_NUMBER),
  [],
);

export const wrapTestSupported =
  (
    vortex: VortexExtensionContext,
    vortexApiThing,
    installer: Installer,
  ): VortexTestSupportedFunc =>
  (files: string[], gameId: string, ...args) => {
    const vortexLog: VortexLogFunc = vortexApiThing.log;
    const vortexApi: VortexApi = {
      ...vortex.api,
      log: vortexApiThing.log,
    };

    if (gameId !== GAME_ID) {
      return Promise.resolve({ supported: false, requiredFiles: [] });
    }

    vortexLog("info", `Testing for ${installer.type}, input files: `, files);
    return installer.testSupported(
      vortexApi,
      vortexLog,
      files,
      fileTreeFromPaths(files),
      gameId,
      ...args,
    );
  };

export const wrapInstall =
  (
    vortex: VortexExtensionContext,
    vortexApiThing,
    installer: Installer,
  ): VortexInstallFunc =>
  (files: string[], ...args) => {
    const vortexLog: VortexLogFunc = vortexApiThing.log;
    const vortexApi: VortexApi = {
      ...vortex.api,
      log: vortexLog,
    };

    vortexLog("info", `Trying to install using ${installer.type}`);

    return installer.install(
      vortexApi,
      vortexLog,
      files,
      fileTreeFromPaths(files),
      ...args,
    );
  };

const testUsingPipelineOfInstallers: VortexWrappedTestSupportedFunc = async (
  _vortexApi: VortexApi,
  _vortexLog: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> =>
  // Test in ~~production~~ install!
  //
  // Seriously though, this does mean that nothing will run
  // after us. Anything that for some reason wants to be run
  // for CP2077 mods will need to run in the priority slots
  // before ours.
  //
  // Doing this avoids having to match the installer twice,
  // but if it turns out to be necessary... well, we can just
  // do that, then.
  Promise.resolve({ supported: true, requiredFiles: [] });

const installUsingPipelineOfInstallers: VortexWrappedInstallFunc = async (
  vortexApi: VortexApi,
  vortexLog: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
  gameId: string,
  progressDelegate: VortexProgressDelegate,
  choices?: unknown,
  unattended?: boolean,
): Promise<VortexInstallResult> => {
  const me = InstallerType.Pipeline;

  vortexApi.log(`info`, `${me}: input files: ${sourcePaths(fileTree)}`);

  let matchingInstaller: Installer;

  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const candidateInstaller of installerPipeline) {
      vortexApi.log(`debug`, `${me}: Trying ${candidateInstaller.type}`);
      // eslint-disable-next-line no-await-in-loop
      const testResult = await candidateInstaller.testSupported(
        vortexApi,
        vortexLog,
        files,
        fileTree,
        gameId,
      );

      if (testResult.supported === true) {
        vortexApi.log(`info`, `${me}: using ${candidateInstaller.type}`);
        matchingInstaller = candidateInstaller;
        break;
      }
    }
  } catch (ex) {
    const errorMessage = `${me}: error trying to find installer (should not happen): ${ex.message}`;
    vortexApi.log(`error`, errorMessage);
    vortexApi.log(`debug`, `Input files: `, sourcePaths(fileTree));
    return Promise.reject(new Error(errorMessage));
  }

  if (matchingInstaller === undefined) {
    const errorMessage = `${me}: should never reach this point, means no installer matched`;
    vortexApi.log(`error`, errorMessage);
    vortexApi.log(`debug`, `Input files: `, sourcePaths(fileTree));
    return Promise.reject(new Error(errorMessage));
  }

  try {
    const selectedInstructions = await matchingInstaller.install(
      vortexApi,
      vortexLog,
      files,
      fileTree,
      destinationPath,
      gameId,
      progressDelegate,
      choices,
      unattended,
    );

    vortexApi.log(`debug`, `${me}: installing using ${matchingInstaller.type}`);

    return Promise.resolve({
      instructions: selectedInstructions.instructions,
    });
  } catch (ex) {
    const errorMessage = `${me}: installation error: ${ex.message}`;
    vortexApi.log(`error`, errorMessage);
    vortexApi.log(`debug`, `Input files: `, sourcePaths(fileTree));
    return Promise.reject(new Error(errorMessage));
  }
};

export const internalPipelineInstaller: InstallerWithPriority = {
  priority: PRIORITY_FOR_PIPELINE_INSTALLER,
  type: InstallerType.Pipeline,
  id: InstallerType.Pipeline,
  testSupported: testUsingPipelineOfInstallers,
  install: installUsingPipelineOfInstallers,
};

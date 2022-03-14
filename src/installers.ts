import { readFileSync } from "fs";
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
} from "./filetree";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexProgressDelegate,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import {
  CET_GLOBAL_INI,
  CET_MOD_CANONICAL_INIT_FILE,
  CET_MOD_CANONICAL_PATH_PREFIX,
  RED4EXT_CORE_RED4EXT_DLL,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS,
  REDS_MOD_CANONICAL_EXTENSION,
  REDS_MOD_CANONICAL_PATH_PREFIX,
  RESHADE_MOD_PATH,
  RESHADE_SHADERS_DIR,
  INI_MOD_EXT,
  INI_MOD_PATH,
  MOD_FILE_EXT,
  JSON_FILE_EXT,
  KNOWN_JSON_FILES,
  ARCHIVE_ONLY_CANONICAL_EXT,
  ARCHIVE_ONLY_CANONICAL_PREFIX,
  ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX,
  ArchiveLayout,
  Instructions,
  InstructionsFromFileTree,
  NoInstructions,
  MaybeInstructions,
} from "./installers.layouts";
import {
  toSamePath,
  toDirInPath,
  instructionsForSourceToDestPairs,
  instructionsForSameSourceAndDestPaths,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import {
  fallbackInstallerReachedErrorDialog,
  redCetMixedStructureErrorDialog,
  redWithInvalidFilesErrorDialog,
  showArchiveInstallWarning,
  showArchiveStructureErrorDialog,
  showRed4ExtReservedDllErrorDialog,
} from "./dialogs";
import {
  testForCetCore,
  installCetCore,
  testForRedscriptCore,
  installRedscriptCore,
  testRed4ExtCore,
  installRed4ExtCore,
} from "./core-installers";

// Ensure we're using win32 conventions
const path = win32;

const GAME_ID = "cyberpunk2077";

const PRIORITY_STARTING_NUMBER = 30; // Why? Fomod is 20, then.. who knows? Don't go over 99
// I figured some wiggle room on either side is nice :) - Ellie

// Vortex gives us a 'destination path', which is actually
// the tempdir in which the archive is expanded into for
// the duration of the installation.
const makeModName = (vortexDestinationPath: string) =>
  path.basename(vortexDestinationPath, ".installing");

// Types

export enum InstallerType {
  CoreCET = "Core/CET", // #32
  CoreRedscript = "Core/Redscript", // #32
  CoreRed4ext = "Core/Red4ext", // #32
  CoreCSVMerge = "Core/CSVMerge", // #32
  RedCetMix = "RedCetMix",
  CET = "CET",
  Redscript = "Redscript",
  Red4Ext = "Red4ext", // #5
  TweakDB = "TweakDB", // #6
  AXL = "AXL", // #28
  INI = "INI", // #29
  Config = "Config", // #30
  Reshade = "Reshade", // #8
  LUT = "LUT", // #31
  ArchiveOnly = "ArchiveOnly",
  Json = "JSON",
  FallbackForOther = "FallbackForOther",
  NotSupported = "[Trying to install something not supported]",
}

export interface Installer {
  type: InstallerType;
  id: string;
  testSupported: VortexWrappedTestSupportedFunc;
  install: VortexWrappedInstallFunc;
}

export interface InstallerWithPriority extends Installer {
  priority: number;
}

// testSupported that always fails
//
export const notSupportedModType: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: false, requiredFiles: [] });

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

//   return Promise.resolve({ instructions });
// }

/**
 * @todo implement logic
 * @param _file a file to check
 * @returns true is the file is a reshade ini file, false otherwise
 */
const reshadeINI = (_file: string): boolean => false;

/**
 *
 * @param file Full file path string to check
 * @returns true if it looks like an INI mod file
 *
 * @todo distinguish Reshade ini files: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/8
 */
const matchIniFile = (file: string): boolean =>
  path.extname(file).toLowerCase() === INI_MOD_EXT && !reshadeINI(file);

const matchRedscript = (file: string) =>
  path.extname(file) === REDS_MOD_CANONICAL_EXTENSION;

const allRedscriptFiles = (files: string[]): string[] =>
  files.filter(matchRedscript);

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

export const testForRedCetMixedMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const fileTree = new KeyTree({ separator: path.sep });

  files.forEach((file) => fileTree.add(file, file));

  const moddir = fileTree._getNode(CET_MOD_CANONICAL_PATH_PREFIX); // eslint-disable-line no-underscore-dangle

  if (!moddir || moddir.children.length === 0) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const hasCetFilesInANamedModDir = moddir.children.some(
    (child) => child.getChild(CET_MOD_CANONICAL_INIT_FILE) !== null,
  );

  const redscriptFiles = allRedscriptFiles(files);
  if (hasCetFilesInANamedModDir && redscriptFiles.length === 0) {
    log("debug", "Have CET, but no redscript");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  return Promise.resolve({
    supported: hasCetFilesInANamedModDir,
    requiredFiles: [],
  });
};

// Install the Redscript stuff, as well as any archives we find
export const installRedCetMixedMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const fileTree: KeyTree = new KeyTree({ separator: path.sep });
  files.forEach((file) => fileTree.add(path.dirname(file), file));

  // We could get a lot fancier here, but for now we don't accept
  // subdirectories anywhere other than in a canonical location.

  // .\*.reds -- not actually wanted in this case. we only will allow installation if all files are packaged nicely
  const topLevelReds = fileTree.get(".").filter(matchRedscript);
  if (topLevelReds.length > 0) {
    const message =
      "The reds are not correctly structured, installing through vortex isn't possible.";
    redCetMixedStructureErrorDialog(api, log, message, files);
    return Promise.reject(new Error(message));
  }
  // .\r6\scripts\*.reds
  const redsDirReds = fileTree
    .get(REDS_MOD_CANONICAL_PATH_PREFIX)
    .filter(matchRedscript);

  // We also only accept one subdir, anything else might be trouble
  // But grab everything under it.

  const base = fileTree._getNode(REDS_MOD_CANONICAL_PATH_PREFIX); // eslint-disable-line no-underscore-dangle

  // .\r6\scripts\[mod]\**\*
  const canonRedsModFiles =
    base && base.children.length === 1
      ? fileTree.getSub(
          path.join(REDS_MOD_CANONICAL_PATH_PREFIX, base.children[0].key),
        )
      : [];

  const cetFiles = allCanonicalCetFiles(files);

  if (cetFiles.length === 0) {
    return Promise.reject(
      new Error("Red + CET install but no CET files, should never get here"),
    );
  }

  const installableReds = [canonRedsModFiles, redsDirReds].filter(
    (location) => location.length > 0,
  );

  if (installableReds.length === 0) {
    const message = "No Redscript found, should never get here.";
    log("error", `Redscript Mod installer: ${message}`, files);
    return Promise.reject(new Error(message));
  }

  // Only allow installation if all of the reds are either in their subfolder or not.
  if (installableReds.length > 1) {
    const message = "Conflicting Redscript locations, bailing out!";
    redWithInvalidFilesErrorDialog(api, log, message, files, installableReds);

    return Promise.reject(new Error(message));
  }

  // since cet has to be in a mod dir, lets use it's mod dir name for the reds if there is none.
  const moddir = fileTree._getNode(CET_MOD_CANONICAL_PATH_PREFIX); // eslint-disable-line no-underscore-dangle
  const modName = moddir.children[0].key;

  // Let's grab archives too
  const archiveOnlyFiles = allCanonicalArchiveOnlyFiles(files);

  // Only one of these should exist but why discriminate?
  const allSourcesAndDestinations = [
    canonRedsModFiles.map(toSamePath),
    redsDirReds.map(toDirInPath(REDS_MOD_CANONICAL_PATH_PREFIX, modName)),
    cetFiles.map(toSamePath),
    archiveOnlyFiles.map(toSamePath),
  ];

  const instructions = allSourcesAndDestinations.flatMap(
    instructionsForSourceToDestPairs,
  );

  return Promise.resolve({ instructions });
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
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const fileTree = new KeyTree({ separator: path.sep });

  files.forEach((file) => fileTree.add(file, file));

  const moddir = fileTree._getNode(CET_MOD_CANONICAL_PATH_PREFIX); // eslint-disable-line no-underscore-dangle

  if (!moddir || moddir.children.length === 0) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const hasCetFilesInANamedModDir = moddir.children.some(
    (child) => child.getChild(CET_MOD_CANONICAL_INIT_FILE) !== null,
  );

  if (hasCetFilesInANamedModDir) {
    log("info", `Matching CET installer: ${hasCetFilesInANamedModDir}`);
  }

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
export const installRedscriptMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const fileTree: KeyTree = new KeyTree({ separator: path.sep });
  files.forEach((file) => fileTree.add(path.dirname(file), file));

  // We could get a lot fancier here, but for now we don't accept
  // subdirectories anywhere other than in a canonical location.

  // .\*.reds
  const topLevelReds = fileTree.get(".").filter(matchRedscript);
  // .\r6\scripts\*.reds
  const redsDirReds = fileTree
    .get(REDS_MOD_CANONICAL_PATH_PREFIX)
    .filter(matchRedscript);

  // We also only accept one subdir, anything else might be trouble
  // But grab everything under it.

  const base = fileTree._getNode(REDS_MOD_CANONICAL_PATH_PREFIX); // eslint-disable-line no-underscore-dangle

  // .\r6\scripts\[mod]\**\*
  const canonRedsModFiles =
    base && base.children.length === 1
      ? fileTree.getSub(
          path.join(REDS_MOD_CANONICAL_PATH_PREFIX, base.children[0].key),
        )
      : [];

  const installable = [canonRedsModFiles, redsDirReds, topLevelReds].filter(
    (location) => location.length > 0,
  );

  if (installable.length === 0) {
    const message = "No Redscript found, should never get here.";
    log("error", `Redscript Mod installer: ${message}`, files);
    return Promise.reject(new Error(message));
  }

  if (installable.length > 1) {
    const message = "Conflicting Redscript locations, bailing out!";
    log("error", `Redscript Mod installer: ${message}`, files);

    // It'd be nicer to move at least the long text out, maybe constant
    // for text + function for handling the boilerplate?
    api.showDialog(
      "error",
      message,
      {
        md:
          "I found several possible Redscript layouts, but can only support " +
          "one layout per mod. This mod can't be installed! You will have to fix the " +
          "mod manually _outside_ Vortex for now.\n" +
          "\n" +
          "Supported layouts:\n" +
          " - `.\\r6\\scripts\\[modname]\\[any files and subfolders]` (canonical)\n" +
          " - `.\\r6\\scripts\\*.reds` (I can fix this to canonical)\n" +
          " - `.\\*.reds` (I can fix this to canonical)\n" +
          "\n" +
          "Got:\n" +
          `${installable.join("\n")}`,
      },
      [{ label: "Ok, Mod Was Not Installed" }],
    );

    return Promise.reject(new Error(message));
  }

  const modName = makeModName(destinationPath);

  // Let's grab archives too
  const archiveOnlyFiles = allCanonicalArchiveOnlyFiles(files);

  // Only one of these should exist but why discriminate?
  const allSourcesAndDestinations = [
    canonRedsModFiles.map(toSamePath),
    redsDirReds.map(toDirInPath(REDS_MOD_CANONICAL_PATH_PREFIX, modName)),
    topLevelReds.map(toDirInPath(REDS_MOD_CANONICAL_PATH_PREFIX, modName)),
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
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS.includes(path.join(dir));
const reservedDllName = (file: string) =>
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS.includes(path.join(file));

export const testForRed4ExtMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const allDllDirs = findAllSubdirsWithSome(FILETREE_ROOT, matchDll, fileTree);
  const toplevelDlls = filesIn(FILETREE_ROOT, fileTree, matchDll);

  if (allDllDirs.length < 1 && toplevelDlls.length < 1) {
    log("info", "Doesn't look like a Red4Ext mod");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const dangerPaths = [
    ...allDllDirs.filter(reservedDllDir),
    ...toplevelDlls.filter(reservedDllName),
  ];

  if (dangerPaths.length !== 0) {
    const message = "Red4Ext Mod Installation Canceled, Dangerous DLL paths!";
    log("error", message, dangerPaths);
    showRed4ExtReservedDllErrorDialog(api, message, dangerPaths);
    return Promise.reject(new Error(message));
  }

  if (pathInTree(RED4EXT_CORE_RED4EXT_DLL, fileTree)) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  return Promise.resolve({ supported: true, requiredFiles: [] });
};

// ArchiveOnly

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
      log(
        "info",
        "Other mod folder exist... probably an archive as part of those.",
      );
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

const archiveCanonInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasCanonFiles = dirWithSomeUnder(
    ARCHIVE_ONLY_CANONICAL_PREFIX,
    matchArchive,
    fileTree,
  );

  if (!hasCanonFiles) {
    return NoInstructions.NoMatch;
  }

  const allCanonFiles = filesUnder(ARCHIVE_ONLY_CANONICAL_PREFIX, fileTree);

  return {
    kind: ArchiveLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonFiles),
  };
};

const archiveOldToNewCanonInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasOldCanonFiles = dirWithSomeUnder(
    ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX,
    matchArchive,
    fileTree,
  );

  if (!hasOldCanonFiles) {
    return NoInstructions.NoMatch;
  }

  const oldCanonFiles = filesUnder(
    ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX,
    fileTree,
  );

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

const archiveOtherDirsToCanonInstructions = (
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

const warnUserIfModMightNeedManualReview = (
  api: VortexApi,
  chosenInstructions: Instructions,
) => {
  // Trying out the tree-based approach..
  const destinationPaths = chosenInstructions.instructions.map(
    (i) => i.destination,
  );
  const newTree = fileTreeFromPaths(destinationPaths);

  const warnAboutSubdirs =
    subdirsIn(ARCHIVE_ONLY_CANONICAL_PREFIX, newTree).length > 0;

  const hasMultipleTopLevelFiles =
    filesIn(ARCHIVE_ONLY_CANONICAL_PREFIX, newTree, matchArchive).length > 1;

  const multipleTopLevelsMightBeIntended =
    chosenInstructions.kind !== ArchiveLayout.Other;

  const warnAboutToplevel =
    !multipleTopLevelsMightBeIntended && hasMultipleTopLevelFiles;

  if (warnAboutSubdirs || warnAboutToplevel) {
    showArchiveInstallWarning(
      api,
      warnAboutSubdirs,
      warnAboutToplevel,
      destinationPaths,
    );
  }
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
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const fileTree = fileTreeFromPaths(files);
  const fileCount = filesUnder(FILETREE_ROOT, fileTree).length;

  // Once again we could get fancy, but let's not

  const possibleLayoutsToTryInOrder: InstructionsFromFileTree[] = [
    archiveCanonInstructions,
    archiveOldToNewCanonInstructions,
    archiveOtherDirsToCanonInstructions,
  ];

  const chosenInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    possibleLayoutsToTryInOrder,
  );

  if (chosenInstructions === NoInstructions.NoMatch) {
    const message =
      "ArchiveOnly installer failed to generate any instructions!";
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  const haveFilesOutsideSelectedInstructions =
    chosenInstructions.instructions.length !== fileCount;

  if (haveFilesOutsideSelectedInstructions) {
    const message = "Conflicting layouts for Archive mod!";

    showArchiveStructureErrorDialog(api, message, files);

    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  warnUserIfModMightNeedManualReview(api, chosenInstructions);

  log("info", "ArchiveOnly installer installing files.");
  log("debug", "ArchiveOnly instructions: ", chosenInstructions.instructions);

  return Promise.resolve({ instructions: chosenInstructions.instructions });
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

  // just make sure we don't somehow have a CET mod that got here
  const cetModJson = files.filter(
    (file: string) =>
      path.basename(file).toLowerCase() === CET_MOD_CANONICAL_INIT_FILE,
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
  const options = filtered.some((file: string) =>
    file.endsWith("options.json"),
  );
  if (options) {
    log("debug", "Options.json files found: ", options);
    proper = filtered.some((f: string) =>
      path
        .dirname(f)
        .toLowerCase()
        .startsWith(path.normalize("r6/config/settings")),
    );

    if (!proper) {
      const message =
        "Improperly located options.json file found.  We don't know where it belongs.";

      log("info", message);
      return Promise.reject(new Error(message));
    }
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
  const filtered: string[] = files.filter(
    (file: string) => path.extname(file) !== "",
  );
  log("info", "Located JSON files: ", filtered);

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

  if (movedJson)
    log(
      "info",
      "JSON files were found outside their canonical locations: Fixed",
    );

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

  const data = readFileSync(fileToExamine, { encoding: "utf8" });

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
    (file: string) =>
      file.includes(RESHADE_SHADERS_DIR) && !file.endsWith(path.sep),
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

// Fallback

/**
 * Checks to see if the mod has any expected files in unexpected places
 * @param files list of files
 * @param gameId The internal game id
 * @returns Promise which details if the files passed in need to make use of a specific installation method
 */
export const testAnyOtherModFallback: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _gameId: string,
): Promise<VortexTestResult> => {
  const hasIniMod = files.some(matchIniFile);
  log("debug", "Probably INI mods: ", hasIniMod);

  // if (hasIniMod) {
  //   log("info", "mod supported by this installer");
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
  // }

  // log("warn", "I dunno. Can't do nothing about this.");
  // return Promise.resolve({
  //   supported: false,
  //   requiredFiles: [],
  // });
};

/**
 * Installs files while correcting the directory structure as we go.
 * @param files a list of files to be installed
 * @returns a promise with an array detailing what files to install and how
 */
export const installAnyModWithBasicFixes: VortexWrappedInstallFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const filtered = files.filter((file: string) => !file.endsWith(path.sep));
  const instr = filtered.map((file) => ({
    type: "copy",
    source: file,
    destination: path.join(INI_MOD_PATH, path.basename(file)),
  }));

  const instructions = [].concat(instr);

  const message =
    "The Fallback installer was reached.  The mod has been installed, but may not function as expected.";
  fallbackInstallerReachedErrorDialog(
    _api,
    log,
    message,
    filtered,
    instructions,
  );

  return Promise.resolve({ instructions });
};

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
    id: "cp2077-core-cet-mod",
    testSupported: testForCetCore,
    install: installCetCore,
  },
  {
    type: InstallerType.CoreRedscript,
    id: "cp2077-core-redscript-mod",
    testSupported: testForRedscriptCore,
    install: installRedscriptCore,
  },
  {
    type: InstallerType.CoreRed4ext,
    id: "cp2077-core-red4ext-mod",
    testSupported: testRed4ExtCore,
    install: installRed4ExtCore,
  },
  /*
    {
      type: InstallerType.CoreCSVMerge,
      id: "cp2077-core-csvmerge-mod",
      testSupported: notSupportedModType,
      install: notInstallableMod,
    },
    */
  {
    type: InstallerType.RedCetMix,
    id: "cp2077-red-cet-mixture-mod",
    testSupported: testForRedCetMixedMod,
    install: installRedCetMixedMod,
  },
  {
    type: InstallerType.CET,
    id: "cp2077-cet-mod",
    testSupported: testForCetMod,
    install: installCetMod,
  },
  {
    type: InstallerType.Redscript,
    id: "cp2077-redscript-mod",
    testSupported: testForRedscriptMod,
    install: installRedscriptMod,
  },
  {
    type: InstallerType.Red4Ext,
    id: "cp2077-red4ext-mod",
    testSupported: testForRed4ExtMod,
    // install: installRed4ExtMod,
    install: notInstallableMod,
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
  {
    type: InstallerType.INI,
    id: "cp2077-ini-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
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
    id: "cp2077-json-mod",
    testSupported: testForJsonMod,
    install: installJsonMod,
  },
  {
    type: InstallerType.ArchiveOnly,
    id: "cp2077-basic-archive-mod",
    testSupported: testForArchiveOnlyMod,
    install: installArchiveOnlyMod,
  },
  {
    type: InstallerType.FallbackForOther,
    id: "cp2077-fallback-for-others-mod",
    testSupported: testAnyOtherModFallback,
    install: installAnyModWithBasicFixes,
  },
];

export const installerPipeline: InstallerWithPriority[] = installers.reduce(
  addPriorityFrom(PRIORITY_STARTING_NUMBER),
  [],
);

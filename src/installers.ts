import { win32 } from "path";
import KeyTree from "key-tree";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies

// Ensure we're using win32 conventions
const path = win32;

// We need to 'DI' the logger for tests because we
// don't have the Vortex environment like we will
// at regular runtime.
const noop = (..._) => {};
const log =
  process.env.NODE_ENV === "test" || process.env.WEBPACK_BUILD === "true"
    ? noop
    : require("vortex-api").log; // eslint-disable-line @typescript-eslint/no-var-requires

/** Correct Directory structure:
 * root_folder
 * |-📁 archive
 * | |-📁 pc
 * | | |-📁 mod
 * | | | |- 📄 *.archive
 * |-📁 bin
 * | |-📁 x64
 * | | |-📁 plugins
 * | | | |-📁 cyber_engine_tweaks
 * | | | | |-📁 mods
 * | | | | | |-📁 SomeMod
 * | | | | | | |- 📄 init.lua
 * | | | | | | |- Whatever structure the mod wants
 * |-📁 engine
 * | |-📁 config
 * | | |-📁 platform
 * | | | |-📁 pc
 * | | | | |-📄 *.ini -- Typically loose files, no subdirs
 * |-📁 r6
 * | |-📁 config
 * | | |-📄 *.xml (68.2 kB)
 * | |-📁 scripts
 * | | |-📁 SomeMod
 * | | | |-📄 *.reds
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MEOW_FOR_COMMENTS = 0;
/**
 * The extension game id
 */
const GAME_ID = "cyberpunk2077";
/**
 * The path where an archive file should lay
 */
const ARCHIVE_MOD_PATH = path.join("archive", "pc", "mod");
/**
 *  The path where INI files should lay
 */
const INI_MOD_PATH = path.join("engine", "config", "platform", "pc");
const INI_MOD_EXT = ".ini";
/**
 * The path where redscript files should lay
 */
const REDSCRIPT_PATH = path.join("r6", "scripts");
/**
 * The extension of most mods
 */
const MOD_FILE_EXT = ".archive";
/**
 * The extension of a RedScript file
 */
const REDSCRIPT_FILE_EXT = ".reds";
/**
 * The extension of a lua/CET file
 */
const LUA_FILE_EXT = ".lua";

const PRIORITY_STARTING_NUMBER = 30; // Why? Fomod is 20, then.. who knows? Don't go over 99

// Types

export enum InstallerType {
  CET = "CET", // #13
  Redscript = "Redscript", // #27
  Red4Ext = "Red4ext", // #5
  TweakDB = "TweakDB", // #6
  AXL = "AXL", // #28
  INI = "INI", // #29
  Config = "Config", // #30
  Reshade = "Reshade", // #8
  LUT = "LUT", // #31
  CoreCET = "Core/CET", // #32
  CoreRedscript = "Core/Redscript", // #32
  CoreRed4ext = "Core/Red4ext", // #32
  CoreCSVMerge = "Core/CSVMerge", // #32
  ArchiveOnly = "ArchiveOnly",
  FallbackForOther = "FallbackForOther",
  NotSupported = "[Trying to install something not supported]",
}
export interface Installer {
  type: InstallerType;
  id: string;
  testSupported: Vortex.TestSupported;
  install: Vortex.InstallFunc;
}
export interface InstallerWithPriority extends Installer {
  priority: number;
}

// testSupported that always fails
//
export const notSupportedModType: Vortex.TestSupported = (
  _files: string[],
  _gameId: string,
): Promise<Vortex.ISupportedResult> =>
  Promise.resolve({ supported: false, requiredFiles: [] });

// install that always fails
//
export const notInstallableMod: Vortex.InstallFunc = (
  _files: string[],
  _destinationPath: string,
  _gameId: string,
  _progressDelegate: Vortex.ProgressDelegate,
) => {
  throw new Error("Should never get here");
};
// /**
//  * Installs files as is
//  * @param files a list of files to be installed
//  * @returns a promise with an array detailing what files to install and how
//  */
// function installWithCorrectStructure(files: string[]) {
//   // Everything is placed in the correct structure, so just install it as is
//   // log('info', 'installing files for a game')
//   const instructions = files.map((file: string) => {
//     log("debug", "Installing file found on standard path: ", file);
//     return {
//       type: "copy",
//       source: file,
//       destination: path.join(file),
//     };
//   });

//   return Promise.resolve({ instructions });
// }

/**
 * @todo implement logic
 * @param _file a file to check
 * @returns true is the file is a reshade ini file, false otherwise
 */
function reshadeINI(_file: string): boolean {
  return false;
}

/**
 *
 * @param file Full file path string to check
 * @returns true if it looks like an INI mod file
 *
 * @todo distinguish Reshade ini files: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/8
 */
function matchIniFile(file: string): boolean {
  return path.extname(file).toLowerCase() === INI_MOD_EXT && !reshadeINI(file);
}

// Drop any folders and duplicates from the file list,
// and then create the instructions.
const instructionsForSameSourceAndDestPaths = (files: string[]) => {
  const justTheRegularFiles = files.filter(
    (f: string) => !f.endsWith(path.sep),
  );

  const uniqueFiles = [...new Set(justTheRegularFiles).values()];

  const instructions: Vortex.IInstruction[] = uniqueFiles.map(
    (file: string): Vortex.IInstruction => ({
      type: "copy",
      source: file,
      destination: file,
    }),
  );

  return { instructions };
};

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

export const CET_MOD_CANONICAL_INIT_FILE = "init.lua";
export const CET_MOD_CANONICAL_PATH_PREFIX = path.normalize(
  "bin/x64/plugins/cyber_engine_tweaks/mods",
);

const allCetFiles = (files: string[]) =>
  allFilesInFolder(CET_MOD_CANONICAL_PATH_PREFIX, files);

export const ARCHIVE_ONLY_CANONICAL_PATH_PREFIX =
  path.normalize("archive/pc/mod/");

const allArchiveOnlyFiles = (files: string[]) =>
  allFilesInFolder(ARCHIVE_ONLY_CANONICAL_PATH_PREFIX, files);

// CET

// CET mods are detected by:
//
// 1. Require bin\x64\plugins\cyber_engine_tweaks\mods\MODNAME\init.lua
//

export const testForCetMod: Vortex.TestSupported = (
  files: string[],
): Promise<Vortex.ISupportedResult> => {
  log("debug", "Starting matcher, input files: ", files);

  const fileTree = new KeyTree({ separator: path.sep });

  files.forEach((file) => fileTree.add(file, file));

  const moddir = fileTree._getNode(CET_MOD_CANONICAL_PATH_PREFIX); // eslint-disable-line no-underscore-dangle

  if (!moddir || moddir.children.length === 0) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const hasIniFilesInANamedModDir = moddir.children.some(
    (child) => child.getChild(CET_MOD_CANONICAL_INIT_FILE) !== null,
  );

  if (hasIniFilesInANamedModDir) {
    log("info", `Matching CET installer: ${hasIniFilesInANamedModDir}`);
  }

  return Promise.resolve({
    supported: hasIniFilesInANamedModDir,
    requiredFiles: [],
  });
};

// Install the CET stuff, as well as any archives we find
export const installCetMod: Vortex.InstallFunc = (
  files: string[],
): Promise<Vortex.IInstallResult> => {
  log("info", "Using CET installer");

  const cetFiles = allCetFiles(files);

  if (cetFiles.length === 0) {
    return Promise.reject(
      new Error("CET install but no CET files, should never get here"),
    );
  }

  // Let's grab anything else we might reasonably have
  const archiveOnlyFiles = allArchiveOnlyFiles(files);

  const allTheFiles = cetFiles.concat(archiveOnlyFiles);

  const instructions = instructionsForSameSourceAndDestPaths(allTheFiles);

  return Promise.resolve(instructions);
};

// ArchiveOnly

export const testForArchiveOnlyMod: Vortex.TestSupported = (
  files: string[],
  gameId: string,
): Promise<Vortex.ISupportedResult> => {
  // Make sure we're able to support this mod.
  const correctGame = gameId === GAME_ID;
  log("info", "Checking bad structure of mod for a game: ", gameId);
  if (!correctGame) {
    // no mods?
    const supported = false;
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
  }
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

/**
 * Installs files while correcting the directory structure as we go.
 * @param files a list of files to be installed
 * @returns a promise with an array detailing what files to install and how
 */
export const installArchiveOnlyMod: Vortex.InstallFunc = (
  files: string[],
): Promise<Vortex.IInstallResult> => {
  // since this installer is only called when there is for sure only archive files, just need to get the files
  const filtered: string[] = files.filter(
    (file: string) => path.extname(file) !== "",
  );

  // Set destination to be 'archive/pc/mod/[file].archive'
  log("info", "Installing archive files: ", filtered);
  const archiveFileInstructions = filtered.map((file: string) => {
    const fileName = path.basename(file);
    const dest = path.join(ARCHIVE_MOD_PATH, fileName);
    return {
      type: "copy",
      source: file,
      destination: dest,
    };
  });
  log("debug", "Installing archive files with: ", archiveFileInstructions);

  const instructions = [].concat(archiveFileInstructions);

  return Promise.resolve({ instructions });
};

// Fallback

/**
 * Checks to see if the mod has any expected files in unexpected places
 * @param files list of files
 * @param gameId The internal game id
 * @returns Promise which details if the files passed in need to make use of a specific installation method
 */
export const testAnyOtherModFallback: Vortex.TestSupported = (
  files: string[],
  gameId: string,
): Promise<Vortex.ISupportedResult> => {
  log("debug", "Checking Files: ", files);

  // Make sure we're able to support this mod.
  const correctGame = gameId === GAME_ID;
  log("info", "Checking bad structure of mod for a game: ", gameId);
  if (!correctGame) {
    // no mods?
    const supported = false;
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
  }

  // Make sure we're able to support this mod.
  const hasArchiveMod =
    files.find(
      (file: string) => path.extname(file).toLowerCase() === MOD_FILE_EXT,
    ) !== undefined;
  log("debug", "Probably archives: ", hasArchiveMod);

  const hasIniMod = files.some(matchIniFile);
  log("debug", "Probably INI mods: ", hasIniMod);

  const hasRedScript =
    files.find(
      (file: string) => path.extname(file).toLowerCase() === REDSCRIPT_FILE_EXT,
    ) !== undefined;
  log("debug", "Possibly RedScripts: ", hasRedScript);

  const hasCetScript =
    files.find(
      (file: string) => path.extname(file).toLowerCase() === LUA_FILE_EXT,
    ) !== undefined;
  log("debug", "Possible CET Scripts: ", hasCetScript);

  if (hasArchiveMod || hasIniMod || hasRedScript || hasCetScript) {
    const supported = true;
    log("info", "mod supported by this installer");
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
  }

  const supported = false;
  log("warn", "I dunno. Can't do nothing about this.");
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
};

// /**
//  * A check with complex logic that I wanted pulled out of the main function
//  * @param cleanArchive Whether the archive files are correct or not
//  * @param cleanReds whether the redscript files are correct or not
//  * @param cleanCet Whether the cet files are correct or not
//  * @returns true when all files that need to be in the right place are in the right place, false otherwise
//  */
// function complexCleanCheckLogic(cleanArchive, cleanReds, cleanCet) {
//   // At least one of the files needs to be defined, otherwise it can't be garunteed they are all okay or something.
//   if (
//     ((cleanArchive !== undefined && cleanArchive === true) ||
//       cleanArchive === undefined) &&
//     ((cleanReds !== undefined && cleanReds === true) ||
//       cleanReds === undefined) &&
//     ((cleanCet !== undefined && cleanCet === true) || cleanCet === undefined) &&
//     (cleanArchive !== undefined ||
//       cleanReds !== undefined ||
//       cleanCet !== undefined)
//   ) {
//     return true;
//   } else {
//     return false;
//   }
// }

/**
 * A helper for redscript files
 * @param redFiles redscript files
 * @param genericModName a mod folder if everyhting is awful
 * @returns an array of instructions for the files
 */
function redScriptInstallationHelper(
  redFiles: string[],
  _genericModName: string,
) {
  //   let files = redFiles.filter((f) => !path.extname(f));

  // Ensure all the RedScript files are in their own mod directory. (Should have been checked beforehand)
  const normalizedFiltered = redFiles.map((file: string) =>
    file.includes(REDSCRIPT_PATH) ? file : path.join(REDSCRIPT_PATH, file),
  );

  // Set destination to be 'r6/scripts/ModFolder/[file].reds'
  const instructions = normalizedFiltered.map((file: string) => ({
    type: "copy",
    source: file,
    destination: path.join(REDSCRIPT_PATH, path.basename(file)),
  }));

  return instructions;
}

// /**
//  * A helper for any other files
//  * @param files any files
//  * @param genericModName a mod folder if everyhting is awful
//  * @returns an array of instructions for the files
//  */
// function genericFileInstallationHelper(files: string[], genericModName: string) {
//   files = files.filter((f) => !path.extname(f));
//   // if the leftover file is under the archive path, we can ignore it as it is not an archive file and the game wouldn't load it
//   let filtered = files.filter((file: string) => {
//     !file.includes(ARCHIVE_MOD_PATH);
//   });

//   // else if it is a part of the redscript or cet path, we should install it in same relative location as we do for those scripts
//   let cetFiles = files.filter((file: string) => {
//     file.includes(CET_SCRIPT_PATH);
//   });
//   let normalizedCET = cetFiles.map((file: string) => {
//     let maybeModInFolder = file.replace(CET_SCRIPT_PATH, "");
//     let parted = path.dirname(maybeModInFolder).split(path.sep);
//     if (parted.length > 1) {
//       return maybeModInFolder;
//     } else {
//       return path.join(CET_SCRIPT_PATH, genericModName, maybeModInFolder);
//     }
//   });
//   let redFiles = files.filter((file: string) => {
//     file.includes(REDSCRIPT_PATH);
//   });
//   let normalizedReds = redFiles.map((file: string) => {
//     let maybeModInFolder = file.replace(REDSCRIPT_PATH, "");
//     let parted = path.dirname(maybeModInFolder).split(path.sep);
//     if (parted.length > 1) {
//       return maybeModInFolder;
//     } else {
//       return path.join(REDSCRIPT_PATH, genericModName, maybeModInFolder);
//     }
//   });

//   // otherwise, install it in same location that it is in in the archive, as it is likely already in the correct location
//   let leftOvers = filtered.filter((file: string) => {
//     !cetFiles.includes(file) && !redFiles.includes(file);
//   });

//   let rebuiltFiles = normalizedCET.concat(normalizedReds, leftOvers);

//   let instructions = rebuiltFiles.map((file: string) => {
//     log(
//       "debug",
//       "Correcting Generic file found with a bad path: ".concat(file)
//     );
//     return {
//       type: "copy",
//       source: file,
//       destination: path.join(file),
//     };
//   });

//   return instructions;
// }

/**
 * Installs files while correcting the directory structure as we go.
 * @param files a list of files to be installed
 * @returns a promise with an array detailing what files to install and how
 */
export const installAnyModWithBasicFixes: Vortex.InstallFunc = (
  files: string[],
  destinationPath: string,
): Promise<Vortex.IInstallResult> => {
  // Grab the archive name for putting CET files and Redscript into
  const archiveName = path.basename(destinationPath, ".installing");

  // gather the archive files.
  const someArchiveModFile = files.find(
    (file: string) => path.extname(file).toLowerCase() === MOD_FILE_EXT,
  );
  let filteredArchives: string[];
  if (someArchiveModFile !== undefined) {
    const theArchivePathAsIs = path.dirname(someArchiveModFile);
    filteredArchives = files.filter(
      (file: string) =>
        path.dirname(file) === theArchivePathAsIs ||
        path.extname(file).toLowerCase() === MOD_FILE_EXT,
    );
  } else {
    filteredArchives = [];
  }

  // Gather any INI files
  const iniModFiles = files.filter(matchIniFile);

  // gather the RedScript files.
  const someRedscriptModFile = files.find(
    (file: string) => path.extname(file).toLowerCase() === REDSCRIPT_FILE_EXT,
  );
  let filteredReds: string[];
  if (someRedscriptModFile !== undefined) {
    const theRedscriptPathAsIs = path.dirname(someRedscriptModFile);
    filteredReds = files.filter(
      (file: string) =>
        path.dirname(file) === theRedscriptPathAsIs ||
        path.extname(file).toLowerCase() === REDSCRIPT_FILE_EXT,
    );
  } else {
    filteredReds = [];
  }
  //   let everythingElse = files.filter((file: string) => {
  //     !path.extname(file) &&
  //       !filteredArchives.includes(file) &&
  //       !filteredReds.includes(file) &&
  //       !filteredCet.includes(file);
  //   });

  // Set destination to be 'archive/pc/mod/[file].archive'
  log("info", "Correcting archive files: ", filteredArchives);
  const archiveFileInstructions = filteredArchives.map((file: string) => ({
    type: "copy",
    source: file,
    destination: path.join(ARCHIVE_MOD_PATH, path.basename(file)),
  }));
  log("debug", "Installing archive files with: ", archiveFileInstructions);

  log("info", "Correcting INI mod files: ", iniModFiles);
  const iniModInstructions = iniModFiles.map((file) => ({
    type: "copy",
    source: file,
    destination: path.join(INI_MOD_PATH, path.basename(file)),
  }));
  log("debug", "Installing INI mod files with: ", iniModInstructions);

  log("info", "Correcting redscript mod files: ", filteredReds);
  const redScriptInstructions = redScriptInstallationHelper(
    filteredReds,
    archiveName,
  );
  log("debug", "Installing redscript mod files with: ", redScriptInstructions);

  //   let everythingLeftOverInstructions = genericFileInstallationHelper(
  //     everythingElse,
  //     genericModName
  //   );
  //   log("debug", "Installing everything else with: ", cetScriptInstructions);

  const instructions = [].concat(
    archiveFileInstructions,
    iniModInstructions,
    redScriptInstructions,
    // everythingLeftOverInstructions
  );

  return Promise.resolve({ instructions });
};

// Rather than keep the order by entering numbers,
// just keep the array ordered and we tag the
// installers with priority here
const addPriorityFrom = (start: number) => {
  const f = (
    prioritized: InstallerWithPriority[],
    installer: Installer,
    index: number,
  ) => prioritized.concat({ priority: start + index, ...installer });

  return f;
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
export const installerPipeline: InstallerWithPriority[] = [
  {
    type: InstallerType.CET,
    id: "cp2077-cet-mod",
    testSupported: testForCetMod,
    install: installCetMod,
  },
  /*
  {
    type: InstallerType.Redscript,
    id: "cp2077-redscript-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.Red4Ext,
    id: "cp2077-red4ext-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
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
  },
  {
    type: InstallerType.CoreCET,
    id: "cp2077-core-cet-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.CoreRedscript,
    id: "cp2077-core-redscript-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.CoreRed4ext,
    id: "cp2077-core-red4ext-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  {
    type: InstallerType.CoreCSVMerge,
    id: "cp2077-core-csvmerge-mod",
    testSupported: notSupportedModType,
    install: notInstallableMod,
  },
  */
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
].reduce(addPriorityFrom(PRIORITY_STARTING_NUMBER), []);

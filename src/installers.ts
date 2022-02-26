import path from "path";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies

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
 * The path where CET files should lay
 */
const CET_SCRIPT_PATH = path.join(
  "bin",
  "x64",
  "plugins",
  "cyber_engine_tweaks",
  "mods",
);
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

// Types

export enum InstallerType {
  ArchiveOnly = "ArchiveOnly",
  Other = "Other",
}
export interface Installer {
  type: InstallerType;
  id: string;
  priority: number;
  testSupported: Vortex.TestSupported;
  install: Vortex.InstallFunc;
}

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
function reshadeINI(file: string): boolean {
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

const matchCetInitFile = (file: string) =>
  path.basename(file).toLowerCase() === "init.lua";

// If we have a CET mod, we have to assume the init.lua file is
// in a directory that is *just* the CET side of things. That is,
// we could have an init.lua at the top level if there's no non-CET
// artifacts. If there are, the mod /has to/ use a different path
// for that and the CET bits. So here we grab everything in and
// under the init.lua dir.
const getAllCetModFiles = function (files: string[]) {
  // TODO:  it's possible there are multiple init files,
  //        need to make sure we have the top level.
  //        Can we rely on the dir traversal order?
  const initFile = files.find(matchCetInitFile);

  if (!initFile) {
    log(
      "warn",
      "Got to getAllCetModFiles but no init.lua in given files: ",
      files,
    );

    return [];
  }

  const modPath = path.dirname(initFile);

  const modFiles = files.filter((file) => path.dirname(file) === modPath);

  return modFiles;
};

export const modWithArchiveOnly: Vortex.TestSupported = (
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
 * Checks to see if the mod has any expected files in unexpected places
 * @param files list of files
 * @param gameId The internal game id
 * @returns Promise which details if the files passed in need to make use of a specific installation method
 */
export const modHasBadStructure: Vortex.TestSupported = (
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

/**
 * Installs files while correcting the directory structure as we go.
 * @param files a list of files to be installed
 * @returns a promise with an array detailing what files to install and how
 */
export const archiveOnlyInstaller: Vortex.InstallFunc = (
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

/**
 * Checks the file path and ensures all files arte as they should be.
 * @param files a list of files
 * @param file_type the file type (ext from one of the consts)
 * @param path_const the standard path of the file type
 * @param needsOwnDirectory whether we need to check if it need's it own directory (for redscript and cet mods)
 * @returns true if everything seems to be in order, false otherwise
 */
function cleanPathOfType(
  files: string[],
  file_type: string,
  path_const: string,
  needsOwnDirectory: boolean = false,
) {
  const filesOfType = files.filter(
    (file: string) => path.extname(file).toLowerCase() === file_type,
  );

  let cleanFiles = false;
  filesOfType.forEach((file: string) => {
    // let idx = file.indexOf(path.basename(file));
    const rootPath = path.dirname(file);
    log("debug", "File found on directory: ", rootPath);
    // if (((file.indexOf(rootPath) !== -1) && (!file.endsWith(path.sep))) && rootPath.includes(path_const)) {
    if (rootPath.includes(path_const)) {
      log("debug", "file root includes expected path...");
      // If the mod needs it's own directory (such as with RedScripts and CET mods),
      // make sure it is there by subtracting the general path from the full root path
      if (needsOwnDirectory && rootPath.replace(path_const, "").length > 0) {
        log("debug", "file has expected subdirectory as needed...");
        cleanFiles = true;
      } else if (!needsOwnDirectory) {
        log("debug", "file does not need pesky subdirectory...");
        cleanFiles = true;
      } else {
        log("warn", "file needs subdirectory, but does not have it...");
        cleanFiles = false;
      }
    } else {
      log("warn", "file is not in the correct path");
      cleanFiles = false;
    }
  });
  return cleanFiles;
}

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
  genericModName: string,
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

/**
 * A helper for CET files
 * @param cetFiles CET files
 * @param genericModName a mod folder if everyhting is awful
 * @returns an array of instructions for the files
 *
 * @todo  We should verify that either the path is right including
 *        a named subfolder, or we either reject or
 *        https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/13
 */
function cetScriptInstallationHelper(
  cetFiles: string[],
  genericModName: string,
) {
  //   let files = cetFiles.filter((f) => !path.extname(f));
  // Simplify the check so that it just sees if the file has the general path, and if so, use as is,
  // otherwise assume it is atleast in a folder, as required by CET projects
  const normalizedFiltered = cetFiles.map((file: string) =>
    file.includes(CET_SCRIPT_PATH) && path.extname(file) !== ""
      ? file
      : path.join(CET_SCRIPT_PATH, file),
  );

  // Set destination to be 'bin/x64/plugins/cyber_engine_tweaks/mods/ModFolder/*'
  const instructions = normalizedFiltered.map((file: string) => ({
    type: "copy",
    source: file,
    destination: file,
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
export const installWithCorrectedStructure: Vortex.InstallFunc = (
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

  const haveCetTypeMod = files.some(matchCetInitFile);

  const cetFiles = haveCetTypeMod ? getAllCetModFiles(files) : [];
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

  log("info", "Correcting CET files: ", cetFiles);
  const cetScriptInstructions = cetScriptInstallationHelper(
    cetFiles,
    archiveName,
  );
  log("debug", "Installing CET files with: ", cetScriptInstructions);

  //   let everythingLeftOverInstructions = genericFileInstallationHelper(
  //     everythingElse,
  //     genericModName
  //   );
  //   log("debug", "Installing everything else with: ", cetScriptInstructions);

  const instructions = [].concat(
    archiveFileInstructions,
    iniModInstructions,
    redScriptInstructions,
    cetScriptInstructions,
    // everythingLeftOverInstructions
  );

  return Promise.resolve({ instructions });
};

const byPriority = (a: Installer, b: Installer) => a.priority - b.priority;

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
export const installerPipeline: Installer[] = [
  {
    type: InstallerType.ArchiveOnly,
    id: "cp2077-basic-archive-mod",
    priority: 30,
    testSupported: modWithArchiveOnly,
    install: archiveOnlyInstaller,
  },
  {
    type: InstallerType.Other,
    id: "cp2077-standard-mod",
    priority: 31,
    testSupported: modHasBadStructure,
    install: installWithCorrectedStructure,
  },
].sort(byPriority);

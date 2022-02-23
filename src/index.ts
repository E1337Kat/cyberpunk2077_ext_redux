import path from "path";
import { fs, log, util } from "vortex-api";
import { IExtensionContext, IGameStoreEntry } from "vortex-api/lib/types/api";
// Nexus Mods domain for the game. e.g. nexusmods.com/bloodstainedritualofthenight
const GAME_ID = "cyberpunk2077";
//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = "1091500";
//GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = "1423049311";
//Epic Application ID
const EPICAPP_ID = "Ginger";

//This is the main function Vortex will run when detecting the game extension.
function main(context: IExtensionContext) {
  context.registerGame({
    id: GAME_ID,
    name: "Cyberpunk 2077",
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => "",
    logo: "gameart.jpg",
    executable: () => "bin/x64/Cyberpunk2077.exe",
    requiredFiles: ["bin/x64/Cyberpunk2077.exe"],
    supportedTools: moddingTools,
    compatible: {
      symlinks: false,
    },
    requiresLauncher: requiresGoGLauncher,
    setup: prepareForModding,
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID,
      epicAppId: EPICAPP_ID,
    },
  });

  // install with correct structure has a kinda bug where it does exactly what it should, but complains about it to the user
  // telling them it is a bug with the mod itself... and I don't want to put that hurt onto trusty mod developers.
  // context.registerInstaller('cp2077-correct-structure-mod', 25, modHasCorrectStructure, installWithCorrectStructure);
  context.registerInstaller(
    "cp2077-standard-mod",
    30,
    modHasBadStructure,
    installWithCorrectedStructure
  );

  return true;
}

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
 * |-📁 r6
 * | |-📁 config
 * | | |-📄 *.xml (68.2 kB)
 * | |-📁 scripts
 * | | |-📁 SomeMod
 * | | | |-📄 *.reds
 */
const MEOW_FOR_COMMENTS = 0;
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
  "mods"
);
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

const moddingTools = [
  {
    id: "CSVMerge",
    name: "CSVMerge",
    executable: () => path.join("csvmerge", "CSVMerge.cmd"),
    requiredFiles: [
      path.join("csvmerge", "CSVMerge.cmd"),
      path.join("csvmerge", "wolvenkitcli", "WolvenKit.CLI.exe"),
    ],
    shell: true,
    relative: true,
  },
];

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
 * Checks to see if the mod has any expected files in unexpected places
 * @param files list of files
 * @param gameId The internal game id
 * @returns Promise which details if the files passed in need to make use of a specific installation method
 */
function modHasBadStructure(files: string[], gameId: string) {
  log("debug", "Checking Files: ", files);

  // Make sure we're able to support this mod.
  let correctGame = gameId === GAME_ID;
  log("info", "Checking bad structure of mod for a game: ", gameId);
  if (!correctGame) {
    //no mods?
    let supported = false;
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
  }

  // Make sure we're able to support this mod.
  let hasArchiveMod =
    files.find(
      (file: string) => path.extname(file).toLowerCase() === MOD_FILE_EXT
    ) !== undefined;
  log("debug", "Probably archives: ", hasArchiveMod);
  let hasRedScript =
    files.find(
      (file: string) => path.extname(file).toLowerCase() === REDSCRIPT_FILE_EXT
    ) !== undefined;
  log("debug", "Possibly RedScripts: ", hasRedScript);
  let hasCetScript =
    files.find(
      (file: string) => path.extname(file).toLowerCase() === LUA_FILE_EXT
    ) !== undefined;
  log("debug", "Possible CET Scripts: ", hasCetScript);

  if (hasArchiveMod || hasRedScript || hasCetScript) {
    let supported = true;
    log("info", "mod supported by this installer");
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
  } else {
    let supported = false;
    log("warn", "I dunno. Can't do nothing about this.");
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
  }
}

/**
 * Installs files while correcting the directory structure as we go.
 * @param files a list of files to be installed
 * @returns a promise with an array detailing what files to install and how
 */
function installWithCorrectedStructure(files: string[]) {
  // I dunno, it's important
  let genericModName = "".concat(
    GAME_ID,
    "_",
    "Mod_Boi",
    Date.now().toString()
  );

  // gather the archive files.
  let someArchiveModFile = files.find(
    (file: string) => path.extname(file).toLowerCase() === MOD_FILE_EXT
  );
  let filteredArchives: string[];
  if (someArchiveModFile !== undefined) {
    let theArchivePathAsIs = path.dirname(someArchiveModFile);
    filteredArchives = files.filter((file: string) => {
      return (
        path.dirname(file) == theArchivePathAsIs ||
        path.extname(file).toLowerCase() == MOD_FILE_EXT
      );
    });
  } else {
    filteredArchives = [];
  }

  // gather the RedScript files.
  let someRedscriptModFile = files.find(
    (file: string) => path.extname(file).toLowerCase() === REDSCRIPT_FILE_EXT
  );
  let filteredReds: string[];
  if (someRedscriptModFile !== undefined) {
    let theRedscriptPathAsIs = path.dirname(someRedscriptModFile);
    filteredReds = files.filter((file: string) => {
      return (
        path.dirname(file) == theRedscriptPathAsIs ||
        path.extname(file).toLowerCase() == REDSCRIPT_FILE_EXT
      );
    });
  } else {
    filteredReds = [];
  }

  // gather the CET files.
  let cetInitFile = files.find(
    (file: string) => path.basename(file).toLowerCase() === "init.lua"
  );
  let filteredCet: string[];
  if (cetInitFile !== undefined) {
    let theCETModInitPath = path.dirname(cetInitFile);
    filteredCet = files.filter((file: string) => {
      return (
        path.dirname(file) == theCETModInitPath ||
        path.extname(file).toLowerCase() == LUA_FILE_EXT
      );
    });
  } else {
    filteredCet = [];
  }

  //   let everythingElse = files.filter((file: string) => {
  //     !path.extname(file) &&
  //       !filteredArchives.includes(file) &&
  //       !filteredReds.includes(file) &&
  //       !filteredCet.includes(file);
  //   });

  // Set destination to be 'archive/pc/mod/[file].archive'
  log("info", "Correcting archive files: ", filteredArchives);
  let archiveFileInstructions = filteredArchives.map((file: string) => {
    return {
      type: "copy",
      source: file,
      destination: path.join(ARCHIVE_MOD_PATH, path.basename(file)),
    };
  });
  log("debug", "Installing archive files with: ", archiveFileInstructions);

  log("info", "Correcting redscript mod files: ", filteredReds);
  let redScriptInstructions = redScriptInstallationHelper(
    filteredReds,
    genericModName
  );
  log("debug", "Installing redscript mod files with: ", redScriptInstructions);

  log("info", "Correcting CET files: ", filteredCet);
  let cetScriptInstructions = cetScriptInstallationHelper(
    filteredCet,
    genericModName
  );
  log("debug", "Installing CET files with: ", cetScriptInstructions);

  //   let everythingLeftOverInstructions = genericFileInstallationHelper(
  //     everythingElse,
  //     genericModName
  //   );
  //   log("debug", "Installing everything else with: ", cetScriptInstructions);

  let instructions = archiveFileInstructions.concat(
    redScriptInstructions,
    cetScriptInstructions
    // everythingLeftOverInstructions
  );

  return Promise.resolve({ instructions });
}

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
  needsOwnDirectory: boolean = false
) {
  let filesOfType = files.filter(
    (file: string) => path.extname(file).toLowerCase() === file_type
  );

  let cleanFiles = false;
  filesOfType.forEach((file: string) => {
    // let idx = file.indexOf(path.basename(file));
    let rootPath = path.dirname(file);
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
  genericModName: string
) {
  //   let files = redFiles.filter((f) => !path.extname(f));

  // Ensure all the RedScript files are in their own mod directory. (Should have been checked beforehand)
  let normalizedFiltered = redFiles.map((file: string) => {
    return file.includes(REDSCRIPT_PATH)
      ? file
      : path.join(REDSCRIPT_PATH, file);
  });

  // Set destination to be 'r6/scripts/ModFolder/[file].reds'
  let instructions = normalizedFiltered.map((file: string) => {
    return {
      type: "copy",
      source: file,
      destination: path.join(REDSCRIPT_PATH, path.basename(file)),
    };
  });

  return instructions;
}

/**
 * A helper for CET files
 * @param cetFiles CET files
 * @param genericModName a mod folder if everyhting is awful
 * @returns an array of instructions for the files
 */
function cetScriptInstallationHelper(
  cetFiles: string[],
  genericModName: string
) {
  //   let files = cetFiles.filter((f) => !path.extname(f));
  // Simplify the check so that it just sees if the file has the general path, and if so, use as is,
  // otherwise assume it is atleast in a folder, as required by CET projects
  let normalizedFiltered = cetFiles.map((file: string) => {
    return file.includes(CET_SCRIPT_PATH)
      ? file
      : path.join(CET_SCRIPT_PATH, file);
  });

  // Set destination to be 'bin/x64/plugins/cyber_engine_tweaks/mods/ModFolder/*'
  let instructions = normalizedFiltered.map((file: string) => {
    return {
      type: "copy",
      source: file,
      destination: file,
    };
  });

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

export function findGame() {
  return util.GameStoreHelper.findByAppId([
    STEAMAPP_ID,
    GOGAPP_ID,
    EPICAPP_ID,
  ]).then((game: IGameStoreEntry) => game.gamePath);
}
// function findGame() {
//   try {
//     const instPath = winapi.RegGetValue(
//       'HKEY_LOCAL_MACHINE',
//       'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\' + GOGAPP_ID,
//       'PATH');
//     if (!instPath) {
//       throw new Error('empty registry key');
//     }
//     console.log("Install Path: " + instPath.value)
//     return Promise.resolve(instPath.value);
//   } catch (err) {
//     return util.GameStoreHelper.findByAppId([STEAMAPP_ID,GOGAPP_ID,EPICAPP_ID])
//       .then(game => game.gamePath);
//   }
// }

function requiresGoGLauncher() {
  return util.GameStoreHelper.isGameInstalled(GOGAPP_ID, "gog").then((gog) =>
    gog ? { launcher: "gog", addInfo: GOGAPP_ID } : undefined
  );
}

function prepareForModding(discovery) {
  return fs.readdirAsync(path.join(discovery.path));
}

module.exports = {
  default: main,
};

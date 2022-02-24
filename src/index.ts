import path from "path";
import { fs, log, selectors, util } from "vortex-api";
import { IExtensionContext, IGameStoreEntry } from "vortex-api/lib/types/api";
import {
  modHasBadStructure,
  installWithCorrectedStructure,
  modWithArchiveOnly,
  archiveOnlyInstaller,
} from "./installers";

// const Promise = require("bluebird");
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

  // context.once(() => {
  //   context.api.onAsync("added-files", async (profileId, files) => {
  //     const state = context.api.store.getState();
  //     const profile = selectors.profileById(state, profileId);
  //     if (profile.gameId !== GAME_ID) {
  //       // don't care about any other games
  //       return;
  //     }
  //     const game = util.getGame(GAME_ID);
  //     const discovery = selectors.discoveryByGame(state, GAME_ID);
  //     const modPaths = game.getModPaths(discovery.path);
  //     const installPath = selectors.installPathForGame(state, GAME_ID);

  //     await Promise.map(files, async (entry) => {
  //       // only act if we definitively know which mod owns the file
  //       if (entry.candidates.length === 1) {
  //         const mod = util.getSafe(
  //           state.persistent.mods,
  //           [GAME_ID, entry.candidates[0]],
  //           undefined
  //         );
  //         //   if (!isModCandidateValid(mod, entry)) {
  //         //     return Promise.resolve();
  //         //   }
  //         const relPath = path.relative(
  //           modPaths[mod.type ?? ""],
  //           entry.filePath
  //         );
  //         const targetPath = path.join(installPath, mod.id, relPath);
  //         // copy the new file back into the corresponding mod, then delete it. That way, vortex will
  //         // create a link to it with the correct deployment method and not ask the user any questions
  //         await fs.ensureDirAsync(path.dirname(targetPath));
  //         try {
  //           await fs.copyAsync(entry.filePath, targetPath);
  //           await fs.removeAsync(entry.filePath);
  //         } catch (err) {
  //           if (!err.message.includes("are the same file")) {
  //             // should we be reporting this to the user? This is a completely
  //             // automated process and if it fails more often than not the
  //             // user probably doesn't care
  //             log(
  //               "error",
  //               "failed to re-import added file to mod",
  //               err.message
  //             );
  //           }
  //         }
  //       }
  //     });
  //   });
  // });

  // install with correct structure has a kinda bug where it does exactly what it should, but complains about it to the user
  // telling them it is a bug with the mod itself... and I don't want to put that hurt onto trusty mod developers.
  // context.registerInstaller('cp2077-correct-structure-mod', 25, modHasCorrectStructure, installWithCorrectStructure);
  // context.registerInstaller(
  //   "cp2077-standard-mod", // id
  //   30, // priority
  //   modHasBadStructure, // testSupported func
  //   installWithCorrectedStructure // install func
  // );
  context.registerInstaller(
    "cp2077-basic-archive-mod", // id
    31, // priority
    modWithArchiveOnly, // testSupported func
    archiveOnlyInstaller // install func
  );

  return true;
}

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

// const isModCandidateValid = (mod, entry) => {
//   if (mod === undefined) {
//     // There is no reliable way to ascertain whether a new file entry
//     //  actually belongs to a root modType as some of these mods will act
//     //  as replacement mods. This obviously means that if the game has
//     //  a substantial update which introduces new files we could potentially
//     //  add a vanilla game file into the mod's staging folder causing constant
//     //  contention between the game itself (when it updates) and the mod.
//     //
//     // There is also a potential chance for root modTypes to conflict with regular
//     //  mods, which is why it's not safe to assume that any addition inside the
//     //  mods directory can be safely added to this mod's staging folder either.
//     return false;
//   }

//   if (mod.type !== "SMAPI") {
//     // Other mod types do not require further validation - it should be fine
//     //  to add this entry.
//     return true;
//   }

//   const segments = entry.filePath
//     .toLowerCase()
//     .split(path.sep)
//     .filter((seg) => !!seg);
//   const modsSegIdx = segments.indexOf("mods");
//   const modFolderName =
//     modsSegIdx !== -1 && segments.length > modsSegIdx + 1
//       ? segments[modsSegIdx + 1]
//       : undefined;

//   let bundledMods = util.getSafe(mod, ["attributes", "smapiBundledMods"], []);
//   // bundledMods = bundledMods.length > 0 ? bundledMods : getBundledMods();
//   if (segments.includes("content")) {
//     // SMAPI is not supposed to overwrite the game's content directly.
//     //  this is clearly not a SMAPI file and should _not_ be added to it.
//     return false;
//   }

//   return modFolderName !== undefined && bundledMods.includes(modFolderName);
// };

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

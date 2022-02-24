import path from "path";
import { fs, log, util } from "vortex-api";
import { IExtensionContext, IGameStoreEntry } from "vortex-api/lib/types/api";
import {
  modHasBadStructure,
  installWithCorrectedStructure,
} from "./installers";
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
    "cp2077-standard-mod", // id
    30, // priority
    modHasBadStructure, // testSupported func
    installWithCorrectedStructure // install func
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

import path from "path";
import { fs, log, util } from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import {
  VortexInstallFunc,
  VortexTestSupportedFunc,
  VortexExtensionContext,
  VortexGameStoreEntry,
  VortexApi,
  VortexLogFunc,
} from "./vortex-wrapper";
import { Installer, installerPipeline } from "./installers";
import { fileTreeFromPaths } from "./filetree";
// Nexus Mods domain for the game. e.g. nexusmods.com/bloodstainedritualofthenight
const GAME_ID = "cyberpunk2077";
// Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = "1091500";
// GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = "1423049311";
// Epic Application ID
const EPICAPP_ID = "Ginger";

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

export const findGame = () =>
  util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID, EPICAPP_ID]).then(
    (game: VortexGameStoreEntry) => game.gamePath,
  );

const requiresGoGLauncher = () =>
  util.GameStoreHelper.isGameInstalled(GOGAPP_ID, "gog").then((gog) =>
    gog ? { launcher: "gog", addInfo: GOGAPP_ID } : undefined,
  );

const prepareForModding = (discovery) =>
  fs.readdirAsync(path.join(discovery.path));

const wrapTestSupported =
  (
    vortexApi: VortexApi,
    vortexLog: VortexLogFunc,
    installer: Installer,
  ): VortexTestSupportedFunc =>
  (files: string[], gameId: string, ...args) => {
    if (gameId !== GAME_ID) {
      return Promise.resolve({ supported: false, requiredFiles: [] });
    }

    log("info", `Testing for ${installer.type}, input files: `, files);
    return installer.testSupported(
      vortexApi,
      vortexLog,
      files,
      fileTreeFromPaths(files),
      gameId,
      ...args,
    );
  };

const wrapInstall =
  (
    vortexApi: VortexApi,
    vortexLog: VortexLogFunc,
    installer: Installer,
  ): VortexInstallFunc =>
  (files: string[], ...args) => {
    log("info", `Trying to install using ${installer.type}`);

    return installer.install(
      vortexApi,
      vortexLog,
      files,
      fileTreeFromPaths(files),
      ...args,
    );
  };

// This is the main function Vortex will run when detecting the game extension.
const main = (vortex: VortexExtensionContext) => {
  vortex.registerGame({
    id: GAME_ID,
    name: "Cyberpunk 2077",
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => "",
    logo: "gameart.png",
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

  installerPipeline.forEach((installer) => {
    vortex.registerInstaller(
      installer.id,
      installer.priority,
      wrapTestSupported(vortex.api, log, installer),
      wrapInstall(vortex.api, log, installer),
    );
  });

  return true;
};

export default main;

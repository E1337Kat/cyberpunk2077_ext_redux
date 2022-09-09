import path from "path";
import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import { CurrentFeatureSet } from "./features";

// Our stuff
import {
  EPICAPP_ID,
  GAME_ID,
  GOGAPP_ID,
  STEAMAPP_ID,
} from "./index.metadata";
import {
  wrapTestSupported,
  wrapInstall,
  internalPipelineInstaller,
} from "./installers";
import {
  internalLoadOrderer,
  wrapDeserialize,
  wrapSerialize,
  wrapValidate,
} from "./load_order";
import {
  VortexExtensionContext,
  VortexGameStoreEntry,
} from "./vortex-wrapper";

const moddingTools = [
  {
    id: `CyberCat`,
    name: `CyberCAT Save Editor`,
    shortName: `CyberCAT`,
    logo: `SaveEditor.png`,
    executable: () => path.join(`CyberCAT`, `CP2077SaveEditor.exe`),
    requiredFiles: [
      path.join(`CyberCAT`, `CP2077SaveEditor.exe`),
      path.join(`CyberCAT`, `licenses`, `CyberCAT.Core.LICENSE.txt`),
    ],
    defaultPrimary: true,
    shell: false,
    relative: true,
  },
];

export const findGame = () =>
  vortexApi.util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID, EPICAPP_ID]).then(
    (game: VortexGameStoreEntry) => game.gamePath,
  );

const requiresGoGLauncher = () =>
  vortexApi.util.GameStoreHelper.isGameInstalled(GOGAPP_ID, `gog`).then((gog) =>
    (gog ? { launcher: `gog`, addInfo: GOGAPP_ID } : undefined));

const prepareForModding = (discovery) =>
  vortexApi.fs.readdirAsync(path.join(discovery.path));

// This is the main function Vortex will run when detecting the game extension.
const main = (vortex: VortexExtensionContext) => {
  vortex.registerGame({
    id: GAME_ID,
    name: `Cyberpunk 2077`,
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => ``,
    logo: `gameart.png`,
    executable: () => `bin/x64/Cyberpunk2077.exe`,
    requiredFiles: [`bin/x64/Cyberpunk2077.exe`],
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

  vortex.registerInstaller(
    internalPipelineInstaller.id,
    internalPipelineInstaller.priority,
    wrapTestSupported(vortex, vortexApi, internalPipelineInstaller),
    wrapInstall(vortex, vortexApi, internalPipelineInstaller, CurrentFeatureSet),
  );

  vortex.registerLoadOrder({
    gameId: GAME_ID,
    toggleableEntries: true,
    validate: wrapValidate(vortex, vortexApi, internalLoadOrderer),
    deserializeLoadOrder: wrapDeserialize(vortex, vortexApi, internalLoadOrderer),
    serializeLoadOrder: wrapSerialize(vortex, vortexApi, internalLoadOrderer),
  });

  vortex.once(() => {
    vortex.api.onAsync(`did-deploy`, (profileId) => {
      const state = vortex.api.store.getState();
      const profile = vortexApi.selectors.profileById(state, profileId);

      if (GAME_ID !== profile?.gameId) {
        return Promise.resolve();
      }

      vortex.api.emitAndAwait(`discover-tools`, GAME_ID);
      return Promise.resolve();
    });
  });

  return true;
};

export default main;

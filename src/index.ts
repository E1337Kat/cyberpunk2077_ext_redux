import path from "path";
import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies

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
  VortexExtensionContext,
  VortexGameStoreEntry,
} from "./vortex-wrapper";
import {
  REDmoddingGameLaunchParameters,
  REDmoddingTools,
  wrappedPrepareForModdingWithREDmodding,
} from './redmodding';
import {
  CurrentFeatureSet,
  FeatureEnabled,
} from "./features";
import {
  wrapValidate,
  internalLoadOrderer,
  wrapDeserialize,
  wrapSerialize,
} from "./load_order";


export const findGame = (): string =>
  vortexApi.util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID, EPICAPP_ID]).then(
    (game: VortexGameStoreEntry) => game.gamePath,
  );

const requiresGoGLauncher = () =>
  vortexApi.util.GameStoreHelper.isGameInstalled(GOGAPP_ID, `gog`).then((gog) =>
    (gog ? { launcher: `gog`, addInfo: GOGAPP_ID } : undefined));


//
// REDmodding stuff
//


const MaybeREDmodTools =
  FeatureEnabled(CurrentFeatureSet.REDmodding)
    ? REDmoddingTools
    : [];

const moddingTools = [
  ...MaybeREDmodTools,
  ...[
    {
      id: `CyberCat`,
      name: `CyberCAT Save Editor`,
      shortName: `CyberCAT`,
      logo: `SaveEditor.png`,
      executable: (): string => path.join(`CyberCAT`, `CP2077SaveEditor.exe`),
      requiredFiles: [
        path.join(`CyberCAT`, `CP2077SaveEditor.exe`),
        path.join(`CyberCAT`, `licenses`, `CyberCAT.Core.LICENSE.txt`),
      ],
      defaultPrimary: true,
      shell: false,
      relative: true,
    },
  ],
];

const setupFunctionToRunAtExtensionInit = (vortex: VortexExtensionContext) =>
  (FeatureEnabled(CurrentFeatureSet.REDmodding)
    ? (discovery) => { wrappedPrepareForModdingWithREDmodding(vortex, vortexApi, discovery); }
    : (discovery) => vortexApi.fs.readdirAsync(path.join(discovery.path)));


const defaultGameLaunchParameters =
  FeatureEnabled(CurrentFeatureSet.REDmodding)
    ? REDmoddingGameLaunchParameters
    : [];

//
// Register extension in entry point
//

// This is the main function Vortex will run when detecting the game extension.
const main = (vortex: VortexExtensionContext) => {
  vortex.registerGame({
    id: GAME_ID,
    name: `Cyberpunk 2077`,
    setup: setupFunctionToRunAtExtensionInit(vortex),
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => ``,
    logo: `gameart.png`,
    executable: () => `bin/x64/Cyberpunk2077.exe`,
    parameters: defaultGameLaunchParameters,
    requiredFiles: [`bin/x64/Cyberpunk2077.exe`],
    supportedTools: moddingTools,
    compatible: {
      symlinks: false,
    },
    requiresLauncher: requiresGoGLauncher,
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

  // This is additionally run when the extension is activated,
  // meant especially to set up state, listeners, reducers, etc.
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


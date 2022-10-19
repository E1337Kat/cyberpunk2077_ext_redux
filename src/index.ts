import path from "path";
import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies

// Our stuff
import {
  EPICAPP_ID,
  GAME_ID,
  GOGAPP_ID,
  STEAMAPP_ID,
  V2077_DIR,
} from "./index.metadata";
import {
  wrapTestSupported,
  wrapInstall,
  internalPipelineInstaller,
} from "./installers";
import {
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexGameStoreEntry,
} from "./vortex-wrapper";
import {
  REDlauncher,
  REDmoddingTools,
  wrappedPrepareForModdingWithREDmodding,
} from './redmodding';
import {
  CurrentFeatureSet,
  Feature,
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
// REDmodding conditional stuff
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
      defaultPrimary: false,
      shell: false,
      relative: true,
    },
  ],
];

const setupFunctionToRunAtExtensionInit = (vortex: VortexExtensionContext) =>
  async (discovery: VortexDiscoveryResult): Promise<void> => {
    try {
      await vortexApi.fs.ensureDirWritableAsync(path.join(discovery.path, V2077_DIR));
      vortexApi.log(`info`, `Metadata directory ${V2077_DIR} exists and is writable, good!`);
    } catch (err) {
    // This might be an actual problem but let's not prevent proceeding..
      vortexApi.log(`error`, `Unable to create or access metadata dir ${V2077_DIR} under ${discovery.path}`, err);
    }

    if (CurrentFeatureSet.REDmodding === Feature.Enabled) {
      return wrappedPrepareForModdingWithREDmodding(vortex, vortexApi, discovery);
    }

    return vortexApi.fs.readdirAsync(path.join(discovery.path));
  };


const defaultGameLaunchParameters =
  FeatureEnabled(CurrentFeatureSet.REDmodding)
    ? REDlauncher.parameters
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

  if (CurrentFeatureSet.REDmodLoadOrder === Feature.Enabled) {
    vortex.registerLoadOrder({
      gameId: GAME_ID,

      // This needs to be actually implemented, it doesnt't do
      // anything on its own, so leave it out now to avoid confusion
      //
      // toggleableEntries: true,

      // Can add instructions to the right-hand panel. Might be useful,
      // but on the whole I think it's probably better to reduce the
      // amount of space the panel takes instead.
      //
      // usageInstructions: `Order your mods by dragging them up and down! Only REDmods and autoconverted heritage mods are orderable.`,

      validate: wrapValidate(vortex, vortexApi, internalLoadOrderer),
      deserializeLoadOrder: wrapDeserialize(vortex, vortexApi, internalLoadOrderer),
      serializeLoadOrder: wrapSerialize(vortex, vortexApi, internalLoadOrderer),
    });

    // This makes Vortex unable to deploy anything because the type didn't exist previously :D
    //
    // https://github.com/Nexus-Mods/Vortex/issues/13376
    /*
    vortex.registerModType(
      ModType.REDmod,
      100,
      constTrue,
      (_game: VortexGame) => ``,
      (instructions: VortexInstruction[]) => pipe(
        instructions,
        filter((instruction) =>
          instruction.key === ModAttributeKey.ModType && instruction.value?.data === ModType.REDmod),
        isNonEmpty,
      ),
      {
        name: `REDmod`,
      },
    );
    */
  }

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


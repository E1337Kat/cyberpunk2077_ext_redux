import path from "path";
import * as vortexApiLib from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import I18next from 'i18next'; // eslint-disable-line import/no-extraneous-dependencies


// Our stuff
import {
  findFirst,
} from "fp-ts/lib/ReadonlyArray";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  getOrElse as getOrElseO,
  map as mapO,
} from "fp-ts/lib/Option";
import {
  EPICAPP_ID,
  EXTENSION_NAME_INTERNAL,
  EXTENSION_NAME_VORTEX,
  GAME_ID,
  GOGAPP_ID,
  isSupported,
  STEAMAPP_ID,
  V2077_DIR,
  VORTEX_STORE_PATHS,
} from "./index.metadata";
import {
  StaticFeaturesForStartup,
  FullFeatureSetFromStaticAndDynamic,
  IsFeatureEnabled,
  DefaultEnabledStateForDynamicFeatures,
  storeGetDynamicFeature,
  DynamicFeature,
  FeatureSet,
} from "./features";
import {
  wrapTestSupported,
  wrapInstall,
  internalPipelineInstaller,
} from "./installers";
import {
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexGameStoreEntry,
  VortexState,
  vortexUtil,
} from "./vortex-wrapper";
import {
  wrappedPrepareForModdingWithREDmodding,
} from './redmodding';
import {
  wrapValidate,
  internalLoadOrderer,
  wrapDeserialize,
  wrapSerialize,
  loadOrderUsageInstructionsForVortexGui,
} from "./load_order";
import {
  constant,
  alwaysTrue,
  bbcodeBasics,
  heredoc,
  S,
} from "./util.functions";
import {
  setREDmodAutoconvertArchivesAction,
} from "./actions";
import {
  informUserZeroNineZeroChanges,
} from "./ui.dialogs";
import settingsComponent from './views/settings'; // eslint-disable-line import/extensions
import {
  makeSettingsReducer,
} from './reducers';
import * as REDmoddingTools from "./tools.redmodding";
import * as ExternalTools from "./tools.external";


//
// Helpers
//

const lowercaseWhitespaceIgnoring = (str: string): string =>
  str.toLocaleLowerCase().replace(/\s+/g, ``);

const extensionDetes = (vortexState: VortexState, featureSet: FeatureSet): string =>
  pipe(
    vortexApiLib.util.getSafe(vortexState, [`session`, `extensions`, `installed`], {}),
    Object.entries,
    findFirst(([_extensionId, extensionData]) =>
      lowercaseWhitespaceIgnoring(extensionData.name) === lowercaseWhitespaceIgnoring(EXTENSION_NAME_VORTEX)),
    mapO(([extensionId, extensionData]) => S({
      extensionId,
      extensionName: extensionData.name,
      extensionVersion: extensionData.version,
      featureSet,
    })),
    getOrElseO(constant(`<No extension info found, might just be a glitch>`)),
  );


export const findGame = (): string =>
  vortexApiLib.util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID, EPICAPP_ID]).then(
    (game: VortexGameStoreEntry) => game.gamePath,
  );

const requiresGoGLauncher = (): Promise<{ launcher: string; addInfo?: string; }> =>
  vortexApiLib.util.GameStoreHelper.isGameInstalled(GOGAPP_ID, `gog`).then((gog) =>
    (gog ? { launcher: `gog`, addInfo: GOGAPP_ID } : undefined));


type TranslationFunction = typeof I18next.t;

interface IREDmodProps {
  gameMode: string;
  archiveAutoConvertEnabled: boolean;
}

const archiveAutoConvert = (state: unknown): boolean =>
  storeGetDynamicFeature(vortexUtil, DynamicFeature.REDmodAutoconvertArchives, state);

const toggleAutoConvert = (api: vortexApiLib.types.IExtensionApi, _gameMode: string): void => {
  const state: vortexApiLib.types.IState = api.store.getState();
  api.store.dispatch(setREDmodAutoconvertArchivesAction(!archiveAutoConvert(state)));
};


//
// Register extension in entry point
//


// This is the main function Vortex will run when detecting the game extension.
const main = (vortexExt: VortexExtensionContext): boolean => {

  const MaybeREDmodTools =
    IsFeatureEnabled(StaticFeaturesForStartup.REDmodding)
      ? REDmoddingTools.available.tools
      : [];

  const moddingTools = [
    ...MaybeREDmodTools,
    ...ExternalTools.available.tools,
  ];

  const setupFunctionToRunAtExtensionInit =
    async (discovery: VortexDiscoveryResult): Promise<void> => {
      try {
        await vortexApiLib.fs.ensureDirWritableAsync(path.join(discovery.path, V2077_DIR));
        vortexApiLib.log(`info`, `Metadata directory ${V2077_DIR} exists and is writable, good!`);
      } catch (err) {
        // This might be an actual problem but let's not prevent proceeding..
        vortexApiLib.log(`error`, `Unable to create or access metadata dir ${V2077_DIR} under ${discovery.path}`, err);
      }

      if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodding)) {
        return wrappedPrepareForModdingWithREDmodding(vortexExt, vortexApiLib, discovery);
      }

      return vortexApiLib.fs.readdirAsync(path.join(discovery.path));
    };

  const defaultGameLaunchParameters =
    IsFeatureEnabled(StaticFeaturesForStartup.REDmodding)
      ? REDmoddingTools.REDlauncher.parameters
      : [];

  const fullFeatureSetAvailablePostStartup =
    FullFeatureSetFromStaticAndDynamic(StaticFeaturesForStartup, vortexExt.api, vortexApiLib.util);

  // Ok, now we have everything in hand to register our stuff with Vortex

  vortexExt.registerGame({
    id: GAME_ID,
    name: EXTENSION_NAME_VORTEX,
    setup: setupFunctionToRunAtExtensionInit,
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

  vortexExt.registerInstaller(
    internalPipelineInstaller.id,
    internalPipelineInstaller.priority,
    wrapTestSupported(vortexExt, vortexApiLib, internalPipelineInstaller),
    wrapInstall(
      vortexExt,
      vortexApiLib,
      internalPipelineInstaller,
      fullFeatureSetAvailablePostStartup,
    ),
  );

  if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodding)) {
    if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodLoadOrder)) {
      vortexExt.registerLoadOrder({
        gameId: GAME_ID,

        // This needs to be actually implemented, it doesnt't do
        // anything on its own, so leave it out now to avoid confusion
        //
        // toggleableEntries: true,

        // Can add instructions to the right-hand panel. Might be useful,
        // but on the whole I think it's probably better to reduce the
        // amount of space the panel takes instead.
        //
        usageInstructions: loadOrderUsageInstructionsForVortexGui,
        validate: wrapValidate(vortexExt, vortexApiLib, internalLoadOrderer),
        deserializeLoadOrder: wrapDeserialize(vortexExt, vortexApiLib, internalLoadOrderer),
        serializeLoadOrder: wrapSerialize(vortexExt, vortexApiLib, internalLoadOrderer),
      });

    } // if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodLoadOrder))

    vortexExt.registerReducer(VORTEX_STORE_PATHS.settings, makeSettingsReducer(DefaultEnabledStateForDynamicFeatures));

    vortexExt.registerSettings(`V2077 Settings`, settingsComponent, undefined, () => {
      const state = vortexExt.api.store.getState();
      const gameMode = vortexApiLib.selectors.activeGameId(state);
      return gameMode === GAME_ID;
    }, 51);

    // 0.9.0 information TODO
    vortexExt.registerToDo(
      `${EXTENSION_NAME_INTERNAL}-todo-v090-information`,
      `more`,
      undefined,
      `health`,
      `v0.9.0 Update Detes for Cyberpunk 2077!`,
      (_: IREDmodProps) => informUserZeroNineZeroChanges({ ...vortexExt.api, log: vortexApiLib.log }),
      alwaysTrue, // We want to show this before activating the game
      undefined,
      undefined,
    );

    // Auto convert TODO
    vortexExt.registerToDo(
      `${EXTENSION_NAME_INTERNAL}-todo-redmod-autoconvert`,
      `settings`,
      (state: VortexState): IREDmodProps => {
        const gameMode = vortexApiLib.selectors.activeGameId(state);
        return {
          gameMode,
          archiveAutoConvertEnabled: archiveAutoConvert(state),
        };
      },
      `clone`,
      `REDmod Autoconvert`,
      (props: IREDmodProps) => {
        toggleAutoConvert(vortexExt.api, props.gameMode);
      },
      (props: IREDmodProps) => isSupported(props.gameMode),
      (t: TranslationFunction, props: IREDmodProps) => (props.archiveAutoConvertEnabled ? t(`Yes`) : t(`No`)),
      undefined,
    );
  } // if (IsFeatureEnabled(features.REDmodding))

  vortexExt.once(() => {

    vortexExt.api.events.once(`startup`, () => {
      const extensionDetesForDebugging =
        extensionDetes(vortexExt.api.store.getState(), fullFeatureSetAvailablePostStartup);

      vortexApiLib.log(`info`, `${EXTENSION_NAME_INTERNAL} Vortex Extension Detes: ${extensionDetesForDebugging}`);
    });

    vortexExt.api.onAsync(`did-deploy`, (profileId) => {
      const state = vortexExt.api.store.getState();
      const profile = vortexApiLib.selectors.profileById(state, profileId);

      if (GAME_ID !== profile?.gameId) {
        return Promise.resolve();
      }

      vortexExt.api.emitAndAwait(`discover-tools`, GAME_ID);
      return Promise.resolve();
    });

  }); // vortexExt.once(() => {

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
  return true;
};

export default main;


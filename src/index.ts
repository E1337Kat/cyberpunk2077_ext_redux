import path from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Promise as BluebirdPromise,
} from "bluebird";
import * as vortexApiLib from "@nexusmods/vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import {
  getFileVersion,
  getProductVersion,
} from "exe-version";

// Our stuff
import {
  findFirst,
  map,
  mapWithIndex,
  toArray as toMutableArray,
} from "fp-ts/lib/ReadonlyArray";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  getOrElse as getOrElseO,
  map as mapO,
} from "fp-ts/lib/Option";
import {
  mapLeft,
} from "fp-ts/lib/Either";
import {
  EPICAPP_ID,
  EXTENSION_NAME_INTERNAL,
  EXTENSION_NAME_VORTEX,
  GAME_EXE_RELATIVE_PATH,
  GAME_ID,
  GOGAPP_ID,
  STEAMAPP_ID,
  V2077_DIR,
  VORTEX_STORE_PATHS,
} from "./index.metadata";
import {
  StaticFeaturesForStartup,
  FullFeatureSetFromStaticAndDynamic,
  IsFeatureEnabled,
  DefaultEnabledStateForDynamicFeatures,
  FeatureSet,
} from "./features";
import {
  wrapTestSupported,
  wrapInstall,
  internalPipelineInstaller,
} from "./installers";
import {
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexGameStoreEntry,
  VortexState,
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
  S,
  forEachEffect,
  forEffect,
} from "./util.functions";
import {
  clearREDmodAutoconvertArchivesSettingAction,
} from "./actions";
import {
  canConvertToREDmod,
  canRevertToArchiveMod,
  convertArchiveModsToREDmods,
  revertREDmodsToArchiveMods,
} from "./redmod.conversion.actions";
import settingsComponent from './views/settings'; // eslint-disable-line import/extensions
import {
  makeSettingsReducer,
} from './reducers';
import {
  isSupported,
} from "./state.functions";
import * as REDmoddingTools from "./tools.redmodding";
import * as ExternalTools from "./tools.external";
import {
  ToolStartHook,
} from "./tools.types";


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


//
// Setup functions so we don't clutter the main
//

// TODO This should really be both Tool + Hook
//      https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/282
const prepStartHooks =
  (vortexExt: VortexExtensionContext, featureSet: FeatureSet): ToolStartHook[] => {
    const maybeREDmodHooks =
      IsFeatureEnabled(StaticFeaturesForStartup.REDmodding)
        ? REDmoddingTools.available.startHooks
        : [];

    const allHooks = [
      ...maybeREDmodHooks,
      ...ExternalTools.available.startHooks,
    ];

    const hooksWithState =
      pipe(
        allHooks,
        map((makeHook) => makeHook(vortexExt, vortexApiLib, featureSet)),
        toMutableArray,
      );

    return hooksWithState;
  };

const getGameVersion = async (gamePath: string): Promise<string> => {
  try {
    const prodVer = await getProductVersion(path.join(gamePath, GAME_EXE_RELATIVE_PATH));
    return prodVer;
  } catch (err) {
    vortexApiLib.log(`error`, `Failed to get product version for Cyberpunk EXE`, err);
    try {
      const fileVer = await getFileVersion(path.join(gamePath, GAME_EXE_RELATIVE_PATH));
      return fileVer;
    } catch (fileErr) {
      vortexApiLib.log(`error`, `Failed to get file version for Cyberpunk EXE`, fileErr);
      return `0.0.0`;
    }
  }
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
      ? REDmoddingTools.GameExeModded.parameters
      : [];

  const fullFeatureSetAvailablePostStartup =
    FullFeatureSetFromStaticAndDynamic(StaticFeaturesForStartup, vortexExt.api, vortexApiLib.util);

  // Ok, now we have everything in hand to register our stuff with Vortex

  const vortexGameParams = {
    id: GAME_ID,
    name: EXTENSION_NAME_VORTEX,
    setup: setupFunctionToRunAtExtensionInit,
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => ``,
    logo: `gameart.png`,
    executable: () => GAME_EXE_RELATIVE_PATH,
    parameters: defaultGameLaunchParameters,
    requiredFiles: [GAME_EXE_RELATIVE_PATH],
    supportedTools: moddingTools,
    compatible: {
      symlinks: false,
    },
    getGameVersion,
    requiresLauncher: requiresGoGLauncher,
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID,
      epicAppId: EPICAPP_ID,
    },
  };

  vortexApiLib.log(`debug`, `Registering game with Vortex`, vortexGameParams);

  vortexExt.registerGame(vortexGameParams);

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

  const availableStartHooks = prepStartHooks(vortexExt, fullFeatureSetAvailablePostStartup);

  pipe(
    availableStartHooks,
    mapWithIndex((i: number, { hookId, doActualWorkInTheHookAndReturnDummyParams }) =>
      forEffect(() => { vortexExt.registerStartHook(40 + i, hookId, doActualWorkInTheHookAndReturnDummyParams); })),
    forEachEffect,
    mapLeft((err) => {
      vortexApiLib.log(`error`, `${EXTENSION_NAME_INTERNAL} init: Failed to register start hook`, err);
    }),
  );

  if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodding)) {
    if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodLoadOrder)) {
      vortexExt.registerLoadOrder({
        gameId: GAME_ID,

        // This needs to be actually implemented, it doesnt't do
        // anything on its own, so leave it out now to avoid confusion
        //
        // toggleableEntries: true,
        //
        usageInstructions: loadOrderUsageInstructionsForVortexGui,
        validate: wrapValidate(vortexExt, vortexApiLib, internalLoadOrderer),
        deserializeLoadOrder: wrapDeserialize(vortexExt, vortexApiLib, internalLoadOrderer),
        serializeLoadOrder: wrapSerialize(vortexExt, vortexApiLib, internalLoadOrderer),
      });

    } // if (IsFeatureEnabled(StaticFeaturesForStartup.REDmodLoadOrder))

    vortexExt.registerReducer(VORTEX_STORE_PATHS.settings, makeSettingsReducer(DefaultEnabledStateForDynamicFeatures));

    vortexExt.registerSettings(`V2077 Settings`, settingsComponent, undefined, () =>
      isSupported(vortexApiLib.selectors.activeGameId(vortexExt.api.store.getState())), 51);

    // Reading vortexExt.api is only allowed once init is over, so this stays a
    // function and every caller below is one Vortex invokes later.
    const apiWithLogging = (): VortexApi => ({ ...vortexExt.api, log: vortexApiLib.log });

    vortexExt.registerAction(
      `mods-action-icons`,
      300,
      `swap`,
      {},
      `Convert to REDmod`,
      (modIds: string[]) => {
        convertArchiveModsToREDmods(apiWithLogging(), modIds);
      },
      canConvertToREDmod(apiWithLogging),
    );

    vortexExt.registerAction(
      `mods-action-icons`,
      301,
      `undo`,
      {},
      `Revert to archive mod`,
      (modIds: string[]) => {
        revertREDmodsToArchiveMods(apiWithLogging(), modIds);
      },
      canRevertToArchiveMod(apiWithLogging),
    );

    // Registered alongside the reducer that handles the action, since without
    // that the dispatch goes nowhere.
    vortexExt.registerMigration((oldVersion: string) => {
      vortexApiLib.log(
        `info`,
        `${EXTENSION_NAME_INTERNAL}: clearing the retired autoconvert-on-install setting`,
        { oldVersion },
      );
      vortexExt.api.store.dispatch(clearREDmodAutoconvertArchivesSettingAction());

      return BluebirdPromise.resolve();
    });

  } // if (IsFeatureEnabled(features.REDmodding))

  vortexExt.once(() => {

    vortexExt.api.events.once(`startup`, () => {
      const extensionDetesForDebugging =
        extensionDetes(vortexExt.api.store.getState(), fullFeatureSetAvailablePostStartup);

      vortexApiLib.log(`info`, `${EXTENSION_NAME_INTERNAL} Vortex Extension Detes: ${extensionDetesForDebugging}`);
    });

    vortexExt.api.onAsync(`did-deploy`, (profileId: string) => {
      const state = vortexExt.api.store.getState();
      const profile = vortexApiLib.selectors.profileById(state, profileId);

      if (GAME_ID !== profile?.gameId) {
        return Promise.resolve();
      }

      vortexExt.api.emitAndAwait(`discover-tools`, GAME_ID);
      return Promise.resolve();
    });

    // Enabling a mod can be the moment REDmods start mattering, and setup only
    // runs when the game is activated.
    vortexExt.api.events.on(`mods-enabled`, (_modIds: string[], enabled: boolean, gameId: string) => {
      const discovery =
        vortexApiLib.selectors.discoveryByGame(vortexExt.api.store.getState(), GAME_ID);

      if (gameId !== GAME_ID || !enabled || discovery?.path === undefined) {
        return;
      }

      wrappedPrepareForModdingWithREDmodding(vortexExt, vortexApiLib, discovery);
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


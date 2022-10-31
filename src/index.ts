import path from "path";
import * as vortexApi from "vortex-api"; // eslint-disable-line import/no-extraneous-dependencies
import I18next from 'i18next'; // eslint-disable-line import/no-extraneous-dependencies

// Our stuff
import {
  EPICAPP_ID,
  GAME_ID,
  GOGAPP_ID,
  isSupported,
  STEAMAPP_ID,
  V2077_DIR,
  VORTEX_STORE_PATHS,
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
  VortexState,
} from "./vortex-wrapper";
import {
  internalSettingsViewStuff,
  REDlauncher,
  REDmoddingTools,
  wrappedPrepareForModdingWithREDmodding,
  wrapVortexActionConditionFunc,
  wrapVortexActionFunc,
} from './redmodding';
import {
  FeaturesFromSettings,
  IsFeatureEnabled,
} from "./features";
import {
  wrapValidate,
  internalLoadOrderer,
  wrapDeserialize,
  wrapSerialize,
} from "./load_order";
import {
  bbcodeBasics,
  heredoc,
} from "./installers.utils";
import { setArchiveAutoConvert } from "./actions";
import { informUserZeroNineZeroChanges } from "./ui.dialogs";
import settingsComponent from './views/settings'; // eslint-disable-line import/extensions
import settingsReducer from './reducers';


export const findGame = (): string =>
  vortexApi.util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID, EPICAPP_ID]).then(
    (game: VortexGameStoreEntry) => game.gamePath,
  );

const requiresGoGLauncher = (): Promise<{ launcher: string; addInfo?: string; }> =>
  vortexApi.util.GameStoreHelper.isGameInstalled(GOGAPP_ID, `gog`).then((gog) =>
    (gog ? { launcher: `gog`, addInfo: GOGAPP_ID } : undefined));


type TranslationFunction = typeof I18next.t;

interface IREDmodProps {
  gameMode: string;
  archiveAutoConvertEnabled: boolean;
}

const archiveAutoConvert = (state: vortexApi.types.IState): boolean => vortexApi.util.getSafe(state, [`settings`, `v2077`, `v2077_feature_redmod_autoconvert_archives`], false);

const toggleAutoConvert = (api: vortexApi.types.IExtensionApi, _gameMode: string): void => {
  const state: vortexApi.types.IState = api.store.getState();
  api.store.dispatch(setArchiveAutoConvert(!archiveAutoConvert(state)));
};

//
// Register extension in entry point
//

// This is the main function Vortex will run when detecting the game extension.
const main = (vortex: VortexExtensionContext): boolean => {

  // Maybe we could grab the API earlier, but...
  const features = FeaturesFromSettings(vortexApi.util.getSafe, vortex.api);

  // REDmodding conditional stuff
  //

  const MaybeREDmodTools =
    IsFeatureEnabled(features.REDmodding)
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

  const setupFunctionToRunAtExtensionInit =
    async (discovery: VortexDiscoveryResult): Promise<void> => {
      try {
        await vortexApi.fs.ensureDirWritableAsync(path.join(discovery.path, V2077_DIR));
        vortexApi.log(`info`, `Metadata directory ${V2077_DIR} exists and is writable, good!`);
      } catch (err) {
        // This might be an actual problem but let's not prevent proceeding..
        vortexApi.log(`error`, `Unable to create or access metadata dir ${V2077_DIR} under ${discovery.path}`, err);
      }

      if (IsFeatureEnabled(features.REDmodding)) {
        return wrappedPrepareForModdingWithREDmodding(vortex, vortexApi, discovery);
      }

      return vortexApi.fs.readdirAsync(path.join(discovery.path));
    };


  const defaultGameLaunchParameters =
  IsFeatureEnabled(features.REDmodding)
    ? REDlauncher.parameters
    : [];

  // Ok, now we have everything in hand to register our stuff with Vortex

  vortex.registerGame({
    id: GAME_ID,
    name: `Cyberpunk 2077`,
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

  vortex.registerInstaller(
    internalPipelineInstaller.id,
    internalPipelineInstaller.priority,
    wrapTestSupported(vortex, vortexApi, internalPipelineInstaller),
    wrapInstall(
      vortex,
      vortexApi,
      internalPipelineInstaller,
      features,
    ),
  );

  if (IsFeatureEnabled(features.REDmodding)) {
    if (IsFeatureEnabled(features.REDmodLoadOrder)) {
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
        usageInstructions: heredoc(bbcodeBasics(`
        You don't have to order everything. It's best to only order mods that
        require it, or that you otherwise know to conflict with each other.

        Only REDmods and autoconverted heritage mods are orderable. If you don't see
        something you just installed, click on Refresh.

        You can order both enabled and disabled mods, but only the enabled ones will
        be included in the REDmod deployment. The disabled ones will remember their
        place in the load order, though, so long as you don't uninstall them!

        All heritage archive mods that are not autoconverted to REDmod will be loaded
        AFTER all REDmods, in the usual alphabetical order.

        REDmods that you have installed outside Vortex are NOT supported right now.

        The load order is saved automatically, and will be deployed whenever the next
        Vortex deployment occurs - you can also manually click to deploy, if you like!

        REDmod deployment can take a little while if you have tweak or script mods,
        so wait for the green success notification before you start the game! :)

        You can still use the redmod tool manually, too, but changes won't be reflected
        in Vortex.
      `)),

        validate: wrapValidate(vortex, vortexApi, internalLoadOrderer),
        deserializeLoadOrder: wrapDeserialize(vortex, vortexApi, internalLoadOrderer),
        serializeLoadOrder: wrapSerialize(vortex, vortexApi, internalLoadOrderer),
      });

    }

    vortex.registerReducer(VORTEX_STORE_PATHS.settings, settingsReducer);

    vortex.registerSettings(`V2077 Settings`, settingsComponent, undefined, () => {
      const state = vortex.api.store.getState();
      const gameMode = vortexApi.selectors.activeGameId(state);
      return gameMode === GAME_ID;
    }, 51);

    // 0.9.0 information TODO
    vortex.registerToDo(
      `v9-redmod-information`,
      `more`,
      undefined,
      `info`,
      `Click to see 0.9.0 Updates`,
      (_: IREDmodProps) => informUserZeroNineZeroChanges({ ...vortex.api, log: vortexApi.log }),
      (_: IREDmodProps) => IsFeatureEnabled(features.REDmodding),
      undefined,
      undefined,
    );

    // Auto convert TODO
    vortex.registerToDo(
      `redmod-autoconvert`,
      `settings`,
      (state: VortexState): IREDmodProps => {
        const gameMode = vortexApi.selectors.activeGameId(state);
        return {
          gameMode,
          archiveAutoConvertEnabled: archiveAutoConvert(state),
        };
      },
      `download`,
      `REDmod Autoconvert`,
      (props: IREDmodProps) => {
        toggleAutoConvert(vortex.api, props.gameMode);
        vortex.api.events.emit(`analytics-track-click-event`, `Dashboard`, `Archive Autoconvert to REDmod ${props.archiveAutoConvertEnabled ? `ON` : `OFF`}`);
      },
      (props: IREDmodProps) => isSupported(props.gameMode),
      (t: TranslationFunction, props: IREDmodProps) => (props.archiveAutoConvertEnabled ? t(`Yes`) : t(`No`)),
      undefined,
    );

    vortex.registerAction(
      `mod-icons`,
      300,
      `settings`,
      {},
      `Configure REDmod`,
      wrapVortexActionFunc(vortex, vortexApi, features, internalSettingsViewStuff),
      wrapVortexActionConditionFunc(vortex, vortexApi, features, internalSettingsViewStuff),
    );

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
  } // if (IsFeatureEnabled(features.REDmodding))

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


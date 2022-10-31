import path from "path";
import {
  fs,
  selectors,
  util as VortexUtil,
} from "vortex-api";
// import I18next from 'i18next'; // eslint-disable-line import/no-extraneous-dependencies
import { setRedmodForceDeploy } from "./actions";
import {
  CurrentFeatureSet,
  IsFeatureEnabled,
  StaticFeatures,
} from "./features";
import {
  GOGAPP_ID,
  STEAMAPP_ID,
  EPICAPP_ID,
  isSupported,
} from './index.metadata';
import {
  REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES,
  REDMODDING_REQUIRED_DIR_FOR_MODS,
  V2077_LOAD_ORDER_DIR,
} from "./redmodding.metadata";
import {
  V2077SettingsView,
  ActionType,
  V2077ActionConditionFunc,
  V2077ActionFunc,
} from "./redmodding.types";
import { promptUserInstallREDmoddingDlc } from "./ui.dialogs";
import {
  VortexActionConditionFunc,
  VortexActionConditionResult,
  VortexActionFunc,
  VortexActionResult,
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexState,
  VortexToolDiscovered,
} from "./vortex-wrapper";

// This function runs on starting up Vortex or switching to Cyberpunk as the active game. This may need to be converted to a test, but the UI for tests is less flexible.

interface REDmoddingDlcDetails {
  name: string;
  url: string;
  openCommand: () => Promise<void>;
}
// type TranslationFunction = typeof I18next.t;

export const REDlauncher = {
  id: `V2077-tools-REDLauncher`,
  name: `REDLauncher`,
  logo: `REDLauncher.png`,
  requiredFiles: [`REDprelauncher.exe`],
  executable: (): string => `REDprelauncher.exe`,
  parameters: [`-modded`],
  environment: {},
  relative: true,
};

// Not installing the Tool for now because we're
// using automatic deployment. Maybe enable it
// later, but it'll require carrying the new
// load order through starthooks.
export const REDmodDeploy = {
  id: `V2077-tools-redMod`,
  name: `REDmod Deploy`,
  shortName: `REDdeploy`,
  requiredFiles: [path.join(`tools\\redmod\\bin\\redMod.exe`)],
  executable: (): string => path.join(`tools\\redmod\\bin\\redMod.exe`),
  parameters: [`deploy`],
  relative: true,
  shell: true,
  exclusive: true,
};

export const REDmoddingTools = [
  REDlauncher,
  // REDmodDeploy,
];

export const redModTool = (state: VortexState, gameId: string): VortexToolDiscovered => {
  const tools = state.settings.gameMode.discovered[gameId]?.tools || {};
  return Object.keys(tools).map((id) => tools[id])
    .filter((iter) => (iter !== undefined) && (iter.path !== undefined))
    .find((iter) => path.basename(iter.path).toLowerCase() === `redMod.exe`);
};

const autoDeployAction: V2077ActionFunc = (
  vortexApi: VortexApi,
  _features: StaticFeatures,
  _instanceIds: string[],
): VortexActionResult => {
  const state = vortexApi.store.getState();
  const profile = selectors.activeProfile(state);
  vortexApi.store.dispatch(setRedmodForceDeploy(profile.id, true));
};

export const wrapVortexActionFunc =
  (
    vortex: VortexExtensionContext,
    vortexApiThing,
    actions: V2077SettingsView,
  ): VortexActionFunc =>
    //
    // This is the function that Vortex calls.
    (instanceIds?: string[]): VortexActionResult => {
      //
      const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

      return actions.actionOrCondition(
        vortexApi,
        CurrentFeatureSet,
        instanceIds,
      );
    };

const autoDeployActionCondition: V2077ActionConditionFunc = (
  vortexApi: VortexApi,
  features: StaticFeatures,
  _instanceIds: string[],
): VortexActionConditionResult => {
  if (!IsFeatureEnabled(features.REDmodding)) {
    return false;
  }
  const state = vortexApi.store.getState();
  const gameMode = selectors.activeGameId(state);
  const tool = redModTool(state, gameMode);
  return isSupported(gameMode) && (tool !== undefined);
};

export const wrapVortexActionConditionFunc =
  (
    vortex: VortexExtensionContext,
    vortexApiThing,
    actions: V2077SettingsView,
  ): VortexActionConditionFunc =>
    //
    // This is the function that Vortex calls.
    (instanceIds?: string[]): VortexActionConditionResult => {
      //
      const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

      return actions.condition(
        vortexApi,
        CurrentFeatureSet,
        instanceIds,
      );
    };

const fetchREDmoddingDlcDetails = (id: string): REDmoddingDlcDetails => {
  const genericHelpUrl = `https://www.cyberpunk.net/en/modding-support`;

  const isRedModSupportingGamePlatform = [`epic`, `gog`, `steam`].includes(id);

  if (!isRedModSupportingGamePlatform) {
    return { name: undefined, url: genericHelpUrl, openCommand: () => VortexUtil.opn(genericHelpUrl) };
  }

  const gameStoreData: { [id: string]: REDmoddingDlcDetails } = {
    epic: {
      name: `Epic Games Store`,
      url: `https://store.epicgames.com/en-US/p/cyberpunk-2077`,
      openCommand: () => VortexUtil.opn(`com.epicgames.launcher://store/p/cyberpunk-2077`),
    },
    steam: {
      name: `Steam`,
      url: `https://store.steampowered.com/app/2060310/Cyberpunk_2077_REDmod/`,
      openCommand: () => VortexUtil.opn(`steam://run/2060310`),
    },
    gog: {
      name: `GOG`,
      url: `https://www.gog.com/en/game/cyberpunk_2077_redmod`,
      openCommand: (): Promise<void> => VortexUtil.opn(`goggalaxy://openStoreUrl/embed.gog.com/game/cyberpunk_2077_redmod`),
    },
  };

  return gameStoreData[id];
};

const promptREDmoddingDlcInstall = async (vortexApi: VortexApi, gameStoreId: string): Promise<void> => {
  const redModDetails = fetchREDmoddingDlcDetails(gameStoreId);

  await promptUserInstallREDmoddingDlc(
    vortexApi,
    redModDetails,
    () => VortexUtil.opn(redModDetails.url),
  );
};

const prepareForModdingWithREDmodding = async (
  vortexApi: VortexApi,
  discovery: VortexDiscoveryResult,
): Promise<void> => {

  // Ensure the directories required by REDmodding exist
  try {
    await fs.ensureDirWritableAsync(path.join(discovery.path, REDMODDING_REQUIRED_DIR_FOR_MODS));
    await fs.ensureDirWritableAsync(path.join(discovery.path, REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES));
    vortexApi.log(`info`, `Directories required for REDmodding exist and are writable, good!`);
  } catch (err) {
    // We can hopefully ignore this issue as it's likely they'll be created when the user installs a mod.
    vortexApi.log(`warn`, `Unable to create or access required REDmodding directories in game path ${discovery.path}`, err);
  }

  try {
    await fs.ensureDirWritableAsync(path.join(discovery.path, V2077_LOAD_ORDER_DIR));
    vortexApi.log(`info`, `Load order directory exists and is writable, good!`);
  } catch (err) {
    // This might be an actual problem but let's not prevent proceeding..
    vortexApi.log(`error`, `Unable to create or access load order storage dir ${V2077_LOAD_ORDER_DIR} under ${discovery.path}`, err);
  }

  // Check for the REDmod files.
  const redLauncherPath = path.join(discovery.path, REDlauncher.executable());
  const redModPath = path.join(discovery.path, REDmodDeploy.executable());

  try {
    await Promise.all([redLauncherPath, redModPath].map(async (file) => fs.statAsync(file)));

    // Only need to run the DLC finder if the files aren't there yet
    return;
  } catch (err) {
    vortexApi.log(`warn`, `REDmod not found for Cyberpunk 2077, offering the download...`, err);
  }

  // Determine which game store this is from, so we can recommend the correct process.
  const game = await VortexUtil.GameStoreHelper.findByAppId([GOGAPP_ID, STEAMAPP_ID, EPICAPP_ID]);
  if (game?.gamePath !== discovery.path) {
    vortexApi.log(`warn`, `Cyberpunk discovery doesn't match auto-detected path`, { discovery: discovery.path, autoDetect: game.path });
  }

  await promptREDmoddingDlcInstall(vortexApi, game?.gameStoreId);
};

export const wrappedPrepareForModdingWithREDmodding = async (
  vortex: VortexExtensionContext,
  vortexApiThing,
  discovery: VortexDiscoveryResult,
): Promise<void> => {
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  vortexApi.log(`info`, `Checking for REDmod install`);

  return prepareForModdingWithREDmodding(vortexApi, discovery);
};

export const internalSettingsViewStuff: V2077SettingsView = {
  type: ActionType.AutoRunDeploy,
  id: ``,
  actionOrCondition: autoDeployAction,
  condition: autoDeployActionCondition,
  // test: checkTest,
};

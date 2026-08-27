import path from "path";
import {
  fs,
  selectors,
  util as VortexUtil,
} from "@vortex-api-test-shimmed";
import {
  map,
  some as any,
} from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import {
  GAME_ID,
  GOGAPP_ID,
  STEAMAPP_ID,
  EPICAPP_ID,
} from './index.metadata';
import {
  attrModType,
  ModType,
} from "./installers.types";
import {
  InfoNotification,
  showInfoNotification,
} from "./ui.notifications";
import {
  REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES,
  REDMODDING_REQUIRED_DIR_FOR_MODS,
  V2077_LOAD_ORDER_DIR,
} from "./redmodding.metadata";
import {
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexMod,
  VortexNotificationAction,
  VortexState,
  VortexToolDiscovered,
} from "./vortex-wrapper";
import {
  REDdeployManual,
  REDlauncher,
} from "./tools.redmodding";

// This function runs on starting up Vortex or switching to Cyberpunk as the active game.
// This may need to be converted to a test, but the UI for tests is less flexible.

interface REDmoddingDlcDetails {
  // Absent when we can't tell which store the game came from
  name?: string;
  url: string;
}


export const detectREDmoddingDlc = (state: VortexState, gameId: string): VortexToolDiscovered => {
  const tools = state.settings.gameMode.discovered[gameId]?.tools || {};
  return Object.keys(tools).map((id) => tools[id])
    .filter((iter) => (iter !== undefined) && (iter.path !== undefined))
    .find((iter) => path.basename(iter.path).toLowerCase() === `redMod.exe`);
};


// Store pages rather than launcher deep links: the protocols open the client on
// an empty page and report success either way.
export const fetchREDmoddingDlcDetails = (gameStoreId?: string): REDmoddingDlcDetails => {
  const storePages: Record<string, REDmoddingDlcDetails> = { // keyed by Vortex game store id
    epic: {
      name: `the Epic Games Store`,
      url: `https://store.epicgames.com/en-US/p/cyberpunk-2077`,
    },
    steam: {
      name: `Steam`,
      url: `https://store.steampowered.com/app/2060310/Cyberpunk_2077_REDmod/`,
    },
    gog: {
      name: `GOG`,
      url: `https://www.gog.com/en/game/cyberpunk_2077_redmod`,
    },
  };

  return storePages[gameStoreId] ?? { url: `https://www.cyberpunk.net/en/modding-support` };
};

export const anyREDmodsIn = (mods: readonly VortexMod[]): boolean =>
  pipe(
    mods,
    any((mod) => mod.state === `installed` && attrModType(mod) === ModType.REDmod),
  );

const anyREDmodsAreInstalled = (vortexApi: VortexApi): boolean => {
  const allMods: Record<string, VortexMod> = // keyed by Vortex mod id
    selectors.modsForGame(vortexApi.store.getState(), GAME_ID) ?? {};

  return anyREDmodsIn(Object.values(allMods));
};

// A notification rather than a dialog: the user has something to fix, but it
// doesn't have to be answered before they can carry on doing anything else.
const warnREDmoddingDlcIsMissing = (vortexApi: VortexApi, gameStoreId?: string): void => {
  const { name, url } = fetchREDmoddingDlcDetails(gameStoreId);

  const whereToGetIt =
    name === undefined
      ? `You can get it for free from wherever you bought the game.`
      : `You can get it for free from ${name}.`;

  const openTheStorePage: VortexNotificationAction[] = [{
    title: `Get REDmod`,
    action: (dismiss: () => void): void => {
      VortexUtil.opn(url).catch(() => undefined);
      dismiss();
    },
  }];

  showInfoNotification(
    vortexApi,
    InfoNotification.REDmodDlcMissing,
    `You have REDmods installed, and they won't load without the free REDmod DLC. ${whereToGetIt}`,
    openTheStorePage,
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

  // Attempt to detect if the user has the REDmodding DLC installed
  const requiredREDmoddingFiles = [
    ...REDlauncher.requiredFiles,
    ...REDdeployManual.requiredFiles,
  ];

  try {
    await pipe(
      requiredREDmoddingFiles,
      map((file) =>
        fs.statAsync(path.join(discovery.path, file))),
      Promise.all,
    );

    // Only need to run the DLC finder if the files aren't there yet
    return;

  } catch (err) {
    vortexApi.log(`info`, `REDmod not found for Cyberpunk 2077`, err);
  }

  // Only someone with a REDmod to load has any use for the DLC
  if (!anyREDmodsAreInstalled(vortexApi)) {
    vortexApi.log(`info`, `No REDmods installed, so REDmod isn't needed yet - saying nothing`);
    return;
  }

  const gameStoreIfInstalledThroughStore =
    await VortexUtil.GameStoreHelper.findByAppId([GOGAPP_ID, STEAMAPP_ID, EPICAPP_ID]).catch(() => undefined);

  if (gameStoreIfInstalledThroughStore?.gamePath !== discovery.path) {
    vortexApi.log(`warn`, `Cyberpunk discovery doesn't match auto-detected path`, { discovery: discovery.path, gameStoreIfInstalledThroughStore });
  }

  warnREDmoddingDlcIsMissing(vortexApi, gameStoreIfInstalledThroughStore?.gameStoreId);
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

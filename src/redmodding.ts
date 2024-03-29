import path from "path";
import {
  fs,
  util as VortexUtil,
} from "@vortex-api-test-shimmed";
import { map } from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import {
  GOGAPP_ID,
  STEAMAPP_ID,
  EPICAPP_ID,
} from './index.metadata';
import {
  REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES,
  REDMODDING_REQUIRED_DIR_FOR_MODS,
  V2077_LOAD_ORDER_DIR,
} from "./redmodding.metadata";
import { promptUserInstallREDmoddingDlc } from "./ui.dialogs";
import {
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
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
  name: string;
  url: string;
  openCommand: () => Promise<void>;
}


export const detectREDmoddingDlc = (state: VortexState, gameId: string): VortexToolDiscovered => {
  const tools = state.settings.gameMode.discovered[gameId]?.tools || {};
  return Object.keys(tools).map((id) => tools[id])
    .filter((iter) => (iter !== undefined) && (iter.path !== undefined))
    .find((iter) => path.basename(iter.path).toLowerCase() === `redMod.exe`);
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
    vortexApi.log(`warn`, `REDmod not found for Cyberpunk 2077, offering the download...`, err);
  }

  const gameStoreIfInstalledThroughStore =
    await VortexUtil.GameStoreHelper.findByAppId([GOGAPP_ID, STEAMAPP_ID, EPICAPP_ID]).catch(() => undefined);

  if (gameStoreIfInstalledThroughStore?.gamePath !== discovery.path) {
    vortexApi.log(`warn`, `Cyberpunk discovery doesn't match auto-detected path`, { discovery: discovery.path, gameStoreIfInstalledThroughStore });
  }

  await promptREDmoddingDlcInstall(vortexApi, gameStoreIfInstalledThroughStore?.gameStoreId);
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

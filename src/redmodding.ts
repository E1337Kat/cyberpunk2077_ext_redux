import path from "path";
import {
  fs,
  util as VortexUtil,
} from "@vortex-api-test-shimmed";
import {
  every,
} from "fp-ts/lib/ReadonlyArray";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  Either,
  isRight,
  left,
  right,
} from "fp-ts/lib/Either";
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
import {
  promptUserInstallREDmoddingDlc,
} from "./ui.dialogs";
import {
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
} from "./vortex-wrapper";
import {
  REDdeployManual,
  REDlauncher,
} from "./tools.redmodding";
import {
  jsonp,
} from "./util.functions";

// This function runs on starting up Vortex or switching to Cyberpunk as the active game.
// This may need to be converted to a test, but the UI for tests is less flexible.

interface REDmoddingDlcDetails {
  name: string;
  url: string;
  openCommand: () => Promise<void>;
}


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


// Returning an Either means we don't need vortexApi to be passed in for errors
export const isREDmoddingDlcAvailable = (
  gameDirPath: string,
): Either<Error, true> => {

  const requiredREDmoddingFiles = [
    ...REDlauncher.requiredFiles,
    ...REDdeployManual.requiredFiles,
  ];

  try {
    const foundRequiredFiles =
      pipe(
        requiredREDmoddingFiles,
        every((file) => !!fs.statSync(path.join(gameDirPath, file))),
      );

    return foundRequiredFiles
      ? right(true)
      : left(new Error(`isREDmoddingDlcAvailable: expected required files to exist: ${jsonp({ requiredREDmoddingFiles })}`));

  } catch (error) {
    return left(new Error(`isREDmoddingDlcAvailable: expected error checking for required files ${jsonp({ error, requiredREDmoddingFiles })}`));
  }
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

  const foundREDmoddingDlcFiles =
      isREDmoddingDlcAvailable(discovery.path);

  if (isRight(foundREDmoddingDlcFiles)) {
    vortexApi.log(`info`, `REDmodding DLC files found, good!`);

    return;
  }

  vortexApi.log(`warn`, foundREDmoddingDlcFiles.left.message);
  vortexApi.log(`warn`, `REDmod not found for Cyberpunk 2077, offering the download...`);

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

  vortexApi.log(`info`, `REDmodding: checking for the REDmodding DLC and necessary directories...`);

  return prepareForModdingWithREDmodding(vortexApi, discovery);
};

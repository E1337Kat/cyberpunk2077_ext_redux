import path from "path";
import {
  fs,
  util as VortexUtil,
} from "vortex-api";
import {
  GOGAPP_ID,
  STEAMAPP_ID,
  EPICAPP_ID,
} from './index.metadata';
import { promptUserInstallREDmoddingDlc } from "./ui.dialogs";
import {
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
} from "./vortex-wrapper";

// This function runs on starting up Vortex or switching to Cyberpunk as the active game. This may need to be converted to a test, but the UI for tests is less flexible.

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

const prepareForModdingWithREDmodding = async (
  vortexApi: VortexApi,
  discovery: VortexDiscoveryResult,
): Promise<void> => {
  try {
    // Ensure the mods folder exists
    await fs.ensureDirAsync(path.join(discovery.path, `mods`));
  } catch (err) {
    // We can ignore this if it fails as REDmod makes the folder anyway.
    vortexApi.log(`warn`, `Unable to create mods directory in Cyberpunk 2077.`, err);
  }

  // Check for the REDmod files.
  const redLauncherPath = path.join(discovery.path, `REDprelauncher.exe`);
  const redModPath = path.join(discovery.path, `tools`, `redmod`, `bin`, `redMod.exe`);

  try {
    await Promise.all([redLauncherPath, redModPath].map(async (file) => fs.statAsync(file)));
    return;
  } catch (err) {
    // If this fails, then we know REDmod isn't installed properly.
    vortexApi.log(`debug`, `REDmod not found for Cyberpunk 2077`, err);
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

export const REDmoddingTools = [
  {
    id: `REDLauncher`,
    name: `REDLauncher`,
    logo: `REDLauncher.png`,
    executable: (): string => `REDprelauncher.exe`,
    requiredFiles: [`REDprelauncher.exe`],
    relative: true,
  },
];

export const REDmoddingGameLaunchParameters = [
  `-modded`,
];

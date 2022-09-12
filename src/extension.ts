import path from "path";
import { fs } from "vortex-api";
import * as VortexUtil from "vortex-api/lib/util/api"; // eslint-disable-line import/no-extraneous-dependencies
import { GOGAPP_ID, STEAMAPP_ID, EPICAPP_ID } from './index.metadata';
import { promptUserInstallREDmodDLC } from "./ui.dialogs";
import {
  VortexApi,
  VortexDiscoveryResult,
  VortexExtensionContext,
} from "./vortex-wrapper";

// This function runs on starting up Vortex or switching to Cyberpunk as the active game. This may need to be converted to a test, but the UI for tests is less flexible.

const getREDmodetails = (id: string): { name: string, url: string } => {
  if (!id || ![`epic`, `gog`, `steam`].includes(id)) return { name: undefined, url: `https://www.cyberpunk.net/en/modding-support` };

  const gameStoreData = {
    epic: {
      name: `Epic Games Store`,
      url: `https://store.epicgames.com/en-US/p/cyberpunk-2077`,
    },
    steam: {
      name: `Steam`,
      url: `steam://run/2060310`,
    //   url: `https://store.steampowered.com/app/2060310/Cyberpunk_2077_REDmod/`,
    },
    gog: {
      name: `GOG`,
      url: `https://www.gog.com/en/game/cyberpunk_2077_redmod`,
    },
  };

  return gameStoreData[id];
};

const promptREDmodInstall = async (vortexApi: VortexApi, gameStoreId: string): Promise<void> => {
  const redModDetails = getREDmodetails(gameStoreId);

  await promptUserInstallREDmodDLC(vortexApi, redModDetails);
};

const prepareForModding = async (
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
  if (game?.path !== discovery.path) vortexApi.log(`warn`, `Cyberpunk discovery doesn't match auto-detected path`, { discovery: discovery.path, autoDetect: game.path });

  await promptREDmodInstall(vortexApi, game?.gameStoreId);
};

export const wrappedPrepareForModding = async (
  vortex: VortexExtensionContext,
  vortexApiThing,
  discovery: VortexDiscoveryResult,
): Promise<void> => {
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  vortexApi.log(`info`, `Checking for REDmod install`);

  return prepareForModding(vortexApi, discovery);
};

import path from "path";
// eslint-disable-next-line object-curly-newline
import { fs, log, types, util } from "vortex-api";
import { GOGAPP_ID, STEAMAPP_ID, EPICAPP_ID } from './index.metadata';

// This function runs on starting up Vortex or switching to Cyberpunk as the active game. This may need to be converted to a test, but the UI for tests is less flexible.

// eslint-disable-next-line func-style
function getREDmodetails(id: string): { name: string, url: string } {
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
}

// eslint-disable-next-line func-style
async function promptREDmodInstall(api: types.IExtensionApi, gameStoreId: string): Promise<void> {
  const redModDetails = getREDmodetails(gameStoreId);

  api.showDialog(
    `question`,
    `REDmod DLC missing`,
    {
      text: `The 1.6 update for Cyberpunk 2077 included an optional DLC called REDmod. This DLC allows the game to load modded content created with the REDmod toolkit.` +
      `Vortex has detected that the REDmod DLC is installed on your system.` +
      `You can get the DLC for free${redModDetails.name ? ` from ${redModDetails.name}` : null} using the button below.`,
    },
    [
      {
        label: `Get REDmod`,
        action: () => util.opn(redModDetails.url),
      },
      {
        label: `Ignore`,
      },
    ],
  );
}

const prepareForModding = async (discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> => {
  try {
    // Ensure the mods folder exists
    await fs.ensureDirAsync(path.join(discovery.path, `mods`));
  } catch (err) {
    // We can ignore this if it fails as REDmod makes the folder anyway.
    log(`warn`, `Unable to create mods directory in Cyberpunk 2077.`, err);
  }

  // Check for the REDmod files.
  const redLauncherPath = path.join(discovery.path, `REDprelauncher.exe`);
  const redModPath = path.join(discovery.path, `tools`, `redmod`, `bin`, `redMod.exe`);

  try {
    await Promise.all([redLauncherPath, redModPath].map(async (file) => fs.statAsync(file)));
    return;
  } catch (err) {
    // If this fails, then we know REDmod isn't installed properly.
    log(`debug`, `REDmod not found for Cyberpunk 2077`, err);
  }

  // Determine which game store this is from, so we can recommend the correct process.
  const game = await util.GameStoreHelper.findByAppId([GOGAPP_ID, STEAMAPP_ID, EPICAPP_ID]);
  if (game?.path !== discovery.path) log(`warn`, `Cyberpunk discovery doesn't match auto-detected path`, { discovery: discovery.path, autoDetect: game.path });

  // eslint-disable-next-line consistent-return
  return promptREDmodInstall(api, game?.gameStoreId);
};

export default prepareForModding;

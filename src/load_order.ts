/* eslint-disable @typescript-eslint/quotes */
import { win32 } from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import Promise from 'bluebird';
import { fs, selectors } from "vortex-api";
// eslint-disable-next-line import/no-extraneous-dependencies
import * as turbowalk from 'turbowalk';
import { GAME_ID } from "./index.metadata";
import { REDMOD_CANONICAL_INFO_FILE } from "./installers.layouts";
import { LoadOrderer, REDmodEntry } from "./load_order.types";
import {
  VortexApi,
  VortexDeserializeFunc,
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexLoadOrder,
  VortexSerializeFunc,
  vortexUtil,
  VortexValidateFunc,
  VortexValidationResult,
  VortexWrappedDeserializeFunc,
  VortexWrappedSerializeFunc,
  VortexWrappedValidateFunc,
} from "./vortex-wrapper";

// Ensure we're using win32 conventions
const path = win32;

const readDeploymentManifest = async (vortexApi: VortexApi) =>
  vortexUtil.getManifest(vortexApi, '', GAME_ID)
    .then((manifest) => Promise.reduce(manifest.files, (accum, iter) => {
      if (path.basename(iter.relPath) === REDMOD_CANONICAL_INFO_FILE) {
        const modId = iter.source;
        // eslint-disable-next-line no-param-reassign
        accum[modId] = {
          files: [].concat(accum?.[modId]?.files || [], path.basename(iter.relPath)),
        };
      }
      return Promise.resolve(accum);
    }, {}));

const nameToId = (name: string): string => name.replace(/[ ]|[0-9]/g, '');
const fileNameToId = (filePath: string): string => {
  const file = path.isAbsolute(filePath)
    ? path.basename(filePath)
    : filePath;

  const id = nameToId(file);
  return id;
};

// Internal Deserializer so that we can have access to more good good information
export const internalValidate: VortexWrappedValidateFunc = async (
  _vortexApi,
  _prev,
  _current,
): Promise<VortexValidationResult> => {
// find any entries that do not have the '.mod' file extension. (we decided to use the filename of the mod file as an entry id)
  const invalid = []; // current.filter((entry) => path.extname(entry.id) !== `.mod`);

  if (invalid.length === 0) {
    // we have no invalid entries; we can just return undefined here and Vortex will
    //  know that the load order has passed validation.
    return Promise.resolve(undefined);
  }
  // we found some invalid entries - we need to let the user know which mods have failed validation and why, so he can attempt to fix it.
  const invalidEntries = invalid.map((entry) => ({
    id: entry.id,
    reason: `'the mod file does not have the '.mod' file extension'`,
  }));
  return Promise.resolve({ invalid: invalidEntries });
};

const getDiscoveryPath = (
  api: VortexApi,
): string => {
  const state = api.store.getState();
  const discovery: VortexDiscoveryResult = vortexUtil.getSafe(
    state,
    [`settings`, `gameMode`, `discovered`, GAME_ID],
    {},
  );

  return discovery?.path;
};

const readREDmodManifest = async (
  vortexApi: VortexApi,
): Promise<{ mods: REDmodEntry[] }> => {
  const discoveryPath = getDiscoveryPath(vortexApi);
  const modListPath = path.join(discoveryPath, 'r6', 'cache', 'modded', 'mods.json');

  const listData = await fs.readFileAsync(modListPath, { encoding: `utf8` });
  const modList = JSON.parse(listData);
  return Promise.resolve(modList);
};

const getDeployedRedMods = async (
  vortexApi: VortexApi,
): Promise<string[]> => {
  const discoveryPath = getDiscoveryPath(vortexApi);
  const modsPath = path.join(discoveryPath, 'mods');
  vortexApi.log(`debug`, `Checking for REDmods at location: `, modsPath);
  let modFiles = [];
  const progressCallback = (entries: turbowalk.IEntry[]): void => {
    vortexApi.log(`debug`, `turbowalk entries: `, entries);
    modFiles = modFiles.concat(entries);
  };
  return turbowalk.default(modsPath, progressCallback, { recurse: false })
    .catch((err) => (['ENOENT', 'ENOTFOUND'].includes(err.code)
      ? Promise.resolve()
      : Promise.reject(err)))
    .then(() => Promise.resolve(modFiles));
};

// Internal Deserializer so that we can have access to more good good information
export const internalDeserializeLoadOrder: VortexWrappedDeserializeFunc = async (
  vortexApi: VortexApi,
) => {
  // We read in the redmod generated file if it exists
  const discoveryPath = getDiscoveryPath(vortexApi);
  if (discoveryPath === undefined) {
    return Promise.reject(new vortexUtil.NotFound(`Game not found`));
  }

  const state = vortexApi.store.getState();
  const profile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.reject(new Error(`wrong game`));
  }

  // We retrieve the list of mods that have been installed through Vortex from our application state
  const managedMods = vortexUtil.getSafe(state, [`persistent`, `mods`, GAME_ID], {});

  // We scan the game’s mods directory for all folders containing an 'info.json'.
  const deployedModFiles = await getDeployedRedMods(vortexApi);
  vortexApi.log(`debug`, `Found deployed data, maybe: `, deployedModFiles);

  // We retrieve the deployment manifest information which will allow us to find the modId for mod files deployed through Vortex.
  const deploymentMap = await readDeploymentManifest(vortexApi);

  // Need to handle reading it as json in any special way?
  const listData = await readREDmodManifest(vortexApi);
  vortexApi.log(`debug`, `Found list data: `, listData);
  const modList: REDmodEntry[] = listData.mods;
  vortexApi.log(`debug`, `The Mod list: `, modList);

  // We iterate through all the mod files we found earlier when we scanned the game’s mods directory
  const newLO = deployedModFiles.reduce((accum, file) => {
    // Check if the folder name is present inside the mods.json file for some entry
    const modFile = path.basename(file.filePath);
    const id = fileNameToId(modFile.toLowerCase());
    vortexApi.log(`debug`, `the LO id to use: `, id);
    const redmodEntry = modList.find((mod: REDmodEntry) => {
      const redmodID = nameToId(mod.folder.toLowerCase());
      vortexApi.log(`debug`, `Current redmod to id: `, redmodID);
      return redmodID === id;
    });
    vortexApi.log(`debug`, `A REDmod entry in the LO: `, redmodEntry);
    const isInModList = redmodEntry !== undefined && redmodEntry.enabled;

    // Check to see if the file has been deployed by Vortex and retrieve its modId so we can add it to our load order entry (if we manage to find it)
    const modId = Object.keys(deploymentMap)
      .find((localId) => deploymentMap[localId].files?.includes(path.basename(file.filePath)));

    // Assign the load order entry’s display name - we can use the modName as displayed inside Vortex’s mods page if the game has been deployed through Vortex
    const modName = (modId !== undefined)
      ? managedMods?.[modId]?.attributes?.modName
      : modFile; // Maybe???

    const modIndex = modList.findIndex((mod: REDmodEntry) => nameToId(mod.folder.toLowerCase()) === id);

    // We should now have all the data we need - start populating the array.
    if (isInModList) {
      // The mod is installed and enabled.
      accum.push({
        id,
        enabled: true,
        name: modName,
        modId,
        data: {
          index: modIndex,
          entry: redmodEntry,
        },
      });
    } else {
      // The mod is installed but has been disabled.
      accum.push({
        id,
        enabled: false,
        name: modName,
        modId,
        data: {
          index: modIndex,
          entry: redmodEntry,
        },
      });
    }
    return accum;
  }, []);

  // Send the deserialized load order to the load order page - Vortex will validate the array using the validation function
  // provided by the extension developer and apply it if valid, otherwise it will inform the user that validation failed
  newLO.sort((a, b) => {
    const aId = a.data.index;
    const bId = b.data.index;
    return modList.indexOf(aId) - modList.indexOf(bId);
  });

  vortexApi.log(`info`, `meowless`);
  return Promise.resolve(newLO);
};

// Internal Deserializer so that we can have access to more good good information
export const internalSerializeLoadOrder: VortexWrappedSerializeFunc = (
  vortexApi: VortexApi,
  loadOrder: VortexLoadOrder,
) => {
  vortexApi.log(`info`, `meow`);
  const discoveryPath = getDiscoveryPath(vortexApi);
  if (discoveryPath === undefined) {
    return Promise.reject(new vortexUtil.NotFound(`Game Not Found.`));
  }

  const modListPath = path.join(discoveryPath, 'r6', 'cache', 'modded', 'mods.json');
  vortexApi.log(`debug`, `LO to write: `, loadOrder);
  const mods: REDmodEntry[] = loadOrder.map((mod) => {
    vortexApi.log(`debug`, `adding mod to write: `, mod);
    const theRedEntry = mod.data.entry;
    theRedEntry.enabled = mod.enabled;
    return theRedEntry;
  });
  vortexApi.log(`debug`, `JSONifiable mods: `, mods);
  const meowjson = JSON.stringify({ mods }, undefined, ' ');
  vortexApi.log(`debug`, `stringy JSON being written: `, meowjson);
  return fs.writeFileAsync(modListPath, meowjson, { encoding: 'utf8' });
};

export const internalLoadOrderer: LoadOrderer = {
  validate: internalValidate,
  deserializeLoadOrder: internalDeserializeLoadOrder,
  serializeLoadOrder: internalSerializeLoadOrder,
};

//
// (wrap) `validate`
//
//  Before hitting actual validation, pass in some extra data like `VortexApi`.
//
//  @type `VortexValidateFunc`
//
export const wrapValidate = (
  vortex: VortexExtensionContext,
  vortexApiThing,
  loadOrderer: LoadOrderer,
): VortexValidateFunc => (prev: VortexLoadOrder, current: VortexLoadOrder) => {
  //
  // const vortexLog: VortexLogFunc = vortexApiThing.log;
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  // Unlike in `install`, Vortex doesn't supply us the mod's disk path
  return loadOrderer.validate(
    vortexApi,
    prev,
    current,
  );
};

//
//  (wrap) `deserialize`
//
//  Before hitting actual deserializer, pass in some extra data like `VortexApi`,
//  and loses some unnecessary stuff.
//
//  @type `VortexDeserializeFunc`
//
export const wrapDeserialize = (
  vortex: VortexExtensionContext,
  vortexApiThing,
  loadOrderer: LoadOrderer,
): VortexDeserializeFunc => async (): Promise<VortexLoadOrder> => {
  // const vortexLog: VortexLogFunc = vortexApiThing.log;
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  return loadOrderer.deserializeLoadOrder(vortexApi);
};

//
//  (wrap) `serialize`
//
//  Before hitting actual pass in some extra data like `VortexApi`,
//  and loses some unnecessary stuff.
//
//  @type `VortexSerializeFunc`
//
export const wrapSerialize = (
  vortex: VortexExtensionContext,
  vortexApiThing,
  loadOrderer: LoadOrderer,
): VortexSerializeFunc => async (loadOrder: VortexLoadOrder): Promise<void> => {
  // const vortexLog: VortexLogFunc = vortexApiThing.log;
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  return loadOrderer.serializeLoadOrder(vortexApi, loadOrder);
};

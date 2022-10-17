/* eslint-disable @typescript-eslint/quotes */
import { win32 } from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import Promise from 'bluebird';
import {
  fs,
  selectors,
} from "vortex-api";
// eslint-disable-next-line import/no-extraneous-dependencies
import * as turbowalk from 'turbowalk';
import { pipe } from "fp-ts/lib/function";
import {
  filter,
  map,
  partitionMap,
  toArray as toMutableArray,
} from "fp-ts/lib/ReadonlyArray";
import {
  TaskEither,
  chainEitherK,
} from "fp-ts/lib/TaskEither";
import {
  left,
  right,
} from "fp-ts/lib/Either";
import {
  mapLeft as mapLeftS,
  right as rightS,
} from "fp-ts/lib/Separated";
import {
  EXTENSION_NAME_INTERNAL,
  GAME_ID,
} from "./index.metadata";
import {
  LoadOrderer,
  LoadOrderEntryREDmod,
  LoadOrderEntry,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
  encodeLoadOrder,
  decodeLoadOrder,
} from "./load_order.types";
import {
  VortexApi,
  VortexDeserializeFunc,
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexLoadOrder,
  VortexLoadOrderEntry,
  VortexMod,
  VortexSerializeFunc,
  vortexUtil,
  VortexValidateFunc,
  VortexValidationResult,
  VortexWrappedDeserializeFunc,
  VortexWrappedSerializeFunc,
  VortexWrappedValidateFunc,
} from "./vortex-wrapper";
import { REDMOD_INFO_FILENAME } from "./installers.layouts";
import { jsonp } from "./installers.utils";
import { fileFromDiskTE } from "./installers.shared";
import {
  ModAttributeName,
  ModType,
} from "./installers.types";

// Ensure we're using win32 conventions
const path = win32;


// Defs

const LOAD_ORDER_FILE_NAME =
  `${EXTENSION_NAME_INTERNAL}-redmod-load-order.json`;

const LOAD_ORDER_FILE_RELATIVE_PATH =
  path.join(`r6\\cache\\modded\\${LOAD_ORDER_FILE_NAME}`);


const me =
  `${EXTENSION_NAME_INTERNAL} Load Order`;


//
// Vortex Load Order API Functions
//

const readDeploymentManifest = async (vortexApi: VortexApi) =>
  vortexUtil.getManifest(vortexApi, '', GAME_ID)
    .then((manifest) => Promise.reduce(manifest.files, (accum, iter) => {
      if (path.basename(iter.relPath) === REDMOD_INFO_FILENAME) {
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

/*
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
*/

const LOAD_ORDER_VALIDATION_PASSED_RESULT = undefined;

const validate: VortexWrappedValidateFunc = async (
  vortexApi: VortexApi,
  previousLoadOrder: VortexLoadOrder,
  currentLoadOrder: VortexLoadOrder,
): Promise<VortexValidationResult> => {
  vortexApi.log(`info`, `${me}: Validating load order:`, { previousLoadOrder, currentLoadOrder });
  vortexApi.log(`warn`, `${me}: LOAD ORDER VALIDATION AUTOSUCCEEDS FOR NOW`);

  Promise.resolve(LOAD_ORDER_VALIDATION_PASSED_RESULT);
};


const getDiscoveryPath = (
  api: VortexApi,
): string => {
  //
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
): Promise<{ mods: LoadOrderEntryREDmod[] }> => {
  const discoveryPath = getDiscoveryPath(vortexApi);
  const modListPath = path.join(discoveryPath, 'r6', 'cache', 'modded', 'mods.json');

  const listData = await fs.readFileAsync(modListPath, { encoding: `utf8` });
  const modList = JSON.parse(listData);
  return Promise.resolve(modList);
};

const deserializeLoadOrder = (
  gameDirPath: string,
): TaskEither<Error, LoadOrder> => {
  //
  const serializedLoadOrderFilePath =
    path.join(gameDirPath, LOAD_ORDER_FILE_RELATIVE_PATH);

  const decodedLoadOrder = pipe(
    fileFromDiskTE({ relativePath: LOAD_ORDER_FILE_RELATIVE_PATH, pathOnDisk: serializedLoadOrderFilePath }),
    chainEitherK(({ content }) => decodeLoadOrder(content)),
  );

  return decodedLoadOrder;
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

const compileDetesToGenerateLoadOrderUi: VortexWrappedDeserializeFunc = async (
  vortexApi: VortexApi,
): Promise<VortexLoadOrder> => {
  const gameDirPath = getDiscoveryPath(vortexApi);

  if (gameDirPath === undefined) {
    return Promise.reject(new vortexUtil.NotFound(`${me}: Game not found`));
  }

  const vortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  if (activeProfile?.gameId !== GAME_ID) {
    return Promise.reject(new Error(`${me}: Invalid profile or wrong game, canceling: ${jsonp(activeProfile)}`));
  }

  const currentStoredLoadOrder =
    await deserializeLoadOrder(gameDirPath);

  const modEnableState =
    activeProfile.modState;

  const orderableREDmodsFromState = pipe(
    vortexUtil.getSafe(vortexState, ['persistent', 'mods', GAME_ID], {}),
    Object.values,
    filter((mod: VortexMod) => mod.attributes?.[ModAttributeName.ModType] === ModType.REDmod),
    partitionMap((mod: VortexMod) =>
      (modEnableState[mod.id] === undefined
        ? left(mod)
        : right({ ...mod, ...modEnableState[mod.id] }))),
    mapLeftS((mods) => {
      vortexApi.log(`info`, `${me}: No enabled state for some REDmods, skipping them for load order: `, mods);
      return mods;
    }),
    rightS,
  );

  vortexApi.log(`info`, `${me}: Collected detes to create load order selection: `, { orderableREDmodsFromState, currentStoredLoadOrder });

  return Promise.resolve([]);
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
  const modList: LoadOrderEntryREDmod[] = listData.mods;
  vortexApi.log(`debug`, `The Mod list: `, modList);

  // We iterate through all the mod files we found earlier when we scanned the game’s mods directory
  const newLO = deployedModFiles.reduce((accum, file) => {
    // Check if the folder name is present inside the mods.json file for some entry
    const modFile = path.basename(file.filePath);

    const deployedModId = fileNameToId(modFile.toLowerCase());

    vortexApi.log(`debug`, `Trying to find scanned mod: ${deployedModId}`);

    const redmodEntry = modList.find((mod: LoadOrderEntryREDmod) => {
      const redmodID = nameToId(mod.folder.toLowerCase());
      vortexApi.log(`debug`, `Trying to match ${redmodID} (searching for ${deployedModId})`);
      return redmodID === deployedModId;
    });

    vortexApi.log(`debug`, `Found REDmod entry in the LO: `, redmodEntry);
    const isInModList = redmodEntry !== undefined && redmodEntry.enabled;

    // Check to see if the file has been deployed by Vortex and retrieve its modId so we can add it to our load order entry (if we manage to find it)
    const modId = Object.keys(deploymentMap)
      .find((localId) => deploymentMap[localId].files?.includes(path.basename(file.filePath)));

    // Assign the load order entry’s display name - we can use the modName as displayed inside Vortex’s mods page if the game has been deployed through Vortex
    const modName = (modId !== undefined)
      ? managedMods?.[modId]?.attributes?.modName
      : modFile; // Maybe???

    const modIndex =
      modList.findIndex((mod: LoadOrderEntryREDmod) => nameToId(mod.folder.toLowerCase()) === deployedModId);

    // We should now have all the data we need - start populating the array.
    if (isInModList) {
      // The mod is installed and enabled.
      accum.push({
        id: deployedModId,
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
        id: deployedModId,
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


const serializeLoadOrder: VortexWrappedSerializeFunc = (
  vortexApi: VortexApi,
  vortexLoadOrder: VortexLoadOrder,
): Promise<void> => {
  vortexApi.log(`debug`, `${me}: Serialize`);

  const discoveryPath = getDiscoveryPath(vortexApi);

  if (discoveryPath === undefined) {
    vortexApi.log(`error`, `${me}: Serialize: Game not found! (discoveryPath is undefined)`);
    return Promise.reject(new vortexUtil.NotFound(`Game Not Found.`));
  }

  vortexApi.log(`info`, `${me}: Serializing new load order from Vortex load order`, vortexLoadOrder);

  const loadOrderEntries = pipe(
    vortexLoadOrder,
    map((entry: VortexLoadOrderEntry): LoadOrderEntry => ({
      id: entry.id,
      modId: entry.modId,
      displayName: entry.name,
      enabledInVortex: entry.enabled,
      dirPath: entry.data?.dirPath || `unknown path`,
      version: entry.data?.version || `unknown version`,
    })),
    toMutableArray,
  );

  const loadOrder: LoadOrder = {
    typeVersion: LOAD_ORDER_TYPE_VERSION,
    generatedAt: new Date().toISOString(),
    entriesInOrderWithEarlierWinning: loadOrderEntries,
  };

  const serializedLoadOrder =
    encodeLoadOrder(loadOrder);

  const loadOrderFilePath =
    path.join(discoveryPath, LOAD_ORDER_FILE_RELATIVE_PATH);

  vortexApi.log(`info`, `${me}: Serializable load order generated: `, loadOrder);
  vortexApi.log(`info`, `${me}: Serializing load order to disk as JSON: ${loadOrderFilePath}`);

  const writeTaskToReturnToVortex =
    fs.writeFileAsync(loadOrderFilePath, serializedLoadOrder, { encoding: 'utf8' });

  return writeTaskToReturnToVortex;
};

export const internalLoadOrderer: LoadOrderer = {
  validate,
  serializeLoadOrder,
  deserializeLoadOrder: compileDetesToGenerateLoadOrderUi,
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

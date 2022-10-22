import { win32 } from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Promise } from "bluebird";
import { pipe } from "fp-ts/lib/function";
import {
  Option,
  none,
  some,
} from 'fp-ts/lib/Option';
import {
  filterMap,
  flatten,
  map,
  mapWithIndex,
  reduceWithIndex,
  sort,
  toArray as toMutableArray,
} from "fp-ts/lib/ReadonlyArray";
import {
  Task,
  map as mapT,
} from "fp-ts/lib/Task";
import {
  chainEitherK,
  match as matchTE,
} from "fp-ts/lib/TaskEither";
import {
  fs,
  selectors,
} from "vortex-api";
import {
  EXTENSION_NAME_INTERNAL,
  GAME_ID,
} from "./index.metadata";
import {
  LoadOrderer,
  LoadOrderEntry,
  LoadOrder,
  LOAD_ORDER_TYPE_VERSION,
  encodeLoadOrder,
  decodeLoadOrder,
  LoadOrderEntryDataForVortex,
  IdToIndex,
  IndexableOrderableMod,
  DEFAULT_INDEX_SO_NEW_MODS_SORTED_TO_TOP,
  byIndexAndNewAtTheTop,
} from "./load_order.types";
import {
  VortexApi,
  VortexDeserializeFunc,
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexLoadOrder,
  VortexLoadOrderEntry,
  VortexMod,
  VortexModWithEnabledStatus,
  VortexProfile,
  VortexProfileMod,
  VortexProfileModIndex,
  VortexSerializeFunc,
  VortexState,
  vortexUtil,
  VortexValidateFunc,
  VortexValidationResult,
  VortexWrappedDeserializeFunc,
  VortexWrappedSerializeFunc,
  VortexWrappedValidateFunc,
} from "./vortex-wrapper";
import {
  jsonp,
  S,
} from "./installers.utils";
import { fileFromDiskTE } from "./installers.shared";
import {
  attrModType,
  attrREDmodInfos,
  ModType,
  REDmodInfoForVortex,
} from "./installers.types";
import {
  REDMODDING_RTTI_METADATA_FILE_PATH,
  V2077_LOAD_ORDER_DIR,
} from "./redmodding.metadata";
import { REDmodDeploy } from "./redmodding";
import {
  InfoNotification,
  showInfoNotification,
} from "./ui.notifications";

// Ensure we're using win32 conventions
const path = win32;


// Defs

const me =
  `${EXTENSION_NAME_INTERNAL} Load Order`;

const loadOrderFilenameFor = (profile: VortexProfile): string =>
  `${EXTENSION_NAME_INTERNAL}-load-order-${profile.id}.json`;

// Should probably store this somewhere else, maybe in the
// user profile dir, as long as we show the path somewhere?
const loadOrderPathFor = (profile: VortexProfile, gameDirPath): string =>
  path.join(gameDirPath, V2077_LOAD_ORDER_DIR, loadOrderFilenameFor(profile));


//
// Data defaults etc.
//

const LOAD_ORDER_VALIDATION_PASSED_RESULT = undefined;

const DEFAULT_VERSION_FOR_UNVERSIONED_MODS = `0.0.1+V2077`;

const ENABLED_MOD_DISPLAY_MARKER = `✅`;
const DISABLED_MOD_DISPLAY_MARKER = `🚫`;

const enabledMarker = (mod: VortexModWithEnabledStatus): string =>
  (mod.enabled ? ENABLED_MOD_DISPLAY_MARKER : DISABLED_MOD_DISPLAY_MARKER);


//
// Helpers
//

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


//
//
// Load order functions
//
//


//
// Deserialize
//


const deserializeLoadOrder = (vortexApi: VortexApi) =>
  (loadOrderPathForCurrentProfile: string): Task<readonly LoadOrderEntry[]> => {

    const decodedLoadOrder = pipe(
      fileFromDiskTE({ relativePath: loadOrderPathForCurrentProfile, pathOnDisk: loadOrderPathForCurrentProfile }),
      chainEitherK(({ content }) => decodeLoadOrder(content)),
      matchTE(
        (error) => {
          vortexApi.log(`warn`, `${me}: Failed to deserialize load order, ignoring the file: ${error.message}`);
          return [] as LoadOrderEntry[];
        },
        (loadOrder) => {
          vortexApi.log(`debug`, `${me}: Current stored load order deserialized: ${S(loadOrder)}`);
          return loadOrder.entriesInOrderWithEarlierWinning;
        },
      ),
    );

    return decodedLoadOrder;
  };

const makeIndexForModIdToCurrentOrderLookup =
  (deserializedLoadOrder: Task<readonly LoadOrderEntry[]>): Task<IdToIndex> =>
    pipe(
      deserializedLoadOrder,
      mapT((entries): IdToIndex =>
        pipe(
          entries,
          reduceWithIndex(
            {},
            (index, mapped, entry) => {
              // eslint-disable-next-line no-param-reassign
              mapped[entry.vortexId] = index;
              return mapped;
            },
          ),
        )),
    );

const addStatusAndIndexOrDefaults =
  (mod: VortexMod, enabledStatusIndex: VortexProfileModIndex, currentOrderIndex: IdToIndex): IndexableOrderableMod => {
    const indexForMod =
      currentOrderIndex[mod.id] ?? DEFAULT_INDEX_SO_NEW_MODS_SORTED_TO_TOP;

    const enabledStatusForMod: VortexProfileMod =
      enabledStatusIndex[mod.id] ?? { enabled: false, enabledTime: 0 };

    return {
      ...mod,
      ...enabledStatusForMod,
      index: indexForMod,
    };
  };

const makeVortexLoadOrderEntryFrom =
  (
    orderableMod: IndexableOrderableMod,
    redmodInfo: REDmodInfoForVortex,
    subModIndex: number,
    activeProfile: VortexProfile,
  ): VortexLoadOrderEntry => {

    const everythinNeededToSerializeLoadOrder: LoadOrderEntryDataForVortex = {
      ownerVortexProfileId: activeProfile.id.toString(),
      vortexId: orderableMod.id.toString(),
      vortexModId: orderableMod.attributes?.modId?.toString(),
      vortexModVersion: orderableMod.attributes?.version ?? DEFAULT_VERSION_FOR_UNVERSIONED_MODS,
      vortexEnabled: orderableMod.enabled,
      redmodInfo,
    };

    const idSuffixIfNeededToDifferentiateSubmods =
      subModIndex > 0
        ? `-${EXTENSION_NAME_INTERNAL}-${subModIndex}`
        : ``;

    const id = `${orderableMod.id}${idSuffixIfNeededToDifferentiateSubmods}`;

    const modIdOrNothing =
      orderableMod.attributes?.modId
        ? `${orderableMod.attributes?.modId}${idSuffixIfNeededToDifferentiateSubmods}`
        : undefined;

    const { vortexModVersion } = everythinNeededToSerializeLoadOrder;

    const vortexVariant =
      orderableMod.attributes?.variant ? ` +${orderableMod.attributes?.variant}` : ``;

    const vortexDisplayName =
      `${vortexUtil.renderModName(orderableMod)} ${vortexModVersion}${vortexVariant}`;

    const displayNameWithAsMuchInfoAsWeDareBecauseWeHaveNoControlOverHTML =
      `${enabledMarker(orderableMod)} ${redmodInfo.name} ${redmodInfo.version} (from ${vortexDisplayName})`;

    const loadOrderEntry: VortexLoadOrderEntry = {
      id,
      modId: modIdOrNothing,
      enabled: orderableMod.enabled,
      name: displayNameWithAsMuchInfoAsWeDareBecauseWeHaveNoControlOverHTML,
      data: everythinNeededToSerializeLoadOrder,
    };

    return loadOrderEntry;
  };


//
// 'Deserialize' is what Vortex calls this
//
// What we're actually doing, though, is building up all entries for the
// FBLO UI so that the user can organize them as they see fit.
//
// Notably this is based on the current set of mods installed for this
// profile, not the previously generated load order or the files on disk.
//
// Previous load order is used to establish the earlier order, and
// any new ones are added to the end. This could also be done the other
// way around, but didn't.
//
// Unmanaged mods are currently NOT SUPPORTED, maybe TODO:
// https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/264
//


const compileDetesToGenerateLoadOrderUi: VortexWrappedDeserializeFunc = async (
  vortexApi: VortexApi,
): Promise<VortexLoadOrder> => {
  debugger;
  const gameDirPath = getDiscoveryPath(vortexApi);

  if (gameDirPath === undefined) {
    return Promise.reject(new vortexUtil.NotFound(`${me}: Game not found`));
  }

  const vortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  if (activeProfile?.gameId !== GAME_ID) {
    return Promise.reject(new Error(`${me}: Invalid profile or wrong game, canceling: ${jsonp(activeProfile)}`));
  }

  vortexApi.log(`info`, `${me}: Compiling detes for load order UI}`);

  const indexForCurrentOrderLookup =
    await pipe(
      loadOrderPathFor(activeProfile, gameDirPath),
      deserializeLoadOrder(vortexApi),
      makeIndexForModIdToCurrentOrderLookup,
    )();

  const indexForEnabledStatusForThisProfile =
    activeProfile.modState;

  const allModsKnownToVortex: VortexMod[] = pipe(
    vortexUtil.getSafe(vortexState, [`persistent`, `mods`, GAME_ID], {}),
    Object.values,
  );

  const allLoadOrderableMods = pipe(
    allModsKnownToVortex,
    filterMap((mod: VortexMod): Option<IndexableOrderableMod> => {

      if (mod.state === `installed` && attrModType(mod) === ModType.REDmod) {
        return some(
          addStatusAndIndexOrDefaults(
            mod,
            indexForEnabledStatusForThisProfile,
            indexForCurrentOrderLookup,
          ),
        );
      }
      return none;
    }),
  );

  const loadOrderableModsInOrder = pipe(
    allLoadOrderableMods,
    sort(byIndexAndNewAtTheTop),
  );

  const loadOrderOfIndividualREDmodsInVortexFormat = pipe(
    loadOrderableModsInOrder,
    map((orderableMod) => pipe(
      attrREDmodInfos(orderableMod),
      mapWithIndex((subModIndex, individualREDmod) =>
        makeVortexLoadOrderEntryFrom(orderableMod, individualREDmod, subModIndex, activeProfile)),
    )),
    flatten,
    toMutableArray,
  );

  vortexApi.log(`debug`, `${me}: Collected detes to create load order selection: `, S(loadOrderOfIndividualREDmodsInVortexFormat));

  return Promise.resolve(loadOrderOfIndividualREDmodsInVortexFormat);
};


//
// Serialize
//

const makeV2077LoadOrderEntryFrom = (vortexEntry: VortexLoadOrderEntry): LoadOrderEntry => {
  const modDetesWeNeedForLoadOrder: LoadOrderEntryDataForVortex = vortexEntry.data;

  const V2077LoadOrderEntry: LoadOrderEntry = {
    vortexId: modDetesWeNeedForLoadOrder.vortexId,
    vortexModId: modDetesWeNeedForLoadOrder.vortexModId,
    vortexModVersion: modDetesWeNeedForLoadOrder.vortexModVersion,
    redmodName: modDetesWeNeedForLoadOrder.redmodInfo.name,
    redmodVersion: modDetesWeNeedForLoadOrder.redmodInfo.version,
    redmodPath: modDetesWeNeedForLoadOrder.redmodInfo.relativePath,
    enabled: modDetesWeNeedForLoadOrder.vortexEnabled,
  };

  return V2077LoadOrderEntry;
};


const startREDmodDeployInTheBackgroundWithNotifications = (
  vortexApi: VortexApi,
  gameDirPath: string,
  v2077LoadOrderEntries: readonly LoadOrderEntry[],
): void => {
  const loadOrderForREDmodDeployWithShellQuotes = pipe(
    v2077LoadOrderEntries,
    filterMap((mod) =>
      (mod.enabled
        ? some(`"${path.basename(mod.redmodPath)}"`)
        : none)),
  );

  const redModDeployParametersToCreateNewManifest = [
    `deploy`,
    `-root="${gameDirPath}"`,
    `-rttiSchemaFile="${path.join(gameDirPath, REDMODDING_RTTI_METADATA_FILE_PATH)}"`,
    `-mod=`,
    ...loadOrderForREDmodDeployWithShellQuotes,
  ];

  const exePath =
      path.join(gameDirPath, REDmodDeploy.executable());

  const runOptions = {
    cwd: path.dirname(exePath),
    shell: true,
  };

  vortexApi.runExecutable(exePath, redModDeployParametersToCreateNewManifest, runOptions)
    .then(() => {
      vortexApi.log(`info`, `${me}: REDmod deployment complete!`);
      showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentSucceeded);
    })
    .catch((error) => {
      vortexApi.log(`error`, `${me}: REDmod deployment failed!`, S(error));
      showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentFailed);
    });

  showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentStarted);
  vortexApi.log(`info`, `${me}: Starting REDmod deployment!`);
  vortexApi.log(`debug`, `${me}: Deployment arguments and command line: `, S({
    loadOrderForREDmodDeployWithShellQuotes, exePath, redModDeployParametersToCreateNewManifest, runOptions,
  }));
};

//
// 'Serialize' is what Vortex calls this
//
// ...And that's what it is.
//
// The load order is stored per profile, and includes all
// the necessary detes to later on run `redmod deploy`.
//

const serializeLoadOrderToDisk: VortexWrappedSerializeFunc = (
  vortexApi: VortexApi,
  vortexLoadOrder: VortexLoadOrder,
): Promise<void> => {
  const gameDirPath = getDiscoveryPath(vortexApi);

  if (gameDirPath === undefined) {
    vortexApi.log(`error`, `${me}: Serialize: Game not found! (discoveryPath is undefined)`);
    return Promise.reject(new vortexUtil.NotFound(`Game Not Found.`));
  }

  debugger;
  if (vortexLoadOrder === undefined || vortexLoadOrder?.length === 0) {
    vortexApi.log(`info`, `${me}: Serialize: No mods in load order, skipping writing to disk..`);

    return Promise.resolve();
  }

  vortexApi.log(`info`, `${me}: Serializing new load order from Vortex load order`, vortexLoadOrder);

  // Is there any risk there could be a mismatch of profiles here? Surely not?
  const vortexState: VortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  const ownerVortexProfileId = activeProfile.id;

  const v2077LoadOrderEntries = pipe(
    vortexLoadOrder,
    map(makeV2077LoadOrderEntryFrom),
    toMutableArray,
  );

  const v2077LoadOrder: LoadOrder = {
    ownerVortexProfileId,
    loadOrderFormatVersion: LOAD_ORDER_TYPE_VERSION,
    generatedAt: new Date().toISOString(),
    entriesInOrderWithEarlierWinning: v2077LoadOrderEntries,
  };

  const serializedLoadOrder =
    encodeLoadOrder(v2077LoadOrder);

  const loadOrderFilePathForThisProfile =
    loadOrderPathFor(activeProfile, gameDirPath);

  vortexApi.log(`debug`, `${me}: New load order ready to be deployed and serialized! `, v2077LoadOrder);

  startREDmodDeployInTheBackgroundWithNotifications(vortexApi, gameDirPath, v2077LoadOrderEntries);

  // Finally, I guess
  vortexApi.log(`info`, `${me}: Saving load order to disk as JSON: ${loadOrderFilePathForThisProfile}`);
  return fs.writeFileAsync(loadOrderFilePathForThisProfile, serializedLoadOrder, { encoding: `utf8` });
};


//
// 'Validate' the load order
//
// That's nice I guess, but for now it's an autopass.
//

const validate: VortexWrappedValidateFunc = async (
  vortexApi: VortexApi,
  previousLoadOrder: VortexLoadOrder,
  currentLoadOrder: VortexLoadOrder,
): Promise<VortexValidationResult> => {
  vortexApi.log(`debug`, `${me}: Validating load order:`, { previousLoadOrder, currentLoadOrder });
  vortexApi.log(`debug`, `${me}: Load order validation autosucceeds for now, not sure what we want to validate`);

  return Promise.resolve(LOAD_ORDER_VALIDATION_PASSED_RESULT);
};


//
// Wrapped functions typed for what Vortex expects
//


export const internalLoadOrderer: LoadOrderer = {
  validate,
  serializeLoadOrder: serializeLoadOrderToDisk,
  deserializeLoadOrder: compileDetesToGenerateLoadOrderUi,
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
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  return loadOrderer.serializeLoadOrder(vortexApi, loadOrder);
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
  const vortexApi: VortexApi = { ...vortex.api, log: vortexApiThing.log };

  // Unlike in `install`, Vortex doesn't supply us the mod's disk path
  return loadOrderer.validate(
    vortexApi,
    prev,
    current,
  );
};

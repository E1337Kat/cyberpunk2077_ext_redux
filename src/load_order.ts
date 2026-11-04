import {
  win32,
} from "path";
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Promise,
} from "bluebird";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  Option,
  getOrElse as getOrElseO,
  none,
  some,
  fromNullable,
} from 'fp-ts/lib/Option';
import {
  filterMap,
  flatten,
  isEmpty,
  map,
  mapWithIndex,
  reduceWithIndex,
  sortBy,
  toArray as toMutableArray,
} from "fp-ts/lib/ReadonlyArray";
import {
  fromEither as fromEitherTE,
  map as mapTE,
  mapLeft as mapLeftTE,
  orElse as orElseTE,
  swap as swapTE,
  TaskEither,
  tryCatch as tryCatchTE,
} from "fp-ts/lib/TaskEither";
import {
  fs,
  selectors,
} from "@vortex-api-test-shimmed";
import {
  remove,
} from "spectacles-ts";
import {
  isLeft,
} from "fp-ts/lib/Either";
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
  IndexableMaybeEnabledMod,
  thenByDirnameAscending,
  byIndexWithNewAtTheBack,
  TypedVortexLoadOrderEntry,
  OrderableLoadOrderEntryForVortex,
  TypedOrderableVortexLoadOrderEntry,
  ModList,
} from "./load_order.types";
import {
  makeVortexApi,
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
  loadOrderFromVortexState,
} from "./load_order.functions";
import {
  bbcodeBasics,
  constant,
  getErrorCode,
  getErrorMessageOrDefault,
  heredoc,
  jsonp,
  S,
} from "./util.functions";
import {
  fileFromDiskTE,
} from "./installers.shared";
import {
  attrModType,
  attrREDmodInfos,
  ModType,
  REDmodInfoForVortex,
} from "./installers.types";
import {
  V2077_LOAD_ORDER_DIR,
  V2077_MODLIST_PATH,
} from "./redmodding.metadata";
import {
  redmodDeployedFilesNeedRebuilding,
  redmodFailureReason,
  removeDeployedREDmodFiles,
  runREDmodDeploy,
} from "./redmod.deploy";
import {
  ActivityNotification,
  InfoNotification,
  showInfoNotification,
  startActivityNotification,
  stopActivityNotification,
} from "./ui.notifications";
import {
  showInvalidLoadOrderFileErrorDialog,
} from "./ui.dialogs";

// Ensure we're using win32 conventions
const path = win32;


// Defs

const me =
  `${EXTENSION_NAME_INTERNAL} Load Order`;

export const WINDOWS_LINE_ENDING = `\r\n`;

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

export const getDiscoveryPath = (
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
// Help etc.
//

export const loadOrderUsageInstructionsForVortexGui =
  heredoc(bbcodeBasics(`
    Drag your mods in the order you want them to load here! They will be
    deployed whenever the next Vortex deployment is triggered.

    You don't have to order everything. It's best to only order mods that
    require it, or that you otherwise know to conflict with each other.

    Only REDmods are orderable, including archive mods you've converted into
    one. If you don't see something you just installed, click on Refresh.

    You can order both enabled and disabled mods, but only the enabled ones will
    be included in the REDmod deployment. The disabled ones will remember their
    place in the load order, though, so long as you don't uninstall them!

    Every archive mod that isn't a REDmod loads BEFORE all REDmods, in the usual
    alphabetical order, and the first mod to change a file is the one that wins.
    So an archive mod always beats a REDmod that touches the same file, whatever
    you do in this list. If you need it the other way round, or you just want an
    archive mod to sit in a particular spot here, convert it: right-click it in
    your mod list and pick Convert to REDmod.

    Converting rearranges the mod in your staging folder so that REDmod loads it,
    which is what puts it in this list. Revert to archive mod, in the same menu,
    puts it back exactly as it was. Converting needs the free REDmod DLC, and for
    now it only works on mods that contain nothing but archives.

    REDmods that you have installed outside Vortex are NOT supported right now.

    The load order is saved automatically, and deployed when you start the game
    through Vortex. The game waits until the deployment is done.

    REDmod deployment recompiles the game's scripts every time it runs, so the
    first launch after a change can take a few minutes. :)

    You can also click the REDdeploy tool button to deploy the current load order
    without starting the game.

    You can still use the command-line redMod.exe or WolvenKit to deploy or order
    REDmods, but any changes you make there will NOT be reflected in Vortex.
  `));


//
//
// Load order functions
//
//


//
// Deserialize
//


const deserializeLoadOrder = (vortexApi: VortexApi) =>
  (loadOrderPathForCurrentProfile: string): TaskEither<Error, readonly LoadOrderEntry[]> =>
    pipe(
      fileFromDiskTE({ relativePath: loadOrderPathForCurrentProfile, pathOnDisk: loadOrderPathForCurrentProfile }),
      swapTE,
      mapTE((error) => {
        vortexApi.log(`warn`, `${me}: Couldn't open load order file, proceeding with an empty list: ${error.message}`);
        return [] as LoadOrderEntry[];
      }),
      orElseTE(({ content }) =>
        pipe(
          decodeLoadOrder(content),
          fromEitherTE,
          mapLeftTE((error) =>
            new Error(`Couldn't decode load order file: ${error.message}`)),
          mapTE((loadOrder) => {
            vortexApi.log(`info`, `${me}: Successfully deserialized load order id: ${Date.parse(loadOrder.generatedAt)} (${loadOrder.generatedAt})`);
            vortexApi.log(`debug`, `${me}: Current stored load order deserialized: ${S(loadOrder)}`);
            return loadOrder.entriesInOrderWithEarlierWinning;
          }),
        )),
    );


const makeIndexForModIdToCurrentOrderLookup =
  (deserializedLoadOrder: readonly LoadOrderEntry[]): IdToIndex =>
    pipe(
      deserializedLoadOrder,
      reduceWithIndex(
        {},
        (index, mapped, entry) => {
          // eslint-disable-next-line no-param-reassign
          mapped[entry.vortexId] = index;
          return mapped;
        },
      ),
    );

const addStatusAndIndexOrDefaults =
  (
    mod: VortexMod,
    enabledStatusIndex: VortexProfileModIndex,
    currentOrderIndex: IdToIndex,
  ): IndexableMaybeEnabledMod => {
    const indexForMod =
      fromNullable(currentOrderIndex[mod.id]);

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
    orderableMod: IndexableMaybeEnabledMod,
    redmodInfo: REDmodInfoForVortex,
    subModIndex: number,
    activeProfile: VortexProfile,
  ): VortexLoadOrderEntry => {

    const everythingNeededToSerializeLoadOrder: OrderableLoadOrderEntryForVortex = {
      indexForSorting: orderableMod.index,
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

    const { vortexModVersion } = everythingNeededToSerializeLoadOrder;

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
      data: everythingNeededToSerializeLoadOrder,
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
  const gameDirPath = getDiscoveryPath(vortexApi);

  if (gameDirPath === undefined) {
    return Promise.reject(new vortexUtil.NotFound(`${me}: Game not found`));
  }

  const vortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  if (activeProfile?.gameId !== GAME_ID) {
    return Promise.reject(new Error(`${me}: Invalid profile or wrong game, canceling: ${jsonp(activeProfile)}`));
  }

  vortexApi.log(`info`, `${me}: Compiling detes for load order UI`);

  const deserializedLoadOrder = await pipe(
    loadOrderPathFor(activeProfile, gameDirPath),
    deserializeLoadOrder(vortexApi),
  )();

  // The rest of this function could and should be refactored into a pipeline
  // to get rid of this early return

  if (isLeft(deserializedLoadOrder)) {
    vortexApi.log(`error`, `${me}: Error deserializing load order: ${deserializedLoadOrder.left.message}`);
    showInvalidLoadOrderFileErrorDialog(vortexApi, loadOrderPathFor(activeProfile, gameDirPath));

    return Promise.reject(deserializedLoadOrder.left);
  }

  const indexForCurrentOrderLookup =
    makeIndexForModIdToCurrentOrderLookup(deserializedLoadOrder.right);

  const indexForEnabledStatusForThisProfile =
    activeProfile.modState;

  const allModsKnownToVortex: VortexMod[] = pipe(
    vortexUtil.getSafe(vortexState, [`persistent`, `mods`, GAME_ID], {}),
    Object.values,
  );

  const allLoadOrderableVortexMods = pipe(
    allModsKnownToVortex,
    filterMap((mod: VortexMod): Option<IndexableMaybeEnabledMod> => {

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

  const allIndividualREDmodsInVortexLoadOrderFormat = pipe(
    allLoadOrderableVortexMods,
    map((orderableVortexMod) => pipe(
      attrREDmodInfos(orderableVortexMod),
      mapWithIndex((subModIndex, containedREDmod) =>
        makeVortexLoadOrderEntryFrom(orderableVortexMod, containedREDmod, subModIndex, activeProfile)),
    )),
    flatten,
  );

  const afterLastKnown =
      allIndividualREDmodsInVortexLoadOrderFormat.length;

  const loadOrderableModsInOrder = pipe(
    allIndividualREDmodsInVortexLoadOrderFormat,
    sortBy([byIndexWithNewAtTheBack(afterLastKnown), thenByDirnameAscending]),
  );

  const loadOrderableModsInOrderWithoutAnyVariableDataThatWouldConfuseVortex =
    pipe(
      loadOrderableModsInOrder,
      map((entry: TypedOrderableVortexLoadOrderEntry): TypedVortexLoadOrderEntry =>
        pipe(entry, remove(`data.indexForSorting`))),
      toMutableArray,
    );

  vortexApi.log(`debug`, `${me}: Collected detes to create load order selection: `, S(loadOrderableModsInOrderWithoutAnyVariableDataThatWouldConfuseVortex));

  return Promise.resolve(loadOrderableModsInOrderWithoutAnyVariableDataThatWouldConfuseVortex);
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

export const makeV2077LoadOrderFrom = (
  vortexLoadOrder: VortexLoadOrder,
  ownerVortexProfileId: string,
  dateAsLoadOrderId: number,
): LoadOrder => {
  const v2077LoadOrderEntries = pipe(
    vortexLoadOrder,
    map(makeV2077LoadOrderEntryFrom),
    toMutableArray,
  );

  return {
    loadOrderFormatVersion: LOAD_ORDER_TYPE_VERSION,
    ownerVortexProfileId,
    generatedAt: new Date(dateAsLoadOrderId).toISOString(),
    entriesInOrderWithEarlierWinning: v2077LoadOrderEntries,
  };
};


export const loadOrderToREDdeployModList = (
  v2077LoadOrderToDeploy: LoadOrder,
): ModList => pipe(
  v2077LoadOrderToDeploy.entriesInOrderWithEarlierWinning,
  filterMap((mod) =>
    (mod.enabled
      ? some(`${path.basename(mod.redmodPath)}`)
      : none)),
);


const writeFileAtomically = (
  loID: number,
  filePath: string,
  contents: string,
): TaskEither<Error, void> =>
  pipe(
    tryCatchTE(
      () =>
        fs.statAsync(path.dirname(filePath)).then(() =>
          fs.writeFileAsync(`${filePath}.${loID}.tmp`, contents, { encoding: `utf8` })).then(() =>
          fs.renameAsync(`${filePath}.${loID}.tmp`, filePath)),
      (error) => {
        const errorCode = getErrorCode(error);
        return new Error(`Couldn't write ${path.basename(filePath)}${errorCode === null ? `` : ` (${errorCode})`}`);
      },
    ),
  );

// Undefined when the modlist is there but unreadable, so the deployed order is unknown.
const modListOnDisk = async (modListPath: string): Promise<readonly string[] | undefined> => {
  try {
    const contents: string = await fs.readFileAsync(modListPath, { encoding: `utf8` });
    return contents.split(/\r?\n/).filter((entry) => entry.length > 0);
  } catch (error) {
    return getErrorCode(error) === `ENOENT` ? [] : undefined;
  }
};

const deployREDmodLoadOrder = async (
  vortexApi: VortexApi,
  gameDirPath: string,
): Promise<void> => {
  const vortexState: VortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  if (activeProfile?.gameId !== GAME_ID) {
    vortexApi.log(`warn`, `${me}: ${GAME_ID} isn't the active game, not deploying`);
    return;
  }

  const vortexLoadOrder: VortexLoadOrder = pipe(
    loadOrderFromVortexState(vortexState, activeProfile),
    getOrElseO(constant([] as VortexLoadOrder)),
  );

  const loID = Date.now();

  const v2077LoadOrderToDeploy =
    makeV2077LoadOrderFrom(vortexLoadOrder, activeProfile.id, loID);

  if (isEmpty(v2077LoadOrderToDeploy.entriesInOrderWithEarlierWinning)) {
    vortexApi.log(`warn`, `${me}: No mods in load order, running default REDdeploy!`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentDefaulted);
  }

  vortexApi.log(`info`, `${me}: Starting REDmod deployment ${loID}!`);
  startActivityNotification(vortexApi, ActivityNotification.REDmodDeploying);

  try {
    const modListPath = path.join(gameDirPath, V2077_MODLIST_PATH);
    const nextModList = loadOrderToREDdeployModList(v2077LoadOrderToDeploy);

    const previousModList = await modListOnDisk(modListPath);

    // redMod only reads the modlist with Windows line endings.
    const wroteModList =
      await writeFileAtomically(loID, modListPath, nextModList.join(WINDOWS_LINE_ENDING))();

    if (isLeft(wroteModList)) {
      throw wroteModList.left;
    }

    if (previousModList === undefined
        || redmodDeployedFilesNeedRebuilding(previousModList, nextModList)) {
      await removeDeployedREDmodFiles(vortexApi, gameDirPath);
    }

    const { exitCode, output } = await runREDmodDeploy(vortexApi, gameDirPath);

    if (output.length > 0) {
      vortexApi.log(exitCode === 0 ? `debug` : `warn`, `${me}: redMod said: ${output}`);
    }

    if (exitCode !== 0) {
      throw new Error(redmodFailureReason({ exitCode, output }));
    }

    vortexApi.log(`info`, `${me}: REDmod deployment ${loID} complete!`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentSucceeded);
  } catch (error) {
    const reason = getErrorMessageOrDefault(error);

    vortexApi.log(`error`, `${me}: REDmod deployment ${loID} failed: ${reason}`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentFailed, reason);
    throw error;
  } finally {
    stopActivityNotification(vortexApi, ActivityNotification.REDmodDeploying);
  }
};

const deployQueue = vortexUtil.makeQueue<void>();

// Deploys run one at a time, each against the load order current when it starts:
// they share the modlist and the deployed files.
export const deployREDmodForCurrentLoadOrder = (
  vortexApi: VortexApi,
  gameDirPath: string,
): Promise<void> =>
  deployQueue(() => deployREDmodLoadOrder(vortexApi, gameDirPath), false);


//
// 'Serialize' is what Vortex calls this
//
// The load order is stored per profile, and includes all the detes to also
// run REDmod deploy. The actual JSON load order that we create for ourselves
// is just used to store the order and enabled/disabled state, really. (But we
// do need it for that.)
//
// The tricky part is that we need to protect against some Vortex edge cases
// while keeping it convenient for the user.
//
// 1. Enabling a mod will trigger LO twice (profile change + deployment.) We have
//    to wait until the deployment is done before we can run REDmod deploy, but
//    we also don't want to try to run the deployment twice.
//
// 2. Not updating the LO-able mods until a deployment prevents LO changes with
//    disabled mods which isn't what we want.
//
// Vortex does check whether the previously generated LO is the same one as
// the one we return from compile (above) by matching the content. That means
// that we *shouldn't* get this function being invoked twice for 'the same' LO.
//
const serializeNewLoadOrder: VortexWrappedSerializeFunc = (
  vortexApi: VortexApi,
  vortexLoadOrder: VortexLoadOrder,
): Promise<void> => {
  const gameDirPath = getDiscoveryPath(vortexApi);

  if (gameDirPath === undefined) {
    vortexApi.log(`error`, `${me}: Serialize: Game not found! (discoveryPath is undefined)`);
    return Promise.reject(new vortexUtil.NotFound(`Game Not Found.`));
  }

  if (vortexLoadOrder === undefined || vortexLoadOrder?.length === 0) {
    vortexApi.log(`info`, `${me}: Serialize: No mods in load order, skipping writing to disk..`);
    return Promise.resolve();
  }

  vortexApi.log(`info`, `${me}: Serializing new load order from Vortex load order`, S(vortexLoadOrder));

  // Is there any risk there could be a mismatch of profiles here? Surely not?
  const vortexState: VortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  const ownerVortexProfileId = activeProfile.id;
  const loID = Date.now();

  const v2077LoadOrder = makeV2077LoadOrderFrom(vortexLoadOrder, ownerVortexProfileId, loID);

  vortexApi.log(`info`, `${me}: New load order ${loID} ready to be serialized!`);
  vortexApi.log(`debug`, `${me}: Load order ${loID}:`, S(v2077LoadOrder));

  const serializedLoadOrder =
    encodeLoadOrder(v2077LoadOrder);

  const loadOrderFilePathForThisProfile =
    loadOrderPathFor(activeProfile, gameDirPath);

  vortexApi.log(`info`, `${me}: Saving load order ${loID} to disk as JSON: ${loadOrderFilePathForThisProfile}`);

  const maybeSuccessfullyWroteLoadOrderToDisk =
    pipe(
      writeFileAtomically(loID, loadOrderFilePathForThisProfile, serializedLoadOrder),
      mapLeftTE((error) => {
        vortexApi.log(`error`, `${me}: Unable to write load order to disk: ${error.message}`);
        showInfoNotification(vortexApi, InfoNotification.LoadOrderWriteFailed);
        return error;
      }),
    );

  return maybeSuccessfullyWroteLoadOrderToDisk();
};


//
// 'Validate' the load order
//
// That's nice I guess, but for now it's an autopass.
//

const validate: VortexWrappedValidateFunc = async (
  vortexApi: VortexApi,
  _previousLoadOrder: VortexLoadOrder,
  _currentLoadOrder: VortexLoadOrder,
): Promise<VortexValidationResult> => {
  vortexApi.log(`debug`, `${me}: Load order validation autosucceeds for now, we've already done all validation`);
  return Promise.resolve(LOAD_ORDER_VALIDATION_PASSED_RESULT);
};


//
// Wrapped functions typed for what Vortex expects
//


export const internalLoadOrderer: LoadOrderer = {
  validate,
  serializeLoadOrder: serializeNewLoadOrder,
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
  const vortexApi = makeVortexApi(vortex, vortexApiThing);

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
  const vortexApi = makeVortexApi(vortex, vortexApiThing);

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
  const vortexApi = makeVortexApi(vortex, vortexApiThing);

  // Unlike in `install`, Vortex doesn't supply us the mod's disk path
  return loadOrderer.validate(
    vortexApi,
    prev,
    current,
  );
};

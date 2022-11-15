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
} from "@vortex-api-test-shimmed";
import {
  remove,
} from "spectacles-ts";
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
  VortexRunOptions,
  VortexRunParameters,
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
  bbcodeBasics,
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
  REDdeployExeRelativePath,
  REDMODDING_RTTI_METADATA_FILE_PATH,
  V2077_LOAD_ORDER_DIR,
} from "./redmodding.metadata";
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
// Help etc.
//

export const loadOrderUsageInstructionsForVortexGui = heredoc(bbcodeBasics(`
        You don't have to order everything. It's best to only order mods that
        require it, or that you otherwise know to conflict with each other.

        Only REDmods and autoconverted heritage mods are orderable. If you don't see
        something you just installed, click on Refresh.

        You can order both enabled and disabled mods, but only the enabled ones will
        be included in the REDmod deployment. The disabled ones will remember their
        place in the load order, though, so long as you don't uninstall them!

        All heritage archive mods that are not autoconverted to REDmod will be loaded
        BEFORE all REDmods, in the usual alphabetical order. That means that if you want
        to override an archive mod, you need to convert it to REDmod first. You can do
        this by making sure the autoconvert setting is on and then reinstalling the mod.

        REDmods that you have installed outside Vortex are NOT supported right now.

        The load order is saved automatically, and will be deployed whenever the next
        Vortex deployment occurs - you can also manually click to deploy, if you like!

        REDmod deployment can take a little while if you have tweak or script mods,
        so wait for the green success notification before you start the game! :)

        You can still use the command-line redMod.exe or the REDdeploy Tool in your
        Tools dashlet, but changes won't be reflected in the load order panel.
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


export const loadOrderToREDdeployRunParameters = (
  gameDirPath: string,
  v2077LoadOrderToDeploy: LoadOrder,
): VortexRunParameters => {
  const v2077LoadOrderEntries =
    v2077LoadOrderToDeploy.entriesInOrderWithEarlierWinning;

  const loadOrderForREDmodDeployWithShellQuotes = pipe(
    v2077LoadOrderEntries,
    filterMap((mod) =>
      (mod.enabled
        ? some(`"${path.basename(mod.redmodPath)}"`)
        : none)),
  );

  const loadOrderedModListToDeploy =
    isEmpty(loadOrderForREDmodDeployWithShellQuotes)
      ? []
      : [
        `-mod=`,
        ...loadOrderForREDmodDeployWithShellQuotes,
      ];

  const redModDeployParametersToCreateNewManifest = [
    `deploy`,
    `-root=`,
    `"${gameDirPath}"`,
    `-rttiSchemaFile=`,
    `"${path.join(gameDirPath, REDMODDING_RTTI_METADATA_FILE_PATH)}"`,
    ...loadOrderedModListToDeploy,
  ];

  const exePath =
    path.join(gameDirPath, REDdeployExeRelativePath);

  const runOptions: VortexRunOptions = {
    cwd: path.dirname(exePath),
    shell: true,
    detach: true,
    expectSuccess: true,
  };

  return {
    executable: exePath,
    args: redModDeployParametersToCreateNewManifest,
    options: runOptions,
  };
};


const startREDmodDeployInTheBackgroundWithNotifications = (
  vortexApi: VortexApi,
  gameDirPath: string,
  loID: number,
  v2077LoadOrderToDeploy: LoadOrder,
  vortexFormatLoadOrderForComparison: VortexLoadOrder,
): void => {
  const tag = `${me}: REDmod Delayed Deploy`;

  vortexApi.log(`info`, `${tag}: Starting delayed deploy for load order ${loID}`);

  const vortexState: VortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  const ownerProfileId = v2077LoadOrderToDeploy.ownerVortexProfileId;

  if (activeProfile.id !== ownerProfileId) {
    vortexApi.log(`warn`, `${tag}: Profile is not the same that generated load order ${loID}, stopping!`, { activeProfile, ownerProfileId });
    return;
  }

  const newestGeneratedLoadOrder: readonly VortexLoadOrderEntry[] =
    vortexUtil.getSafe(vortexState, [`persistent`, `loadOrder`, ownerProfileId], undefined);

  if (!newestGeneratedLoadOrder) {
    vortexApi.log(`error`, `${tag}: Unable to find the current load order, canceling! It should be *this* one (${loID}) if nothing else.`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentFailed);
    return;
  }

  // Are we still the current load order? Maybe not!
  //
  // Maybe there's a better way to do this check.. but this is what Vortex itself
  // uses, so we can't give an actually unique ID to the vortex load order because
  // then it won't match the previous run..
  if (JSON.stringify(vortexFormatLoadOrderForComparison) !== JSON.stringify(newestGeneratedLoadOrder)) {
    vortexApi.log(`info`, `${tag}: Load order ${loID} no longer most recent, this is ok, canceling!`);
    // No need to notify, it's fine if this has been superceded
    return;
  }

  const redDeploy =
    loadOrderToREDdeployRunParameters(gameDirPath, v2077LoadOrderToDeploy);

  vortexApi.runExecutable(redDeploy.executable, redDeploy.args, redDeploy.options)
    .then(() => {
      vortexApi.log(`info`, `${me}: REDmod deployment ${loID} complete!`);
      showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentSucceeded);
    })
    .catch((error) => {
      vortexApi.log(`error`, `${me}: REDmod deployment ${loID} failed!`, S(error));
      showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentFailed);
    });

  showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentStarted);
  vortexApi.log(`info`, `${me}: Starting REDmod deployment ${loID}!`);
  vortexApi.log(`debug`, `${me}: Deployment arguments and command line: `, S(redDeploy));
};


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
const deployAndSerializeNewLoadOrder: VortexWrappedSerializeFunc = (
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

  vortexApi.log(`info`, `${me}: New load order ${loID} ready to be deployed and serialized!`, S(v2077LoadOrder));

  // We want to wait until there's been a deployment - either the automatic one
  // from an enable or something like that, or a manually triggered one.
  vortexApi.events.once(`did-deploy`, () => {
    startREDmodDeployInTheBackgroundWithNotifications(vortexApi, gameDirPath, loID, v2077LoadOrder, vortexLoadOrder);
  });

  vortexApi.log(`info`, `${me}: Queuing REDmod deployment for load order ${loID} to run after next Vortex deployment!`);
  showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentQueued);

  const serializedLoadOrder =
    encodeLoadOrder(v2077LoadOrder);

  const loadOrderFilePathForThisProfile =
    loadOrderPathFor(activeProfile, gameDirPath);

  vortexApi.log(`info`, `${me}: Saving load order ${loID} to disk as JSON: ${loadOrderFilePathForThisProfile}`);
  return fs.writeFileAsync(loadOrderFilePathForThisProfile, serializedLoadOrder, { encoding: `utf8` });
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
  serializeLoadOrder: deployAndSerializeNewLoadOrder,
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

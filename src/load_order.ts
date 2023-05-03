import {
  win32,
} from "path";
import {
  execFile,
  PromiseWithChild,
} from "child_process";
import {
  promisify,
} from "util";
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
  some as any,
  mapWithIndex,
  reduce,
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
  getOrElse as getOrElseTE,
  chain as chainTE,
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
  map as mapRight,
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
  LoadOrderEntryDataForVortex,
  IdToIndex,
  IndexableMaybeEnabledMod,
  thenByDirnameAscending,
  byIndexWithNewAtTheBack,
  TypedVortexLoadOrderEntry,
  OrderableLoadOrderEntryForVortex,
  TypedOrderableVortexLoadOrderEntry,
  ModsDotJsonEntry,
  decodeModsDotJsonLoadOrder,
  encodeModsDotJsonLoadOrder,
  ModsDotJson,
  decodeAndMigrateLoadOrder,
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
  ret,
  S,
  task,
} from "./util.functions";
import {
  dirFromDiskTE,
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
  REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES,
  REDMODDING_RTTI_METADATA_FILE_PATH,
  V2077_LOAD_ORDER_DIR,
} from "./redmodding.metadata";
import {
  InfoNotification,
  showInfoNotification,
} from "./ui.notifications";
import {
  showInvalidLoadOrderFileErrorDialog,
} from "./ui.dialogs";
import {
  REDMOD_CUSTOMSOUNDS_DIRNAME,
  REDMOD_SCRIPTS_DIRNAME,
  REDMOD_TWEAKS_DIRNAME,
} from "./installers.layouts";
import {
  pathIn,
} from "./filetree";

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

// Should probably store this somewhere else, maybe in the
// user profile dir, as long as we show the path somewhere?
const modsDotJsonPathFor = (gameDirPath): string =>
  path.join(gameDirPath, REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES, `mods.json`);


//
// Data defaults etc.
//

const LOAD_ORDER_VALIDATION_PASSED_RESULT = undefined;

const DEFAULT_VERSION_FOR_UNVERSIONED_MODS = `0.0.1+V2077`;

const ENABLED_MOD_DISPLAY_MARKER = `✅`;
const DISABLED_MOD_DISPLAY_MARKER = `🚫`;

const enabledMarker = (mod: VortexModWithEnabledStatus): string =>
  (mod.enabled ? ENABLED_MOD_DISPLAY_MARKER : DISABLED_MOD_DISPLAY_MARKER);


const REDMOD_COMPILABLE_DIRNAMES = [
  REDMOD_CUSTOMSOUNDS_DIRNAME,
  REDMOD_SCRIPTS_DIRNAME,
  REDMOD_TWEAKS_DIRNAME,
];

//
// Helpers
//

const getDiscoveryPath = (
  api: VortexApi | { store: { getState: () => unknown } },
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

    You can also click the REDdeploy tool button to run a deployment on-demand. It'll
    (re)deploy the most recently created load order.

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
          decodeAndMigrateLoadOrder(content),
          mapRight((loadOrder) => {
            vortexApi.log(`info`, `${me}: Successfully deserialized load order id: ${Date.parse(loadOrder.generatedAt)} (${loadOrder.generatedAt})`);
            return loadOrder.entriesInOrderWithEarlierWinning;
          }),
          fromEitherTE,
        )),
    );

const deserializeModsDotJson = (vortexApi: VortexApi) =>
  (loadOrderPathForCurrentProfile: string): TaskEither<Error, readonly ModsDotJsonEntry[]> =>
    pipe(
      fileFromDiskTE({ relativePath: loadOrderPathForCurrentProfile, pathOnDisk: loadOrderPathForCurrentProfile }),
      swapTE,
      mapTE((error) => {
        vortexApi.log(`warn`, `${me}: Couldn't open mods.json file, proceeding with an empty list: ${error.message}`);
        return [] as ModsDotJsonEntry[];
      }),
      orElseTE(({ content }) =>
        pipe(
          decodeModsDotJsonLoadOrder(content),
          fromEitherTE,
          mapLeftTE((error) =>
            new Error(`Couldn't decode mods.json file: ${error.message}`)),
          mapTE((loadOrder) => {
            vortexApi.log(`info`, `${me}: Successfully deserialized mods.json file`);
            return loadOrder.mods;
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

  vortexApi.log(`debug`, `${me}: Collected detes to create load order selection`);

  return Promise.resolve(loadOrderableModsInOrderWithoutAnyVariableDataThatWouldConfuseVortex);
};


//
// Serialize
//

const makeModsDotJsonLoadOrderEntryFrom = (vortexEntry: VortexLoadOrderEntry): ModsDotJsonEntry => {
  const modDetesWeNeedForLoadOrder: LoadOrderEntryDataForVortex = vortexEntry.data;

  const V2077LoadOrderEntry: ModsDotJsonEntry = {
    folder: path.basename(modDetesWeNeedForLoadOrder.redmodInfo.relativePath),
    enabled: modDetesWeNeedForLoadOrder.vortexEnabled,
    deployed: modDetesWeNeedForLoadOrder.vortexEnabled,
    deployedVersion: modDetesWeNeedForLoadOrder.redmodInfo.version,
    customSounds:
      (modDetesWeNeedForLoadOrder.redmodInfo.customSounds ? modDetesWeNeedForLoadOrder.redmodInfo.customSounds : []),
  };

  return V2077LoadOrderEntry;
};

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
    modsDotJsonEntry: makeModsDotJsonLoadOrderEntryFrom(vortexEntry),
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

export const makeModsDotJsonLoadOrderFrom = (
  vortexLoadOrder: VortexLoadOrder,
): ModsDotJson => {
  const modsDotJsonLoadOrderEntries = pipe(
    vortexLoadOrder,
    map(makeModsDotJsonLoadOrderEntryFrom),
    toMutableArray,
  );

  return {
    mods: modsDotJsonLoadOrderEntries,
  };
};

export const maybeCompilableMod = (
  vortexApi: VortexApi | { log: () => unknown },
  gameDirPath: string,
  entry: LoadOrderEntry,
): Promise<boolean> => {
  const tag = `${me}: REDmod Background Deploy`;

  const fullPath = path.join(gameDirPath, entry.redmodPath);

  const needsCompilation = pipe(
    dirFromDiskTE({ relativePath: entry.redmodPath, pathOnDisk: fullPath }),
    mapTE(((dirs) => dirs.filter((dir) => dir.entry.isDirectory()))),
    mapTE((dirs) => dirs.map((dir) => dir.entry.name)),
    mapTE(((dirs) => pipe(dirs, any(pathIn(REDMOD_COMPILABLE_DIRNAMES))))),
    (entries) => entries,
    mapLeftTE((e) => {
      vortexApi.log(`error`, `${tag}: Could not parse folder for mod \`${entry.vortexId}\` with error: \`${e.message}\`.`);
      return e;
    }),
    mapTE((isCompilable) => {
      vortexApi.log(`debug`, `${tag}: redmod exists \`${entry.vortexId}\` and is compilable: \`${isCompilable}\`.`);
      return isCompilable;
    }),
    // We want to just run the unpruned mod if reading it fails... that way the deploy commandlet will fail and tell the user.
    getOrElseTE(ret(task(false))),
  );

  return needsCompilation();
};

export const pruneToSparseLoadOrder = async (
  vortexApi: VortexApi | { log: () => unknown },
  gameDirPath: string,
  loadOrderFromVortex: LoadOrder,
): Promise<LoadOrder> => {
  vortexApi.log(`debug`, `${me}: Sparsing out the load order`);

  const newLoadOrderEntries =
    pipe(
      loadOrderFromVortex.entriesInOrderWithEarlierWinning,
      reduce(
        [],
        async (memo: Promise<LoadOrderEntry[]>, e) =>
          (await maybeCompilableMod(vortexApi, gameDirPath, e) ? [...await memo, e] : memo),
      ),
    );

  const newLoadOrder = {
    ...loadOrderFromVortex,
    entriesInOrderWithEarlierWinning: await newLoadOrderEntries,
  };

  return newLoadOrder;
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

  const redModDeployParameters = [
    `deploy`,
    `-force`, // TODO: Required until https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/297
    // leave -root out
    `-rttiSchemaFile=`,
    `"${path.join(gameDirPath, REDMODDING_RTTI_METADATA_FILE_PATH)}"`,
  ];

  const redModDeployParametersToCreateNewManifest = [
    ...redModDeployParameters,
    ...loadOrderedModListToDeploy,
  ];

  const exePath =
    path.join(gameDirPath, REDdeployExeRelativePath);

  const runOptions: VortexRunOptions = {
    cwd: path.dirname(exePath),
    shell: false,
    detach: false,
    expectSuccess: true,
  };

  return {
    executable: exePath,
    args: redModDeployParametersToCreateNewManifest,
    options: runOptions,
  };
};


export const startREDmodDeployInTheBackgroundWithNotifications = async (
  vortexApi: VortexApi,
  gameDirPath: string,
  loID: number,
  v2077LoadOrderToDeploy: LoadOrder,
  vortexFormatLoadOrderForComparison: VortexLoadOrder,
): Promise<{ stdout: string, stderr: string }> => {
  const tag = `${me}: REDmod Background Deploy`;

  vortexApi.log(`info`, `${tag}: Starting background deploy for load order ${loID}`);

  const vortexState: VortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  const ownerProfileId = v2077LoadOrderToDeploy.ownerVortexProfileId;

  if (activeProfile.id !== ownerProfileId) {
    vortexApi.log(`warn`, `${tag}: Profile is not the same that generated load order ${loID}, stopping!`, { activeProfile, ownerProfileId });
    return Promise.resolve();
  }

  const newestGeneratedLoadOrder: readonly VortexLoadOrderEntry[] =
    vortexUtil.getSafe(vortexState, [`persistent`, `loadOrder`, ownerProfileId], undefined);

  if (!newestGeneratedLoadOrder) {
    vortexApi.log(`error`, `${tag}: Unable to find the current load order, canceling! It should be *this* one (${loID}) if nothing else.`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentFailed);

    return Promise.resolve();
  }

  // Are we still the current load order? Maybe not!
  //
  // Maybe there's a better way to do this check.. but this is what Vortex itself
  // uses, so we can't give an actually unique ID to the vortex load order because
  // then it won't match the previous run..
  if (JSON.stringify(vortexFormatLoadOrderForComparison) !== JSON.stringify(newestGeneratedLoadOrder)) {
    vortexApi.log(`info`, `${tag}: Load order ${loID} no longer most recent, this is ok, canceling!`);
    // No need to notify, it's fine if this has been superceded
    return Promise.resolve();
  }

  // Need to only deploy that which is necessary for compilation. This is any redmod with a script, sound, or tweak change.
  // After that, we can take all of the plain archive based redmods and selectively inject them into the mods.json.
  const sparseLOforDeploy = await pruneToSparseLoadOrder(vortexApi, gameDirPath, v2077LoadOrderToDeploy);

  if (sparseLOforDeploy.entriesInOrderWithEarlierWinning.length === 0) {
    vortexApi.log(`info`, `${tag}: No mods that require running redMod.exe, skipping!`);
    vortexApi.log(`debug`, `${tag}: Deleted existing mods.json so we don't have to deal with outdated data`);
    return Promise.resolve({ stdout: `<redMod.exe run skipped>`, stderr: `` });
  }

  const redDeploy =
    loadOrderToREDdeployRunParameters(gameDirPath, sparseLOforDeploy);

  if (isEmpty(v2077LoadOrderToDeploy.entriesInOrderWithEarlierWinning)) {
    vortexApi.log(`warn`, `${me}: No mods in load order, running default REDdeploy!`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentDefaulted);
  } else {
    vortexApi.log(`info`, `${me}: Starting REDmod deployment ${loID}!`);
    showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentStarted);
  }

  const exec = promisify(execFile);

  // TS doesn't allow PromiseWithChild, but we can get the child out if we need it later
  // Should probably print these but it's so fucking spammy the logs are almost useless
  // Just use a debugger instead I guess..

  const REDdeployment: PromiseWithChild<{ stdout: string, stderr: string }> =
    exec(
      redDeploy.executable,
      [...redDeploy.args],
      {
        cwd: redDeploy.options.cwd,
        shell: redDeploy.options.shell,
        timeout: (120 * 1000),
        maxBuffer: (1024 * 1024),
        windowsHide: true,
      },
    );

  return REDdeployment;
};

const writeLoadOrderToDisk = (
  loID: number,
  loadOrderPath: string,
  serializedLoadOrder: string,
): TaskEither<Error, void> =>
  pipe(
    tryCatchTE(
      () =>
        fs.statAsync(path.dirname(loadOrderPath)).then(() =>
          fs.writeFileAsync(`${loadOrderPath}.${loID}.tmp`, serializedLoadOrder, { encoding: `utf8` })).then(() =>
          fs.renameAsync(`${loadOrderPath}.${loID}.tmp`, loadOrderPath)),
      (error) => new Error(`Unable to write load order to disk: ${S(error)}`),
    ),
  );


export const rebuildModsDotJsonLoadOrder =
(
  vortexApi: VortexApi | { log: () => unknown },
  allMods: ModsDotJsonEntry[],
  modsInModsDotJson: ModsDotJsonEntry[],
): ModsDotJson => {
  const rebuiltMods = allMods;
  modsInModsDotJson.forEach((newEntry) => {
    const meow = allMods.findIndex((entry) => entry.folder === newEntry.folder);
    if (typeof meow === `number` && meow !== -1) {
      rebuiltMods[meow] = newEntry;
    } else {
      // I don't like this. I'd rather an error or something be thrown here or something... but this
      // might be okay? It would allow a deployment of their own with non-vortex mods to be done and
      // include them on them on the bottom of the load order... I think.
      vortexApi.log(`error`, `${me}: rebuildModsDotJsonLoadOrder: Compiled and vortex mods list mismatch! adding onto the end.`);
      rebuiltMods.push(newEntry);
    }
  });

  return {
    mods: rebuiltMods,
  };
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
const deployAndSerializeNewLoadOrder: VortexWrappedSerializeFunc = async (
  vortexApi: VortexApi,
  vortexLoadOrder: VortexLoadOrder,
): Promise<void> => {
  const gameDirPath = getDiscoveryPath(vortexApi);

  if (gameDirPath === undefined) {
    vortexApi.log(`error`, `${me}: Serialize: Game not found! (discoveryPath is undefined)`);
    return Promise.reject(new vortexUtil.NotFound(`Game Not Found.`));
  }

  if (vortexLoadOrder === undefined || vortexLoadOrder?.length === 0) {
    // Need to delete the file if it exists, otherwise the game will try to load it?
    vortexApi.log(`info`, `${me}: Serialize: No mods in load order, skipping writing to disk..`);
    return Promise.resolve();
  }

  // Is there any risk there could be a mismatch of profiles here? Surely not?
  const vortexState: VortexState = vortexApi.store.getState();
  const activeProfile = selectors.activeProfile(vortexState);

  const ownerVortexProfileId = activeProfile.id;
  const loID = Date.now();

  const v2077LoadOrder = makeV2077LoadOrderFrom(vortexLoadOrder, ownerVortexProfileId, loID);
  const modsDotJsonLoadOrder = makeModsDotJsonLoadOrderFrom(vortexLoadOrder);

  vortexApi.log(`info`, `${me}: New load order ${loID} ready to be deployed and serialized!`);

  // We want to wait until there's been a deployment - either the automatic one
  // from an enable or something like that, or a manually triggered one.
  vortexApi.events.once(`did-deploy`, async () => {

    // This is aggressively stupid, couldn't find a way to split the segments
    // without rerunning the earlier ones...
    const maybeREDdeployed =
      pipe(
        tryCatchTE(
          () =>
            startREDmodDeployInTheBackgroundWithNotifications(
              vortexApi,
              gameDirPath,
              loID,
              v2077LoadOrder,
              vortexLoadOrder,
            ),
          (err) => {
            vortexApi.log(`error`, `${me}: REDmod deployment ${loID} failed!`, S(err));
            throw err;
          },
        ),
        mapTE(({ stdout, stderr }) => {
          if (stderr !== ``) {
            vortexApi.log(`warn`, `${me}: redMod.exe produced some error/warning output (this is probably ok since the command didn't fail): ${stderr}`);
          }

          vortexApi.log(`info`, `${me}: redMod.exe output: ${stdout}`);
          return true;
        }),
        // Serialize mods.json
        chainTE((_ok) => pipe(
          modsDotJsonPathFor(gameDirPath),
          deserializeModsDotJson(vortexApi),
          mapLeftTE((error) => {
            vortexApi.log(`error`, `${me}: Error rebuilding mods.json: ${error.message}`);
            showInvalidLoadOrderFileErrorDialog(vortexApi, loadOrderPathFor(activeProfile, gameDirPath));
            return Promise.reject(error);
          }),
          mapTE((modsDotJsonList) => {
            vortexApi.log(`debug`, `${me}: Successfully rebuilt mods.json with all mods...`);
            return rebuildModsDotJsonLoadOrder(vortexApi, modsDotJsonLoadOrder.mods, toMutableArray(modsDotJsonList));
          }),
          mapTE((rebuiltModsDotJsonLoadOrder) => encodeModsDotJsonLoadOrder(rebuiltModsDotJsonLoadOrder)),
          mapTE((rebuiltModsDotJson) => {
            vortexApi.log(`info`, `${me}: Saving load order ${loID} in r6/cache/modded/mods.json...`);
            writeLoadOrderToDisk(loID, modsDotJsonPathFor(gameDirPath), rebuiltModsDotJson);
          }),
          mapLeftTE((error) => {
            vortexApi.log(`error`, `${me}: Unable to write load order to disk: ${error.message}`);
            showInfoNotification(vortexApi, InfoNotification.LoadOrderWriteFailed);
            return error;
          }),
        )),
        // Serialize load order
        chainTE((_ok) => {
          const serializedLoadOrder =
            encodeLoadOrder(v2077LoadOrder);

          const loadOrderFilePathForThisProfile =
            loadOrderPathFor(activeProfile, gameDirPath);

          vortexApi.log(`info`, `${me}: Saving V2077-format load order ${loID} to disk in ${loadOrderFilePathForThisProfile}`);

          return pipe(
            writeLoadOrderToDisk(loID, loadOrderFilePathForThisProfile, serializedLoadOrder),
            mapLeftTE((error) => {
              vortexApi.log(`error`, `${me}: Unable to write load order to disk: ${error.message}`);
              showInfoNotification(vortexApi, InfoNotification.LoadOrderWriteFailed);
              return error;
            }),
          );
        }),
      );

    const REDdeployRun = await maybeREDdeployed();

    if (isLeft(REDdeployRun)) {
      // boo
      vortexApi.log(`error`, `${me}: REDmod deployment ${loID} failed! ${S(REDdeployRun.left)}`);
      return showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentFailed);
    }

    vortexApi.log(`info`, `${me}: REDmod deployment ${loID} complete!`);
    return showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentSucceeded);
  });

  // And the rest, as they say, is callback

  vortexApi.log(`info`, `${me}: Queuing REDmod deployment for load order ${loID} to run after next Vortex deployment!`);
  return showInfoNotification(vortexApi, InfoNotification.REDmodDeploymentQueued);
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

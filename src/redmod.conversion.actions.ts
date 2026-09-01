import path from "path";
import {
  isLeft,
  left as leftE,
  match as matchE,
  right as rightE,
} from "fp-ts/lib/Either";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  every,
  filter,
  map,
  partitionMap,
  toArray as toMutableArray,
} from "fp-ts/ReadonlyArray";
import {
  actions as vortexActions,
  fs,
  selectors,
  util as vortexUtil,
} from "@vortex-api-test-shimmed";
import {
  EXTENSION_NAME_INTERNAL,
  GAME_ID,
} from "./index.metadata";
import {
  ARCHIVE_CONVERSION_MARKER,
  attrModType,
  attrREDmodInfos,
  attrWasConvertedFromArchives,
  makeAttr,
  ModAttributeKey,
  ModType,
} from "./installers.types";
import {
  applyStagingChanges,
  looksAutoconvertedByAnOlderVersion,
  planConversionToREDmod,
  planRevertToArchiveMod,
  redmodModuleNameFrom,
  redmodModuleNameNotYetTaken,
  StagingChanges,
  StagingFileOps,
} from "./redmod.conversion";
import {
  redmodToolingIsInstalled,
  warnREDmoddingDlcIsMissing,
} from "./redmodding";
import {
  gameDirPath,
  isSupported,
} from "./state.functions";
import {
  InfoNotification,
  showInfoNotification,
} from "./ui.notifications";
import {
  S,
} from "./util.functions";
import {
  VortexActionConditionResult,
  VortexApi,
  VortexMod,
  VortexState,
} from "./vortex-wrapper";

const me = `${EXTENSION_NAME_INTERNAL} Archive Conversion`;

const DEFAULT_VERSION_FOR_UNVERSIONED_MODS = `0.0.1+V2077`;

// Conversion rearranges the staging folder, so only one runs at a time. A
// second request is turned away rather than queued, since it would have been
// planned against a staging folder the first one is busy changing.
let conversionInProgress = false;

//
// Reading what we need out of Vortex
//

const modsFromState = (
  state: VortexState,
  modIds: readonly string[],
): readonly VortexMod[] => pipe(
  modIds,
  map((modId) => selectors.getMod(state, GAME_ID, modId)),
  filter((mod) => mod !== undefined),
);

const stagingDirFor = (state: VortexState, mod: VortexMod): string =>
  selectors.getModInstallPath(state, GAME_ID, mod.id);

const wasConvertedFromArchives = (mod: VortexMod): boolean =>
  attrWasConvertedFromArchives(mod)
  || looksAutoconvertedByAnOlderVersion(attrREDmodInfos(mod));

// Module directories claimed by REDmods other than the ones being converted
// right now, so a conversion can't land on top of an existing module.
const redmodModuleNamesInUse = (
  state: VortexState,
  exceptForModIds: readonly string[],
): Set<string> => {
  const beingConvertedNow = new Set(exceptForModIds);

  return pipe(
    Object.values(selectors.modsForGame(state, GAME_ID)),
    filter((mod) => !beingConvertedNow.has(mod.id)),
    map((mod) => pipe(
      attrREDmodInfos(mod),
      map((redmodInfo) => path.basename(redmodInfo.relativePath)),
    )),
    (namesPerMod) => new Set(namesPerMod.flat()),
  );
};

//
// Disk
//

const relativeFilePathsUnder = async (rootDir: string): Promise<readonly string[]> => {
  const filePaths: string[] = [];

  await vortexUtil.walk(rootDir, (foundPath: string, stats: { isDirectory: () => boolean }) => {
    if (!stats.isDirectory()) {
      filePaths.push(path.relative(rootDir, foundPath));
    }
    return Promise.resolve();
  });

  return filePaths;
};

const stagingFileOpsFor = (modStagingDir: string): StagingFileOps => {
  const on = (relativePath: string): string =>
    path.join(modStagingDir, relativePath);

  return {
    // moveAsync creates the destination directory itself
    move: async (from: string, to: string): Promise<void> => {
      await fs.moveAsync(on(from), on(to));
    },
    writeFile: async (at: string, content: string): Promise<void> => {
      await fs.ensureDirAsync(path.dirname(on(at)));
      await fs.writeFileAsync(on(at), content, { encoding: `utf8` });
    },
    deleteFile: async (at: string): Promise<void> => {
      await fs.removeAsync(on(at));
    },
    removeDirIfEmpty: async (dir: string): Promise<void> => {
      try {
        await fs.rmdirAsync(on(dir));
      } catch {
        // Anything still in there belongs to the mod, so leaving it is correct
      }
    },
  };
};

//
// Planning a whole selection
//

// Attributes are set one at a time because only the singular action deletes a
// key when the value is undefined, which is how a revert clears them.
type AttributeChanges = Record<string, unknown>; // keyed by ModAttributeKey

interface PlannedModChange {
  mod: VortexMod;
  modStagingDir: string;
  changes: StagingChanges;
  attributeChanges: AttributeChanges;
}

interface UnplannableMod {
  mod: VortexMod;
  reason: string;
}

interface PlannedSelection {
  planned: readonly PlannedModChange[];
  skipped: readonly UnplannableMod[];
}

type PlanAttempt = PlannedModChange | UnplannableMod;

const splitOutWhatWeCanDo = (attempts: readonly PlanAttempt[]): PlannedSelection =>
  pipe(
    attempts,
    partitionMap((attempt) =>
      (`reason` in attempt ? leftE(attempt) : rightE(attempt))),
    ({ left: skipped, right: planned }) => ({ skipped, planned }),
  );

const planConversionForSelection = async (
  api: VortexApi,
  mods: readonly VortexMod[],
): Promise<PlannedSelection> => {
  const state = api.store.getState();

  const namesAlreadyTaken =
    new Set(redmodModuleNamesInUse(state, pipe(mods, map((mod) => mod.id))));

  const attempts = await Promise.all(pipe(
    mods,
    map(async (mod): Promise<PlanAttempt> => {
      const wantedModuleName =
        redmodModuleNameFrom(vortexUtil.renderModName(mod));

      if (isLeft(wantedModuleName)) {
        return { mod, reason: wantedModuleName.left.message };
      }

      const moduleName =
        redmodModuleNameNotYetTaken(wantedModuleName.right, namesAlreadyTaken);

      // Claim it so two mods in the same selection can't both take it
      namesAlreadyTaken.add(moduleName);

      const modStagingDir = stagingDirFor(state, mod);

      const plan = planConversionToREDmod(
        mod.id,
        moduleName,
        mod.attributes?.version ?? DEFAULT_VERSION_FOR_UNVERSIONED_MODS,
        await relativeFilePathsUnder(modStagingDir),
      );

      if (isLeft(plan)) {
        return { mod, reason: plan.left.message };
      }

      return {
        mod,
        modStagingDir,
        changes: plan.right.changes,
        attributeChanges: {
          [ModAttributeKey.ModType]:
            makeAttr(ModAttributeKey.ModType, ModType.REDmod).value,
          [ModAttributeKey.REDmodInfoArray]:
            makeAttr(ModAttributeKey.REDmodInfoArray, [plan.right.redmodInfo]).value,
          [ModAttributeKey.ArchiveConversion]:
            makeAttr(ModAttributeKey.ArchiveConversion, ARCHIVE_CONVERSION_MARKER).value,
        },
      };
    }),
    toMutableArray,
  ));

  return splitOutWhatWeCanDo(attempts);
};

const planRevertForSelection = async (
  api: VortexApi,
  mods: readonly VortexMod[],
): Promise<PlannedSelection> => {
  const state = api.store.getState();

  const attempts = await Promise.all(pipe(
    mods,
    map(async (mod): Promise<PlanAttempt> => {
      const modStagingDir = stagingDirFor(state, mod);

      const plan = planRevertToArchiveMod(
        attrREDmodInfos(mod),
        await relativeFilePathsUnder(modStagingDir),
      );

      if (isLeft(plan)) {
        return { mod, reason: plan.left.message };
      }

      return {
        mod,
        modStagingDir,
        changes: plan.right.changes,
        attributeChanges: {
          [ModAttributeKey.ModType]: undefined,
          [ModAttributeKey.REDmodInfoArray]: undefined,
          [ModAttributeKey.ArchiveConversion]: undefined,
        },
      };
    }),
    toMutableArray,
  ));

  return splitOutWhatWeCanDo(attempts);
};

//
// Running it
//

const listOf = (mods: readonly VortexMod[]): string =>
  pipe(mods, map((mod) => `- ${vortexUtil.renderModName(mod)}`)).join(`\n`);

const listOfSkipped = (skipped: readonly UnplannableMod[]): string =>
  pipe(
    skipped,
    map(({ mod, reason }) => `- ${vortexUtil.renderModName(mod)}: ${reason}`),
  ).join(`\n`);

const describeSelection = (
  { planned, skipped }: PlannedSelection,
  whatWillHappen: string,
): string => {
  const skippedSection =
    skipped.length > 0
      ? `\n\nThese can't be changed and will be left alone:\n\n${listOfSkipped(skipped)}`
      : ``;

  return `${whatWillHappen}\n\n${listOf(pipe(planned, map(({ mod }) => mod)))}${skippedSection}`;
};

const applyPlannedChanges = async (
  api: VortexApi,
  planned: readonly PlannedModChange[],
): Promise<readonly UnplannableMod[]> => {
  const failures: UnplannableMod[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const {
    mod, modStagingDir, changes, attributeChanges,
  } of planned) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await applyStagingChanges(stagingFileOpsFor(modStagingDir), changes);

      Object.entries(attributeChanges).forEach(([attributeKey, value]) => {
        api.store.dispatch(
          vortexActions.setModAttribute(GAME_ID, mod.id, attributeKey, value),
        );
      });
    } catch (err) {
      api.log(`error`, `${me}: Failed to change ${mod.id} on disk`, S(err));
      failures.push({ mod, reason: `${err}` });
    }
  }

  return failures;
};

interface StagingConversionOperation {
  title: string;
  explanation: string;
  confirmLabel: string;
  plan: (api: VortexApi, mods: readonly VortexMod[]) => Promise<PlannedSelection>;
}

const runStagingConversion = async (
  api: VortexApi,
  modIds: readonly string[],
  operation: StagingConversionOperation,
): Promise<void> => {
  if (conversionInProgress) {
    showInfoNotification(api, InfoNotification.ArchiveConversionBusy);
    return;
  }

  conversionInProgress = true;

  try {
    const mods = modsFromState(api.store.getState(), modIds);
    const selection = await operation.plan(api, mods);

    if (selection.planned.length < 1) {
      await api.showDialog(
        `info`,
        operation.title,
        { md: describeSelection(selection, `Nothing here can be changed:`) },
        [{ label: `Close` }],
      );
      return;
    }

    const confirmation = await api.showDialog(
      `question`,
      operation.title,
      { md: describeSelection(selection, operation.explanation) },
      [{ label: `Cancel` }, { label: operation.confirmLabel }],
    );

    if (confirmation.action !== operation.confirmLabel) {
      return;
    }

    api.log(`info`, `${me}: ${operation.title} for ${selection.planned.length} mod(s), purging first`);

    await vortexUtil.toPromise((cb) => api.events.emit(`purge-mods`, false, cb));

    const failures = await applyPlannedChanges(api, selection.planned);

    await vortexUtil.toPromise((cb) => api.events.emit(`deploy-mods`, cb));

    if (failures.length > 0) {
      api.showErrorNotification(
        `${operation.title} didn't finish`,
        listOfSkipped(failures),
        { allowReport: false },
      );
      return;
    }

    showInfoNotification(
      api,
      InfoNotification.ArchiveConversionDone,
      `${selection.planned.length} mod(s) changed - check the load order!`,
    );
  } catch (err) {
    api.log(`error`, `${me}: ${operation.title} failed`, S(err));
    api.showErrorNotification(`${operation.title} failed`, err as Error);
  } finally {
    conversionInProgress = false;
  }
};

//
// The actions themselves
//

// A converted mod is loaded by REDmod and nothing else, so without the tooling
// it wouldn't load at all.
const canLoadREDmods = async (api: VortexApi): Promise<boolean> =>
  pipe(
    gameDirPath(api),
    matchE(
      () => Promise.resolve(false),
      (gameDir) => redmodToolingIsInstalled(gameDir),
    ),
  );

export const convertArchiveModsToREDmods = async (
  api: VortexApi,
  modIds: readonly string[],
): Promise<void> => {
  if (!await canLoadREDmods(api)) {
    api.log(`warn`, `${me}: REDmod tooling missing, refusing to convert`);
    warnREDmoddingDlcIsMissing(api);
    return;
  }

  await runStagingConversion(api, modIds, {
    title: `Convert to REDmod`,
    explanation: `Converting rearranges the mod in the staging folder so that REDmod loads it. That puts it in the load order, and lets it override plain archive mods. Vortex will purge and redeploy to do it.\n\nThese will be converted:`,
    confirmLabel: `Convert`,
    plan: planConversionForSelection,
  });
};

export const revertREDmodsToArchiveMods = (
  api: VortexApi,
  modIds: readonly string[],
): Promise<void> =>
  runStagingConversion(api, modIds, {
    title: `Revert to archive mod`,
    explanation: `Reverting puts the archives back where they started. That takes the mod out of the load order, and it loads alphabetically again. Vortex will purge and redeploy to do it.\n\nThese will be reverted:`,
    confirmLabel: `Revert`,
    plan: planRevertForSelection,
  });

//
// When to offer them
//

// Vortex calls this on every render of the mods table, including while another
// game is active, so the api is only resolved once we know the rows are ours.
const forEveryModInSelection = (
  getApi: () => VortexApi,
  modIds: readonly string[],
  isEligible: (mod: VortexMod) => boolean,
): VortexActionConditionResult => {
  const state = getApi().store.getState();

  if (!isSupported(selectors.activeGameId(state))) {
    return false;
  }

  const mods = modsFromState(state, modIds);

  // conversionInProgress is deliberately not reflected here: Redux can't see a
  // plain variable change, so the menu would keep whatever it last rendered.
  // Clicking while busy is turned away with a notification instead.
  return mods.length > 0 && pipe(mods, every(isEligible));
};

// The api is resolved per call rather than captured, since Vortex refuses to
// hand it over while extensions are still initialising.
export const canConvertToREDmod = (getApi: () => VortexApi) =>
  (modIds: string[] = []): VortexActionConditionResult =>
    forEveryModInSelection(getApi, modIds, (mod) =>
      mod.state === `installed` && attrModType(mod) !== ModType.REDmod);

export const canRevertToArchiveMod = (getApi: () => VortexApi) =>
  (modIds: string[] = []): VortexActionConditionResult =>
    forEveryModInSelection(getApi, modIds, (mod) =>
      mod.state === `installed`
      && attrModType(mod) === ModType.REDmod
      && wasConvertedFromArchives(mod));

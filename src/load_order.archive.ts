import {
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  win32,
} from "path";
import {
  actions,
  selectors,
} from "@vortex-api-test-shimmed";
import {
  pathEq,
  pathIn,
} from "./filetree";
import {
  GAME_ID,
} from "./index.metadata";
import {
  ARCHIVE_MOD_CANONICAL_PREFIX,
  ARCHIVE_MOD_FILE_EXTENSION,
} from "./installers.layouts";
import {
  getDiscoveryPath,
  WINDOWS_LINE_ENDING,
  wrapDeserialize,
  wrapSerialize,
  wrapValidate,
} from "./load_order";
import {
  ARCHIVE_LOAD_ORDER_ID,
  LoadOrderer,
} from "./load_order.types";
import {
  bbcodeBasics,
  getErrorCode,
  heredoc,
} from "./util.functions";
import {
  makeVortexApi,
  VortexApi,
  VortexExtensionContext,
  VortexLoadOrder,
  VortexLoadOrderEntry,
  VortexLoadOrderGameInfo,
  vortexUtil,
} from "./vortex-wrapper";

// Ensure we're using win32 conventions
const path = win32;

// The game reads this from archive\pc\mod: listed archives load first, in order, then the rest.
const ARCHIVE_MODLIST_FILENAME = `modlist.txt`;

// keyed by lower-cased archive file name
export type VortexModIdByArchive = Record<string, string>;

const archiveEntryFor = (
  archiveFileName: string,
  vortexModIdByArchive: VortexModIdByArchive,
): VortexLoadOrderEntry => ({
  id: archiveFileName,
  name: archiveFileName,
  enabled: true,
  modId: vortexModIdByArchive[archiveFileName.toLowerCase()],
});

// The order the game loads the archives in.
export const archiveLoadOrderFrom = (
  archiveFileNames: readonly string[],
  modList: readonly string[] | undefined,
  vortexModIdByArchive: VortexModIdByArchive,
): VortexLoadOrder => {
  const onDiskByLowerCaseName = new Map(archiveFileNames.map((name) => [name.toLowerCase(), name]));
  const listed = new Set(
    (modList ?? [])
      .map((name) => onDiskByLowerCaseName.get(name.toLowerCase()))
      .filter((name): name is string => name !== undefined),
  );
  const unlisted = archiveFileNames
    .filter((name) => !listed.has(name))
    .sort();
  return [...listed, ...unlisted].map((name) => archiveEntryFor(name, vortexModIdByArchive));
};

// The modlist for a load order, or undefined when the default ASCII order needs none.
export const modListFor = (loadOrder: VortexLoadOrder): readonly string[] | undefined => {
  const archiveFileNames = loadOrder.map((entry) => entry.id);
  return archiveFileNames.every((name, index) => index === 0 || archiveFileNames[index - 1] <= name)
    ? undefined
    : archiveFileNames;
};

const archiveModDirFor = (vortexApi: VortexApi): string => {
  const gameDirPath = getDiscoveryPath(vortexApi);
  if (gameDirPath === undefined) {
    throw new vortexUtil.NotFound(`Game not found`);
  }
  return path.join(gameDirPath, ARCHIVE_MOD_CANONICAL_PREFIX);
};

const archiveFileNamesIn = async (archiveModDir: string): Promise<string[]> => {
  try {
    const names = await readdir(archiveModDir);
    return names.filter((name) => pathIn([ARCHIVE_MOD_FILE_EXTENSION])(path.extname(name)));
  } catch (error) {
    if (getErrorCode(error) === `ENOENT`) {
      return [];
    }
    throw error;
  }
};

const modListIn = async (archiveModDir: string): Promise<string[] | undefined> => {
  try {
    const contents = await readFile(path.join(archiveModDir, ARCHIVE_MODLIST_FILENAME), `utf8`);
    return contents.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  } catch (error) {
    if (getErrorCode(error) === `ENOENT`) {
      return undefined;
    }
    throw error;
  }
};

export const readArchiveLoadOrder = async (
  archiveModDir: string,
  vortexModIdByArchive: VortexModIdByArchive,
): Promise<VortexLoadOrder> => {
  const [archiveFileNames, modList] =
    await Promise.all([archiveFileNamesIn(archiveModDir), modListIn(archiveModDir)]);
  return archiveLoadOrderFrom(archiveFileNames, modList, vortexModIdByArchive);
};

// The order the game loads the archives in without a modlist.
export const readDefaultArchiveLoadOrder = async (
  archiveModDir: string,
  vortexModIdByArchive: VortexModIdByArchive,
): Promise<VortexLoadOrder> =>
  archiveLoadOrderFrom(await archiveFileNamesIn(archiveModDir), undefined, vortexModIdByArchive);

// Writes the modlist the load order needs, or removes it when the default order needs none.
export const writeArchiveModList = async (
  archiveModDir: string,
  loadOrder: VortexLoadOrder,
): Promise<void> => {
  const modListPath = path.join(archiveModDir, ARCHIVE_MODLIST_FILENAME);
  const modList = modListFor(loadOrder);
  if (modList === undefined) {
    await rm(modListPath, { force: true });
    return;
  }
  const writingPath = `${modListPath}.${Date.now()}.tmp`;
  await writeFile(writingPath, modList.join(WINDOWS_LINE_ENDING), `utf8`);
  await rename(writingPath, modListPath);
};

const vortexModIdByDeployedArchive = async (vortexApi: VortexApi): Promise<VortexModIdByArchive> => {
  const manifest = await vortexUtil.getManifest(vortexApi, ``, GAME_ID);
  const isInArchiveModDir = pathEq(ARCHIVE_MOD_CANONICAL_PREFIX);
  return Object.fromEntries(
    manifest.files
      .filter((file) => isInArchiveModDir(`${path.dirname(file.relPath)}${path.sep}`))
      .map((file) => [path.basename(file.relPath).toLowerCase(), file.source]),
  );
};

const deserializeArchiveLoadOrder = async (vortexApi: VortexApi): Promise<VortexLoadOrder> =>
  readArchiveLoadOrder(archiveModDirFor(vortexApi), await vortexModIdByDeployedArchive(vortexApi));

const serializeArchiveLoadOrder = async (
  vortexApi: VortexApi,
  loadOrder: VortexLoadOrder,
): Promise<void> =>
  writeArchiveModList(archiveModDirFor(vortexApi), loadOrder);

const archiveLoadOrderer: LoadOrderer = {
  validate: async () => undefined,
  deserializeLoadOrder: deserializeArchiveLoadOrder,
  serializeLoadOrder: serializeArchiveLoadOrder,
};

const archiveLoadOrderUsageInstructions =
  heredoc(bbcodeBasics(`
    The game loads archive mods alphabetically by file name, and that is what
    most setups need. You don't have to change anything here unless you know
    two archives conflict and want a particular one to win.

    If you do, drag the archives into the order you want them to load. When two
    archives change the same file, the one higher in this list wins.

    Every archive loads before every REDmod, whatever the order here, so an
    archive always beats a REDmod that changes the same file.

    The order is written to archive\\pc\\mod\\modlist.txt once you move something
    away from the default alphabetical order, and that file is removed again if
    you go back to it.

    Only deployed archives are listed. A disabled mod's archives drop out of the
    list and return after the ones you have ordered when you enable it again.
  `));

const sortArchivesAlphabetically = async (vortexApi: VortexApi): Promise<void> => {
  const profileId = selectors.activeProfile(vortexApi.store.getState())?.id;
  const defaultLoadOrder = await readDefaultArchiveLoadOrder(
    archiveModDirFor(vortexApi),
    await vortexModIdByDeployedArchive(vortexApi),
  );
  vortexApi.store.dispatch(actions.setFBLoadOrder(profileId, defaultLoadOrder, ARCHIVE_LOAD_ORDER_ID));
};

export const registerSortArchivesAlphabetically = (
  vortexExt: VortexExtensionContext,
  vortexApiLib,
): void => {
  vortexExt.registerAction(
    `fb-load-order-icons`,
    100,
    `loot-sort`,
    {},
    `Sort Archives Alphabetically`,
    () => {
      const vortexApi = makeVortexApi(vortexExt, vortexApiLib);
      vortexApi.showDialog(
        `question`,
        `Sort Archives Alphabetically`,
        {
          text: `This puts the archives back in alphabetical order, which is the order the game uses ` +
            `on its own, and removes archive\\pc\\mod\\modlist.txt. The order you set here is lost.`,
        },
        [
          { label: `Cancel` },
          {
            label: `Sort Alphabetically`,
            action: (): void => {
              sortArchivesAlphabetically(vortexApi).catch((error) => {
                vortexApi.showErrorNotification(`Failed to sort archives`, error, { allowReport: false });
              });
            },
          },
        ],
      );
    },
    // Vortex hands load order page actions the id of the load order on show
    (instanceIds?: string[]) => instanceIds?.[0] === ARCHIVE_LOAD_ORDER_ID,
  );
};

export const makeArchiveLoadOrderRegistration = (
  vortexExt: VortexExtensionContext,
  vortexApiLib,
): VortexLoadOrderGameInfo => ({
  gameId: GAME_ID,
  loadOrderId: ARCHIVE_LOAD_ORDER_ID,
  displayName: `Archives`,
  priority: 1,
  conflictWinner: `first`,
  usageInstructions: archiveLoadOrderUsageInstructions,
  validate: wrapValidate(vortexExt, vortexApiLib, archiveLoadOrderer),
  deserializeLoadOrder: wrapDeserialize(vortexExt, vortexApiLib, archiveLoadOrderer),
  serializeLoadOrder: wrapSerialize(vortexExt, vortexApiLib, archiveLoadOrderer),
});

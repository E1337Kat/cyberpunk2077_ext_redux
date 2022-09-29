/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as path from "path";
import { Console } from "console";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { VortexInstruction } from "../../src/vortex-wrapper";
import {
  InstallerType,
  ModInfo,
} from "../../src/installers.types";
import {
  CONFIG_XML_MOD_BASEDIR,
  CET_MOD_CANONICAL_PATH_PREFIX,
  CET_MOD_CANONICAL_INIT_FILE,
  REDS_MOD_CANONICAL_PATH_PREFIX,
  RED4EXT_MOD_CANONICAL_BASEDIR,
  TWEAK_XL_MOD_CANONICAL_PATH_PREFIX,
  ARCHIVE_MOD_CANONICAL_PREFIX,
  ASI_MOD_PATH,
  REDMOD_CANONICAL_BASEDIR,
  REDSCRIPT_CORE_FILES,
  DEPRECATED_REDSCRIPT_CORE_FILES,
} from "../../src/installers.layouts";
import { InfoNotification } from "../../src/ui.notifications";
import { Features } from "../../src/features";
import { modInfoToVortexArchiveName } from "../../src/installers.shared";

// This is the most nonsense of all nonsense, but under some
// conditions it seems to be possible for jest to override
// `console`...
//
// eslint-disable-next-line no-global-assign
console = new Console(process.stdout, process.stderr);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getMockVortexLog = () => {
  const mockLog = jest.fn();

  // if (process.env.DEBUG || true) {
  if (process.env.DEBUG) {
    mockLog.mockImplementation((...args) => {
      // eslint-disable-next-line no-console
      console.log(`vortex.log():`, args);
    });
  }

  return mockLog;
};

//
// Types
//

export type InFiles = string[];
// Should replace this with the real mock-fs type
export interface MockFsDirItems {
  [dir: string]: string | Buffer | MockFsDirItems;
}

interface ExampleMod {
  expectedInstallerType: InstallerType;
  inFiles: InFiles;
  fsMocked?: MockFsDirItems;
  features?: Features;
}

export interface ExampleSucceedingMod extends ExampleMod {
  outInstructions: VortexInstruction[];
  infoDialogTitle?: string;
  infoNotificationId?: InfoNotification;
}

export interface ExampleFailingMod extends ExampleMod {
  failure: string;
  errorDialogTitle: string;
}

export interface ExamplePromptInstallableMod extends ExampleMod {
  proceedLabel: string;
  proceedOutInstructions: VortexInstruction[];
  cancelLabel: string;
  cancelErrorMessage: string;
}

// Really should probably make this a sensible type but w/e
export type ExampleSucceedingModCategory = Map<string, ExampleSucceedingMod>;
export type ExampleFailingModCategory = Map<string, ExampleFailingMod>;
export type ExamplePromptInstallableModCategory = Map<
string,
ExamplePromptInstallableMod
>;

export interface ExamplesForType {
  readonly AllExpectedSuccesses: ExampleSucceedingModCategory;
  readonly AllExpectedDirectFailures: ExampleFailingModCategory;
  readonly AllExpectedPromptInstalls: ExamplePromptInstallableModCategory;
}

const mapHasAnySameKeys = <K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean =>
  [...map1].some(([k, _]) => map2.get(k));

// It's tests, it's ok to just raise. Don't do this in real code, kids
export const mergeOrFailOnConflict = <K, V>(...maps: Map<K, V>[]): Map<K, V> =>
  maps.reduce((mergedMap, map) => {
    if (mapHasAnySameKeys(map, mergedMap)) {
      // :goose-loose:
      throw new Error(`Duplicate keys in example categories, fix it first!`);
    }
    return new Map([...mergedMap, ...map]);
  }, new Map<K, V>());

//
// Mod path stuff
//

const FAKE_STAGING_DIRS = [`some`, `dirs`, `to`, `stage`];

export const FAKE_MOD_INFO: ModInfo = {
  name: `Fake Mod For Examples`,
  id: `8279`,
  version: {
    v: `v1.0a`,
    major: `v1`,
    minor: `0a`,
    patch: undefined,
  },
  createTime: new Date(),
  stagingDirPrefix: path.join(...FAKE_STAGING_DIRS),
  copy: undefined,
  variant: `varianttag`,
};

const FAKE_MOD_ARCHIVE_NAME = modInfoToVortexArchiveName(FAKE_MOD_INFO);
export const FAKE_MOD_NAME = FAKE_MOD_INFO.name;

const FAKE_MOD_INSTALL_DIRNAME = `${FAKE_MOD_ARCHIVE_NAME}.installing`;
export const FAKE_STAGING_PATH = path.join(...FAKE_STAGING_DIRS, FAKE_MOD_INSTALL_DIRNAME, path.sep);

//
// Test support functions, mocks
//

// Should actually maybe just use this outright for everything based on `inFiles`
// because it's possible we're looking at the fs - as we do for INIs and AMM. But
// that'll require adding a default before/afterEach to clear them out.
//
// Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/158
export const mockedFsLayout = (
  layout: MockFsDirItems = {},
  extraPathPrefixes: string[] = [],
): MockFsDirItems =>
  [...FAKE_STAGING_DIRS, ...extraPathPrefixes].reduceRight(
    (inner, dir) => Object.fromEntries([[dir, inner]]),
    layout,
  );

export const pathHierarchyFor = (entirePath: string): string[] => {
  const pathSegments = path.normalize(entirePath).split(path.sep);

  const hierarchy: string[] = pathSegments.reduce(
    (supers: string[], segment: string) =>
      supers.concat(path.join(supers[supers.length - 1], segment, path.sep)),
    [``],
  );

  return hierarchy.slice(1);
};

export const copiedToSamePath = (...args: string[]): VortexInstruction => ({
  type: `copy`,
  source: path.join(...args),
  destination: path.join(...args),
});

export const movedFromTo = (from: string, to: string): VortexInstruction => ({
  type: `copy`,
  source: path.normalize(from),
  destination: path.normalize(to),
});

export const createdDirectory = (...args: string[]): VortexInstruction => ({
  type: `mkdir`,
  destination: path.join(...args),
});

export const generatedFile = (contents: string, ...dest: string[]): VortexInstruction => ({
  type: `generatefile`,
  data: contents,
  destination: path.join(...dest),
});

export const expectedUserCancelMessageFor = (installerType: InstallerType): string =>
  `${installerType}: user chose to cancel installation`;

export const expectedUserCancelMessageForDeprecated = (installerType: InstallerType): string =>
  `${installerType}: user chose to cancel installing deprecated version`;

export const expectedUserCancelMessageForHittingFallback = expectedUserCancelMessageFor(
  InstallerType.Fallback,
);

export const expectedUserCancelProtectedMessageFor = (installerType: InstallerType): string =>
  `${installerType}: user chose to cancel installing to protected paths`;

export const expectedUserCancelProtectedMessageInMultiType = `${InstallerType.MultiType}: user has canceled installation for some part of this mod. Can't proceed safely, canceling entirely.`;

//
// Path helpers etc.
//

export const CORE_REDSCRIPT_PREFIXES =
  pipe(
    REDSCRIPT_CORE_FILES,
    RA.map(pathHierarchyFor),
    RA.flatten,
  );

export const DEPRECATED_CORE_REDSCRIPT_PREFIXES =
  pipe(
    DEPRECATED_REDSCRIPT_CORE_FILES,
    RA.map(pathHierarchyFor),
    RA.flatten,
  );

export const CORE_CET_FULL_PATH_DEPTH = path.normalize(
  `bin/x64/plugins/cyber_engine_tweaks/scripts/json`,
);
export const CORE_CET_PREFIXES = pathHierarchyFor(CORE_CET_FULL_PATH_DEPTH);
export const GAME_DIR = path.normalize(`bin/x64`);

export const XML_PREFIXES = pathHierarchyFor(CONFIG_XML_MOD_BASEDIR);

export const CET_PREFIX = CET_MOD_CANONICAL_PATH_PREFIX;
export const CET_PREFIXES = pathHierarchyFor(CET_PREFIX);
export const CET_INIT = CET_MOD_CANONICAL_INIT_FILE;

export const REDS_PREFIX = REDS_MOD_CANONICAL_PATH_PREFIX;
export const REDS_PREFIXES = pathHierarchyFor(REDS_PREFIX);

export const RED4EXT_PREFIX = RED4EXT_MOD_CANONICAL_BASEDIR;
export const RED4EXT_PREFIXES = pathHierarchyFor(RED4EXT_PREFIX);

export const REDMOD_PREFIX = REDMOD_CANONICAL_BASEDIR;
export const REDMOD_PREFIXES = pathHierarchyFor(REDMOD_PREFIX);

export const TWEAK_XL_PATH = TWEAK_XL_MOD_CANONICAL_PATH_PREFIX;
export const TWEAK_XL_PATHS = pathHierarchyFor(TWEAK_XL_PATH);

export const ARCHIVE_PREFIX = ARCHIVE_MOD_CANONICAL_PREFIX;
export const ARCHIVE_PREFIXES = pathHierarchyFor(ARCHIVE_PREFIX);

export const ASI_PREFIX = ASI_MOD_PATH;
export const ASI_PREFIXES = pathHierarchyFor(ASI_PREFIX);

export const GIFTWRAP_PREFIX = `some-dirname`;
export const CET_GIFTWRAPS = pathHierarchyFor(`${GIFTWRAP_PREFIX}\\${CET_PREFIX}`);
export const REDS_GIFTWRAPS = pathHierarchyFor(`${GIFTWRAP_PREFIX}\\${REDS_PREFIX}`);
export const RED4EXT_GIFTWRAPS = pathHierarchyFor(
  `${GIFTWRAP_PREFIX}\\${RED4EXT_PREFIX}`,
);
export const ARCHIVE_GIFTWRAPS = pathHierarchyFor(
  `${GIFTWRAP_PREFIX}\\${ARCHIVE_PREFIX}`,
);

//
// Actual test helpers
//

export const compareByDestination = (a: VortexInstruction, b: VortexInstruction): number => {
  if (!a?.destination || !b?.destination) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    throw new Error(`null destination, shouldn't happen: ${{ a, b }}`);
  } else {
    return a.destination.localeCompare(b.destination);
  }
};

export const sortByDestination = (instructions: VortexInstruction[]): VortexInstruction[] =>
  instructions.sort(compareByDestination);

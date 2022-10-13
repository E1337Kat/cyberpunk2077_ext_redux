import path from "path";
import * as A from "fp-ts/Array";
import {
  Option,
  some,
  none,
} from "fp-ts/Option";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/function";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
  VortexInstruction,
} from "./vortex-wrapper";
import {
  File,
  FileTree,
  filesUnder,
  findDirectSubdirsWithSome,
  Glob,
  dirInTree,
  fileCount,
  subtreeFrom,
  PathFilter,
  FILETREE_ROOT,
  filesIn,
  FileMove,
} from "./filetree";
import {
  MaybeInstructions,
  NoInstructions,
  AmmLayout,
  InvalidLayout,
  AMM_MOD_CUSTOMS_CANON_DIR,
  AMM_MOD_USERMOD_CANON_DIR,
  AMM_BASEDIR_PATH,
  AMM_MOD_CUSTOMS_DIRNAME,
  AMM_MOD_USERMOD_DIRNAME,
  AMM_MOD_DECOR_CANON_DIR,
  AMM_MOD_LOCATIONS_CANON_DIR,
  AMM_MOD_SCRIPTS_CANON_DIR,
  AMM_MOD_THEMES_CANON_DIR,
  AMM_MOD_CUSTOM_APPEARANCES_CANON_DIR,
  AMM_MOD_APPEARANCES_REQUIRED_MATCHES,
  AMM_MOD_CUSTOM_ENTITIES_CANON_DIR,
  AMM_MOD_CUSTOM_PROPS_CANON_DIR,
  AMM_MOD_DECOR_REQUIRED_KEYS,
  AMM_MOD_ENTITIES_REQUIRED_MATCHES,
  AMM_MOD_LOCATION_REQUIRED_KEYS,
  AMM_MOD_PROPS_REQUIRED_MATCHES,
  AMM_MOD_SCRIPT_REQUIRED_KEYS,
  AMM_MOD_THEME_REQUIRED_KEYS,
} from "./installers.layouts";
import {
  fileFromDisk,
  fileMove,
  fileToInstruction,
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  moveFromTo,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import {
  extraCanonArchiveInstructions,
  extraToplevelArchiveInstructions,
} from "./installer.archive";
import { Features } from "./features";

const matchAmmLua = (filePath: string): boolean => path.extname(filePath) === `.lua`;
const matchAmmJson = (filePath: string): boolean => path.extname(filePath) === `.json`;
const matchAmmExt = (filePath: string): boolean =>
  [`.json`, `.lua`].includes(path.extname(filePath));

const findAmmFiles = (
  ammDir: string,
  kindMatcher: PathFilter,
  fileTree: FileTree,
): string[] =>
  findDirectSubdirsWithSome(ammDir, kindMatcher, fileTree).flatMap((dir) =>
    filesUnder(dir, Glob.Any, fileTree));

const findAmmCanonFiles = (fileTree: FileTree): string[] => [
  ...findAmmFiles(AMM_MOD_CUSTOMS_CANON_DIR, matchAmmLua, fileTree),
  ...findAmmFiles(AMM_MOD_USERMOD_CANON_DIR, matchAmmJson, fileTree),
];

const findAmmToplevelCanonSubdirFiles = (fileTree: FileTree): string[] => [
  ...findAmmFiles(AMM_MOD_CUSTOMS_DIRNAME, matchAmmLua, fileTree),
  ...findAmmFiles(AMM_MOD_USERMOD_DIRNAME, matchAmmJson, fileTree),
];

const detectAmmLayout = (
  ammDir: string,
  kindMatcher: PathFilter,
  fileTree: FileTree,
): boolean => findDirectSubdirsWithSome(ammDir, kindMatcher, fileTree).length > 0;

const detectAmmToplevelCanonSubdirLayout = (fileTree: FileTree): boolean =>
  detectAmmLayout(AMM_MOD_CUSTOMS_DIRNAME, matchAmmLua, fileTree) ||
  detectAmmLayout(AMM_MOD_USERMOD_DIRNAME, matchAmmJson, fileTree);

const ammLuaContentToPath: [RegExp[], string][] = [
  [AMM_MOD_APPEARANCES_REQUIRED_MATCHES, AMM_MOD_CUSTOM_APPEARANCES_CANON_DIR],
  [AMM_MOD_ENTITIES_REQUIRED_MATCHES, AMM_MOD_CUSTOM_ENTITIES_CANON_DIR],
  [AMM_MOD_PROPS_REQUIRED_MATCHES, AMM_MOD_CUSTOM_PROPS_CANON_DIR],
];

const ammJsonContentToPath: [string[], string][] = [
  [AMM_MOD_DECOR_REQUIRED_KEYS, AMM_MOD_DECOR_CANON_DIR],
  [AMM_MOD_LOCATION_REQUIRED_KEYS, AMM_MOD_LOCATIONS_CANON_DIR],
  [AMM_MOD_SCRIPT_REQUIRED_KEYS, AMM_MOD_SCRIPTS_CANON_DIR],
  [AMM_MOD_THEME_REQUIRED_KEYS, AMM_MOD_THEMES_CANON_DIR],
];

const canonPrefixedPathByTypeIfActualAmmMod = (file: File): Option<FileMove> => {
  const kind = path.extname(file.pathOnDisk);

  if (kind === `.json`) {
    const keysInData = Object.keys(JSON.parse(file.content));

    const jsonKeyMatcher = A.findFirstMap<[string[], string], FileMove>(
      ([requiredKeys, canonDirForType]) =>
        (keysInData.length >= requiredKeys.length &&
        requiredKeys.every((key) => keysInData.includes(key))
          ? some(fileMove(canonDirForType, file))
          : none),
    );

    return jsonKeyMatcher(ammJsonContentToPath);
  }

  if (kind === `.lua`) {
    const luaContentMatcher = A.findFirstMap<[RegExp[], string], FileMove>(
      ([requiredMatches, canonDirForType]) =>
        (requiredMatches.every((required) => file.content.match(required))
          ? some(fileMove(canonDirForType, file))
          : none),
    );

    return luaContentMatcher(ammLuaContentToPath);
  }

  return none;
};

//
// Layouts
//

const ammCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonAmmFiles = findAmmCanonFiles(fileTree);

  if (allCanonAmmFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const totalFilesInAmmBasedir = fileCount(subtreeFrom(AMM_BASEDIR_PATH, fileTree));

  if (allCanonAmmFiles.length !== totalFilesInAmmBasedir) {
    api.log(`debug`, `${InstallerType.AMM}: unknown files in a canon layout, conflict`);
    return InvalidLayout.Conflict;
  }

  const ammCanonInstructions = instructionsForSameSourceAndDestPaths(allCanonAmmFiles);

  const allowedArchiveInstructionsIfAny = extraCanonArchiveInstructions(api, fileTree);

  const allInstructions = [
    ...ammCanonInstructions,
    ...allowedArchiveInstructionsIfAny.instructions,
  ];

  return {
    kind: AmmLayout.Canon,
    instructions: allInstructions,
  };
};

const ammToplevelCanonSubdirLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allToplevelCanonSubdirAmmFiles = findAmmToplevelCanonSubdirFiles(fileTree);

  if (allToplevelCanonSubdirAmmFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const ammToplevelCanonSubdirInstructions = instructionsForSourceToDestPairs(
    allToplevelCanonSubdirAmmFiles.map(moveFromTo(FILETREE_ROOT, AMM_BASEDIR_PATH)),
  );

  const allowedArchiveInstructionsIfAny = extraToplevelArchiveInstructions(api, fileTree);

  const allInstructions = [
    ...ammToplevelCanonSubdirInstructions,
    ...allowedArchiveInstructionsIfAny.instructions,
  ];

  return {
    kind: AmmLayout.ToplevelCanonSubdir,
    instructions: allInstructions,
  };
};

const ammToplevelLayout = async (
  api: VortexApi,
  installingDir: string,
  _modName: string,
  fileTree: FileTree,
): Promise<MaybeInstructions> => {
  const allToplevelCandidates: File[] = await pipe(
    filesIn(FILETREE_ROOT, matchAmmExt, fileTree),
    A.traverse(T.ApplicativePar)((filePath) =>
      fileFromDisk({
        pathOnDisk: path.join(installingDir, filePath),
        relativePath: filePath,
      })),
  )();

  const toplevelAmmInstructions: VortexInstruction[] = pipe(
    allToplevelCandidates,
    A.filterMap(canonPrefixedPathByTypeIfActualAmmMod),
    A.map(fileToInstruction),
  );

  if (toplevelAmmInstructions.length < 1) {
    return NoInstructions.NoMatch;
  }

  if (toplevelAmmInstructions.length !== allToplevelCandidates.length) {
    return InvalidLayout.Conflict;
  }

  const allowedArchiveInstructionsIfAny = extraToplevelArchiveInstructions(api, fileTree);

  const allInstructions = [
    ...toplevelAmmInstructions,
    ...allowedArchiveInstructionsIfAny.instructions,
  ];

  return {
    kind: AmmLayout.Toplevel,
    instructions: allInstructions,
  };
};

// testSupport

export const testForAmmMod: V2077TestFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: Features,
): Promise<VortexTestResult> => {
  const looksLikeAmm = dirInTree(AMM_BASEDIR_PATH, fileTree);

  const hasToplevelCanonSubdirAmm = detectAmmToplevelCanonSubdirLayout(fileTree);

  if (looksLikeAmm || hasToplevelCanonSubdirAmm) {
    return Promise.resolve({
      supported: true,
      requiredFiles: [],
    });
  }

  const hasToplevelCandidates = filesIn(FILETREE_ROOT, matchAmmExt, fileTree).length > 0;

  if (!hasToplevelCandidates) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  // Here we actually have to check the contents in testSupport
  // because there are other possible .lua and .json files that
  // could appear toplevel. And then we duplicate this in install..
  const maybeToplevelAmmInstructions = await ammToplevelLayout(
    api,
    modInfo.installingDir.pathOnDisk,
    undefined,
    fileTree,
  );

  const hasToplevelAmmFiles =
    maybeToplevelAmmInstructions !== NoInstructions.NoMatch &&
    maybeToplevelAmmInstructions !== InvalidLayout.Conflict;

  if (hasToplevelAmmFiles) {
    return {
      supported: true,
      requiredFiles: [],
    };
  }

  return { supported: false, requiredFiles: [] };
};

// install

export const installAmmMod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: Features,
): Promise<VortexInstallResult> => {
  const pathBasedMatchInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    [ammCanonLayout, ammToplevelCanonSubdirLayout],
  );

  const selectedInstructions =
    pathBasedMatchInstructions === NoInstructions.NoMatch ||
    pathBasedMatchInstructions === InvalidLayout.Conflict
      ? await ammToplevelLayout(api, modInfo.installingDir.pathOnDisk, undefined, fileTree)
      : pathBasedMatchInstructions;

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(api, InstallerType.AMM, fileTree);
  }

  return Promise.resolve({
    instructions: selectedInstructions.instructions,
  });
};

// For right now, at least, we'll let CET handle AMM mods in MultiType.
// There shouldn't be a pressing reason to have to distinguish them there
// since the layout will be canonical and any special handling applies
// to the entire mod anyway.

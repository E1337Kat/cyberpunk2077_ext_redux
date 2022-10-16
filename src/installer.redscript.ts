import path from "path";
import { Features } from "./features";
import {
  FileTree,
  dirWithSomeIn,
  filesUnder,
  findTopmostSubdirsWithSome,
  Glob,
  FILETREE_ROOT,
  sourcePaths,
} from "./filetree";
import { extraCanonArchiveInstructions } from "./installer.archive";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import {
  REDS_MOD_CANONICAL_PATH_PREFIX,
  MaybeInstructions,
  NoInstructions,
  RedscriptLayout,
  REDS_MOD_CANONICAL_EXTENSION,
  InvalidLayout,
  Instructions,
  NoLayout,
} from "./installers.layouts";
import {
  moveFromTo,
  instructionsForSourceToDestPairs,
  instructionsForSameSourceAndDestPaths,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";

const matchRedscript = (file: string) =>
  path.extname(file) === REDS_MOD_CANONICAL_EXTENSION;

const allRedscriptFiles = (files: string[]): string[] => files.filter(matchRedscript);

const findCanonicalRedscriptDirs = (fileTree: FileTree) =>
  findTopmostSubdirsWithSome(REDS_MOD_CANONICAL_PATH_PREFIX, matchRedscript, fileTree);

export const detectRedscriptBasedirLayout = (fileTree: FileTree): boolean =>
  dirWithSomeIn(REDS_MOD_CANONICAL_PATH_PREFIX, matchRedscript, fileTree);

export const detectRedscriptCanonOnlyLayout = (fileTree: FileTree): boolean =>
  !detectRedscriptBasedirLayout(fileTree) &&
  findCanonicalRedscriptDirs(fileTree).length > 0;

export const detectRedscriptToplevelLayout = (fileTree: FileTree): boolean =>
  !detectRedscriptBasedirLayout(fileTree) &&
  !detectRedscriptCanonOnlyLayout(fileTree) &&
  dirWithSomeIn(FILETREE_ROOT, matchRedscript, fileTree);

//
// Layouts
//

export const redscriptBasedirLayout = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirReds = detectRedscriptBasedirLayout(fileTree);

  if (!hasBasedirReds) {
    api.log(`debug`, `No basedir Redscript files found`);
    return NoInstructions.NoMatch;
  }

  const allBasedirAndSubdirFiles = filesUnder(
    REDS_MOD_CANONICAL_PATH_PREFIX,
    Glob.Any,
    fileTree,
  );

  const modnamedDir = path.join(REDS_MOD_CANONICAL_PATH_PREFIX, modName);

  const allToBasedirWithSubdirAsModname = allBasedirAndSubdirFiles.map(
    moveFromTo(REDS_MOD_CANONICAL_PATH_PREFIX, modnamedDir),
  );

  return {
    kind: RedscriptLayout.Basedir,
    instructions: instructionsForSourceToDestPairs(allToBasedirWithSubdirAsModname),
  };
};

export const redscriptToplevelLayout = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  // .\*.reds
  const hasToplevelReds = detectRedscriptToplevelLayout(fileTree);

  const toplevelReds = hasToplevelReds
    ? filesUnder(FILETREE_ROOT, Glob.Any, fileTree)
    : [];

  if (!hasToplevelReds) {
    return NoInstructions.NoMatch;
  }

  const modnamedDir = path.join(REDS_MOD_CANONICAL_PATH_PREFIX, modName);

  const allToBasedirWithSubdirAsModname = toplevelReds.map(
    moveFromTo(FILETREE_ROOT, modnamedDir),
  );

  return {
    kind: RedscriptLayout.Toplevel,
    instructions: instructionsForSourceToDestPairs(allToBasedirWithSubdirAsModname),
  };
};

export const redscriptCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonRedscriptFiles = findCanonicalRedscriptDirs(fileTree).flatMap(
    (namedSubdir) => filesUnder(namedSubdir, Glob.Any, fileTree),
  );

  if (allCanonRedscriptFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: RedscriptLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonRedscriptFiles),
  };
};

//
// API
//

//
// testSupport
//

export const testForRedscriptMod: V2077TestFunc = async (
  api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const redscriptFiles = allRedscriptFiles(sourcePaths(fileTree));

  if (redscriptFiles.length < 1) {
    return { supported: false, requiredFiles: [] };
  }

  return { supported: true, requiredFiles: [] };
};

//
// install
//

export const installRedscriptMod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: Features,
): Promise<VortexInstallResult> => {
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    modInfo.name,
    fileTree,
    // Order is significant here.
    [redscriptBasedirLayout, redscriptCanonLayout, redscriptToplevelLayout],
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Redscript,
      fileTree,
    );
  }

  const allInstructions = [
    ...selectedInstructions.instructions,
    ...extraCanonArchiveInstructions(api, fileTree).instructions,
  ];

  return Promise.resolve({ instructions: allInstructions });
};

//
// External use for MultiType etc.
//

export const detectAllowedRedscriptLayouts = (fileTree: FileTree): boolean =>
  detectRedscriptBasedirLayout(fileTree) || detectRedscriptCanonOnlyLayout(fileTree);

export const redscriptAllowedInMultiInstructions = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): Instructions => {
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    modName,
    fileTree,
    // Order is significant here.
    [redscriptBasedirLayout, redscriptCanonLayout],
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    api.log(
      `debug`,
      `${InstallerType.Redscript}: No allowed Redscript layouts found (this is ok)`,
    );
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return selectedInstructions;
};

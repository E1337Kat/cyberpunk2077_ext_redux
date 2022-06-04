import path from "path";
import {
  FileTree,
  dirWithSomeIn,
  filesUnder,
  findTopmostSubdirsWithSome,
  Glob,
  FILETREE_ROOT,
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
} from "./installers.layouts";
import {
  moveFromTo,
  instructionsForSourceToDestPairs,
  instructionsForSameSourceAndDestPaths,
  makeSyntheticName,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType } from "./installers.types";
import {
  VortexApi,
  VortexWrappedTestSupportedFunc,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
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
    api.log("debug", "No basedir Redscript files found");
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

export const testForRedscriptMod: VortexWrappedTestSupportedFunc = async (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const redscriptFiles = allRedscriptFiles(files);

  if (redscriptFiles.length < 1) {
    return { supported: false, requiredFiles: [] };
  }

  return { supported: true, requiredFiles: [] };
};

//
// install
//

export const installRedscriptMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const modName = makeSyntheticName(destinationPath);

  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    modName,
    fileTree,
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

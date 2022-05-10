import path from "path";
import {
  FileTree,
  dirWithSomeIn,
  filesUnder,
  Glob,
  findDirectSubdirsWithSome,
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
  LayoutToInstructions,
} from "./installers.layouts";
import {
  moveFromTo,
  instructionsForSourceToDestPairs,
  instructionsForSameSourceAndDestPaths,
  makeSyntheticName,
  useAllMatchingLayouts,
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
  findDirectSubdirsWithSome(REDS_MOD_CANONICAL_PATH_PREFIX, matchRedscript, fileTree);

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
  // eslint-disable-next-line no-underscore-dangle
  const hasToplevelReds = detectRedscriptToplevelLayout(fileTree);

  const toplevelReds = hasToplevelReds
    ? filesUnder(FILETREE_ROOT, Glob.Any, fileTree)
    : [];

  if (!hasToplevelReds) {
    api.log("debug", "No toplevel Redscript files found");
    return NoInstructions.NoMatch;
  }

  // This is maybe slightly annoying to check, but makes
  // logic elsewhere cleaner. I suppose we can decide that
  // layouts need to be robust enough in themselves if they
  // would otherwise depend on some external check that isn't
  // always present.
  //
  // Generally, shouldn't get here.
  //
  const hasBasedirReds = detectRedscriptBasedirLayout(fileTree);

  if (hasBasedirReds) {
    // Errors need to be handled downstream if it's relevant there
    api.log("debug", "No instructions from canon: basedir overrides");
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
    api.log("error", "No canonical Redscript files found.");
    return NoInstructions.NoMatch;
  }

  // This is maybe slightly annoying to check, but makes
  // logic elsewhere cleaner. I suppose we can decide that
  // layouts need to be robust enough in themselves if they
  // would otherwise depend on some external check that isn't
  // always present.
  //
  // Generally, shouldn't get here.
  //
  const hasBasedirReds = detectRedscriptBasedirLayout(fileTree);

  if (hasBasedirReds) {
    // Errors need to be handled downstream if it's relevant there
    api.log("debug", "No instructions from canon: basedir overrides");
    return NoInstructions.NoMatch;
  }

  return {
    kind: RedscriptLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonRedscriptFiles),
  };
};

export const testForRedscriptMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const redscriptFiles = allRedscriptFiles(files);

  log("debug", "redscriptFiles: ", { redscriptFiles });

  // We could do more detection here but the
  // installer will already need to duplicate
  // all that. Maybe just check whether there
  // are any counterindications?
  if (redscriptFiles.length === 0) {
    log("debug", "No Redscripts");
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  log("info", "Matched to Redscript");
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

// Install the Redscript stuff, as well as any archives we find
export const installRedscriptMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  // We could get a lot fancier here, but for now we don't accept
  // subdirectories anywhere other than in a canonical location.

  const modName = makeSyntheticName(destinationPath);

  const allInstructionSets: LayoutToInstructions[] = [
    redscriptToplevelLayout,
    redscriptBasedirLayout,
    redscriptCanonLayout,
  ];

  const allInstructionsPerLayout = useAllMatchingLayouts(
    api,
    modName,
    fileTree,
    allInstructionSets,
  );

  const allInstructionsWeProduced = allInstructionsPerLayout.flatMap(
    (i) => i.instructions,
  );

  const allInstructions = [
    ...allInstructionsWeProduced,
    ...extraCanonArchiveInstructions(api, fileTree).instructions,
  ];

  if (allInstructions.length < 1) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Redscript,
      fileTree,
    );
  }

  api.log(`info`, `${InstallerType.Redscript}: installing`);
  api.log(`debug`, `${InstallerType.Redscript}: instructions:`, allInstructions);

  return Promise.resolve({ instructions: allInstructions });
};

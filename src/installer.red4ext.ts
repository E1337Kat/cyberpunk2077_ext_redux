import path from "path";
import { showRed4ExtReservedDllErrorDialog } from "./dialogs";
import {
  FileTree,
  filesUnder,
  Glob,
  dirWithSomeIn,
  findDirectSubdirsWithSome,
  filesIn,
  FILETREE_ROOT,
  findAllSubdirsWithSome,
  pathInTree,
  fileCount,
} from "./filetree";
import { extraCanonArchiveInstructions } from "./installer.archive";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import {
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS,
  RED4EXT_MOD_CANONICAL_BASEDIR,
  LayoutToInstructions,
  MaybeInstructions,
  NoInstructions,
  Red4ExtLayout,
  InvalidLayout,
  RED4EXT_CORE_RED4EXT_DLL,
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

const matchDll = (file: string) => path.extname(file) === ".dll";
const reservedDllDir = (dir: string) =>
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS.includes(path.join(dir, path.sep));
const reservedDllName = (file: string) =>
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS.includes(path.join(file));

const findBasedirRed4ExtFiles = (fileTree: FileTree) =>
  filesUnder(RED4EXT_MOD_CANONICAL_BASEDIR, Glob.Any, fileTree);

export const detectRed4ExtBasedirLayout = (fileTree: FileTree): boolean =>
  dirWithSomeIn(RED4EXT_MOD_CANONICAL_BASEDIR, matchDll, fileTree);

export const red4extBasedirLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirFiles = detectRed4ExtBasedirLayout(fileTree);

  if (!hasBasedirFiles) {
    return NoInstructions.NoMatch;
  }

  const allFilesUnderBase = findBasedirRed4ExtFiles(fileTree);

  const canonicalModnamedPath = path.join(
    RED4EXT_MOD_CANONICAL_BASEDIR,
    modName,
    path.sep,
  );

  const allFromBaseToModname: string[][] = allFilesUnderBase.map(
    moveFromTo(RED4EXT_MOD_CANONICAL_BASEDIR, canonicalModnamedPath),
  );

  return {
    kind: Red4ExtLayout.Basedir,
    instructions: instructionsForSourceToDestPairs(allFromBaseToModname),
  };
};

const findCanonicalRed4ExtDirs = (fileTree: FileTree) =>
  findDirectSubdirsWithSome(RED4EXT_MOD_CANONICAL_BASEDIR, matchDll, fileTree);

export const detectRed4ExtCanonOnlyLayout = (fileTree: FileTree): boolean =>
  !detectRed4ExtBasedirLayout(fileTree) && findCanonicalRed4ExtDirs(fileTree).length > 0;

export const red4extCanonLayout: LayoutToInstructions = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasCanonFiles = detectRed4ExtCanonOnlyLayout(fileTree);

  if (!hasCanonFiles) {
    return NoInstructions.NoMatch;
  }

  // This is maybe slightly annoying to check, but makes
  // logic elsewhere cleaner. I suppose we can decide that
  // layouts need to be robust enough in themselves if they
  // would otherwise depend on some external check that isn't
  // always present.
  //
  // Generally, we *shouldn't* get here and the problem should
  // have already been detected in test, but..
  //
  const hasBasedirReds = detectRed4ExtBasedirLayout(fileTree);

  if (hasBasedirReds) {
    // Errors need to be handled downstream if it's relevant there
    api.log("debug", "No instructions from canon: basedir overrides");
    return NoInstructions.NoMatch;
  }

  const allCanonFiles = filesUnder(RED4EXT_MOD_CANONICAL_BASEDIR, Glob.Any, fileTree);

  return {
    kind: Red4ExtLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonFiles),
  };
};

const red4extToplevelLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const toplevelFiles = filesIn(FILETREE_ROOT, matchDll, fileTree);

  if (toplevelFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  // No messing about: a DLL at top level means this entire
  // thing has to be part of it. Nothing else allowed.

  const allTheFilesEverywhere = filesUnder(FILETREE_ROOT, Glob.Any, fileTree);

  const canonicalModnamedPath = path.join(RED4EXT_MOD_CANONICAL_BASEDIR, modName);

  const allFilesToCanon = allTheFilesEverywhere.map(
    moveFromTo(FILETREE_ROOT, canonicalModnamedPath),
  );

  return {
    kind: Red4ExtLayout.Toplevel,
    instructions: instructionsForSourceToDestPairs(allFilesToCanon),
  };
};

const red4extModnamedToplevelLayout: LayoutToInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const toplevelSubdirsWithFiles = findDirectSubdirsWithSome(
    FILETREE_ROOT,
    matchDll,
    fileTree,
  );

  if (toplevelSubdirsWithFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  if (toplevelSubdirsWithFiles.length > 1) {
    return InvalidLayout.Conflict;
  }

  const allToBasedirWithSubdirAsModname: string[][] = toplevelSubdirsWithFiles.flatMap(
    (dir) =>
      filesUnder(dir, Glob.Any, fileTree).map(
        moveFromTo(FILETREE_ROOT, RED4EXT_MOD_CANONICAL_BASEDIR),
      ),
  );

  return {
    kind: Red4ExtLayout.Modnamed,
    instructions: instructionsForSourceToDestPairs(allToBasedirWithSubdirAsModname),
  };
};

export const testForRed4ExtMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const allDllSubdirs = findAllSubdirsWithSome(FILETREE_ROOT, matchDll, fileTree);
  const toplevelDlls = filesIn(FILETREE_ROOT, matchDll, fileTree);

  const noDllDirs = allDllSubdirs.length < 1;
  const noToplevelDlls = toplevelDlls.length < 1;

  if (noDllDirs && noToplevelDlls) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const dangerPaths = [
    ...allDllSubdirs.filter(reservedDllDir),
    ...toplevelDlls.filter(reservedDllName),
  ];

  if (dangerPaths.length !== 0) {
    const message = "Red4Ext Mod Installation Canceled, Dangerous DLL paths!";
    log("error", message, dangerPaths);
    showRed4ExtReservedDllErrorDialog(api, message, dangerPaths);
    return Promise.reject(new Error(message));
  }

  // Red4Ext itself handled elsewhere
  if (pathInTree(RED4EXT_CORE_RED4EXT_DLL, fileTree)) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  // Good enough, this is the right installer, more checks in `install`

  return Promise.resolve({ supported: true, requiredFiles: [] });
};

export const installRed4ExtMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const modName = makeSyntheticName(destinationPath);

  // At this point we know from the test that none of
  // these are in dangerous locations

  // Red4Ext only allows one subdir deep for initially loaded DLLs
  // Move to test?

  // ...And is it a good idea to allow more than one canon subdir?
  const possibleLayoutsToTryInOrder: LayoutToInstructions[] = [
    red4extBasedirLayout,
    red4extCanonLayout,
    red4extToplevelLayout,
    red4extModnamedToplevelLayout,
  ];

  const chosenInstructions = useFirstMatchingLayoutForInstructions(
    api,
    modName,
    fileTree,
    possibleLayoutsToTryInOrder,
  );

  if (chosenInstructions === NoInstructions.NoMatch) {
    const message = "Red4Ext installer failed to generate any instructions!";
    log("error", message, files);
    return Promise.reject(new Error(message));
  }

  if (chosenInstructions === InvalidLayout.Conflict) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Red4Ext,
      fileTree,
    );
  }

  const extraArchiveLayoutsAllowed = chosenInstructions.kind !== Red4ExtLayout.Toplevel;

  const allInstructions = extraArchiveLayoutsAllowed
    ? [
        ...chosenInstructions.instructions,
        ...extraCanonArchiveInstructions(api, fileTree).instructions,
      ]
    : chosenInstructions.instructions;

  const haveFilesOutsideSelectedInstructions =
    allInstructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Red4Ext,
      fileTree,
    );
  }

  log("info", "Red4Ext installer installing files.");
  log("debug", "Red4Ext instructions: ", allInstructions);

  return Promise.resolve({ instructions: allInstructions });
};

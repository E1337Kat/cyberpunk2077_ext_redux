import path from "path";
import {
  FileTree,
  findDirectSubdirsWithSome,
  filesUnder,
  Glob,
  FILETREE_ROOT,
  sourcePaths,
  dirWithSomeIn,
} from "./filetree";
import {
  REDMOD_CANONICAL_INFO_FILE,
  MaybeInstructions,
  NoInstructions,
  REDmodLayout,
  Instructions,
  InvalidLayout,
  NoLayout,
  REDMOD_CANONICAL_BASEDIR,
} from "./installers.layouts";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  moveFromTo,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import {
  VortexApi,
  VortexWrappedTestSupportedFunc,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexInstallResult,
} from "./vortex-wrapper";
import { InstallerType } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";

// REDmod
//
// REDmod type mods are detected by:
//
// Canonical:
//  - .\mods\MODNAME\info.json
//
// Fixable: no

const matchREDmodInfoJson = (f: string): boolean =>
  path.basename(f) === REDMOD_CANONICAL_INFO_FILE;

const findBasedirREDmodDirs = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(FILETREE_ROOT, matchREDmodInfoJson, fileTree);

const findCanonicalREDmodDirs = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(REDMOD_CANONICAL_BASEDIR, matchREDmodInfoJson, fileTree);

export const detectCanonREDmodLayout = (fileTree: FileTree): boolean =>
  !detectCanonREDmodLayout(fileTree) &&
  findBasedirREDmodDirs(fileTree).length > 0;

export const detectBasedirREDmodLayout = (fileTree: FileTree): boolean =>
  findCanonicalREDmodDirs(fileTree).length > 0;

export const testForREDmod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const hasREDmodFilesInANamedModDir = dirWithSomeIn(FILETREE_ROOT, matchREDmodInfoJson, fileTree);

  if (!hasREDmodFilesInANamedModDir) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  log(`info`, `Matching REDmod installer: ${hasREDmodFilesInANamedModDir}`);

  return Promise.resolve({
    supported: hasREDmodFilesInANamedModDir,
    requiredFiles: [],
  });
};

export const basedirREDmodLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirREDmods = detectBasedirREDmodLayout(fileTree);

  if (!hasBasedirREDmods) {
    api.log(`debug`, `No Basedirical REDmod files found`);
    return NoInstructions.NoMatch;
  }

  const allBasedirREDmodFiles = findBasedirREDmodDirs(fileTree).flatMap(
    (namedSubdir) => filesUnder(namedSubdir, Glob.Any, fileTree),
  );

  if (allBasedirREDmodFiles.length > 1) {
    return InvalidLayout.Conflict;
  }

  const allToBasedirWithSubdirAsModname: string[][] = allBasedirREDmodFiles.flatMap(
    (dir) =>
      filesUnder(dir, Glob.Any, fileTree).map(
        moveFromTo(FILETREE_ROOT, REDMOD_CANONICAL_BASEDIR),
      ),
  );

  return {
    kind: REDmodLayout.Basedir,
    instructions: instructionsForSourceToDestPairs(allToBasedirWithSubdirAsModname),
  };
};

export const canonREDmodLayout = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasCanonREDmods = detectCanonREDmodLayout(fileTree);

  if (!hasCanonREDmods) {
    api.log(`debug`, `No Canon REDmod files found`);
    return NoInstructions.NoMatch;
  }

  const allCanonAndSubdirFiles = findCanonicalREDmodDirs(fileTree).flatMap(
    (namedSubdir) => filesUnder(namedSubdir, Glob.Any, fileTree),
  );

  return {
    kind: REDmodLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonAndSubdirFiles),
  };
};

export const redmodInstructions = async (
  api: VortexApi,
  fileTree: FileTree,
): Promise<Instructions> => {
  const allPossibleRedmodLayouts = [
    basedirREDmodLayout,
    canonREDmodLayout,
  ];
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleRedmodLayouts,
  );
  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    //
    const errorMessage = `Didn't Find Expected REDmod Installation!`;
    api.log(
      `error`,
      `${InstallerType.REDmod}: ${errorMessage}`,
      sourcePaths(fileTree),
    );
    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.REDmod,
      errorMessage,
      sourcePaths(fileTree),
    );
    return ({ kind: NoLayout.Optional, instructions: [] });
  }

  return selectedInstructions;
};

// Install the REDmod stuff, as well as any archives we find
export const installREDmod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  //
  const selectedInstructions = await redmodInstructions(
    api,
    fileTree,
  );

  const instructions = [
    ...selectedInstructions.instructions,
  ];

  return Promise.resolve({ instructions });
};

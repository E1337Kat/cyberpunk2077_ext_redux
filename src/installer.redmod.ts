import path from "path";
import {
  FileTree, findDirectSubdirsWithSome, filesUnder, Glob, FILETREE_ROOT, sourcePaths,
} from "./filetree";
import {
  REDMOD_CANONICAL_INFO_FILE,
  REDMOD_CANONICAL_PATH_PREFIX,
  MaybeInstructions,
  NoInstructions,
  REDmodLayout,
  Instructions,
  InvalidLayout,
  NoLayout,
  REDMOD_CANONICAL_BASEDIR,
} from "./installers.layouts";
import { instructionsForSourceToDestPairs, moveFromTo, useFirstMatchingLayoutForInstructions } from "./installers.shared";
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
//  - .\MODNAME\info.json
//
// Fixable: no

const matchREDmodInfoJson = (f: string): boolean =>
  path.basename(f) === REDMOD_CANONICAL_INFO_FILE;

const findCanonicalREDmodDirs = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(REDMOD_CANONICAL_PATH_PREFIX, matchREDmodInfoJson, fileTree);

export const detectCanonREDmodLayout = (fileTree: FileTree): boolean =>
  findCanonicalREDmodDirs(fileTree).length > 0;

export const testForREDmod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const hasREDmodFilesInANamedModDir = detectCanonREDmodLayout(fileTree);

  if (!hasREDmodFilesInANamedModDir) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  log(`info`, `Matching REDmod installer: ${hasREDmodFilesInANamedModDir}`);

  return Promise.resolve({
    supported: hasREDmodFilesInANamedModDir,
    requiredFiles: [],
  });
};

export const canonREDmodLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonREDmodFiles = findCanonicalREDmodDirs(fileTree).flatMap((namedSubdir) =>
    filesUnder(namedSubdir, Glob.Any, fileTree));

  if (allCanonREDmodFiles.length < 1) {
    api.log(`debug`, `No canonical REDmod files found.`);
    return NoInstructions.NoMatch;
  }

  const allToRootModirWithSubdirAsModname = allCanonREDmodFiles.map(
    moveFromTo(FILETREE_ROOT, REDMOD_CANONICAL_BASEDIR),
  );

  return {
    kind: REDmodLayout.Canon,
    instructions: instructionsForSourceToDestPairs(allToRootModirWithSubdirAsModname),
  };
};

export const canonRedmodInstructions = async (
  api: VortexApi,
  fileTree: FileTree,
): Promise<Instructions> => {
  const allPossibleRedmodLayouts = [
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
  const selectedInstructions = await canonRedmodInstructions(
    api,
    fileTree,
  );

  const instructions = [
    ...selectedInstructions.instructions,
  ];

  return Promise.resolve({ instructions });
};

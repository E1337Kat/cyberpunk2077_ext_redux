import * as RA from 'fp-ts/ReadonlyArray';
import { pipe } from 'fp-ts/function';
import {
  FileTree,
  sourcePaths,
  pathInTree,
  filesUnder,
  FILETREE_ROOT,
  Glob,
} from "./filetree";
import {
  CoreRed4ExtLayout,
  CORE_RED4EXT_DEPRECATED_FILES,
  CORE_RED4EXT_FILES,
  CORE_RED4EXT_GENERATED_DIRS,
  InvalidLayout,
  Layout,
  MaybeInstructions,
  NoInstructions,
} from "./installers.layouts";
import { InstallerType } from "./installers.types";
import {
  showWarningForDeprecatedMod,
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";
import {
  VortexWrappedTestSupportedFunc,
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexProgressDelegate,
} from "./vortex-wrapper";
import { instructionsForSameSourceAndDestPaths, instructionsToGenerateDirs, useFirstMatchingLayoutForInstructions } from './installers.shared';

const detectCoreRed4extLayout = (fileTree: FileTree): boolean =>
  pipe(
    CORE_RED4EXT_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectCoreRed4extDeprecatedLayout = (fileTree: FileTree): boolean =>
  pipe(
    CORE_RED4EXT_DEPRECATED_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectCoreRed4ext = (fileTree: FileTree): boolean =>
  detectCoreRed4extLayout(fileTree) || detectCoreRed4extDeprecatedLayout(fileTree);

const layout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
  layoutType: Layout,
  layoutMatcher: (fileTree: FileTree) => boolean,
): MaybeInstructions => {
  //
  if (!layoutMatcher(fileTree)) {
    return NoInstructions.NoMatch;
  }

  const allProvidedFiles = filesUnder(FILETREE_ROOT, Glob.Any, fileTree);

  const fileInstructions =
    instructionsForSameSourceAndDestPaths(allProvidedFiles);

  const generatedInstructions =
    instructionsToGenerateDirs(CORE_RED4EXT_GENERATED_DIRS);

  const allInstructions = [...fileInstructions, ...generatedInstructions];

  return {
    kind: layoutType,
    instructions: allInstructions,
  };
};

//
// Layouts
//

const coreRed4extLayout = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(api, modName, fileTree, CoreRed4ExtLayout.OnlyValid, detectCoreRed4extLayout);

const coreRed4extDeprecatedLayout = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(api, modName, fileTree, CoreRed4ExtLayout.Deprecated, detectCoreRed4extDeprecatedLayout);

//
// Vortex API
//

// testSupport

export const testForCoreRed4ext: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreRed4ext(fileTree), requiredFiles: [] });

// install

export const installCoreRed4ext: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  //
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    [coreRed4extLayout, coreRed4extDeprecatedLayout],
  );

  if (selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict) {
    //
    const errorMessage = `Didn't Find Expected Core RED4ext Installation!`;
    api.log(
      `error`,
      `${InstallerType.CoreRed4ext}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreRed4ext,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  if (selectedInstructions.kind === CoreRed4ExtLayout.Deprecated) {
    const infoMessage = `Old RED4ext version!`;
    api.log(`info`, `${InstallerType.CoreRed4ext}: ${infoMessage} Installing mod with warning.`);
    showWarningForDeprecatedMod(api, InstallerType.CoreRed4ext, infoMessage);
  }

  return Promise.resolve({ instructions: selectedInstructions.instructions });
};

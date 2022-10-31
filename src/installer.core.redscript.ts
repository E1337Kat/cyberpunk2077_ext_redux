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
  CoreRedscriptLayout,
  DEPRECATED_REDSCRIPT_CORE_REQUIRED_FILES,
  InvalidLayout,
  Layout,
  MaybeInstructions,
  NoInstructions,
  REDSCRIPT_CORE_REQUIRED_FILES,
} from "./installers.layouts";
import {
  InstallDecision,
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  VortexApi,
  VortexTestResult,
} from "./vortex-wrapper";
import {
  instructionsForSameSourceAndDestPaths,
  useFirstMatchingLayoutForInstructions,
} from './installers.shared';
import {
  promptUserToInstallOrCancelOnDeprecatedCoreMod,
  showWarningForUnrecoverableStructureError,
} from './ui.dialogs';
import { FeatureSet } from './features';

// Recognizers

const detectCoreRedscriptLayout = (fileTree: FileTree): boolean =>
  pipe(
    REDSCRIPT_CORE_REQUIRED_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectDeprecatedCoreRedscriptLayout = (fileTree: FileTree): boolean =>
  pipe(
    DEPRECATED_REDSCRIPT_CORE_REQUIRED_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectCoreRedscript = (fileTree: FileTree): boolean =>
  detectCoreRedscriptLayout(fileTree) || detectDeprecatedCoreRedscriptLayout(fileTree);

//
// Layouts
//

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

  return {
    kind: layoutType,
    instructions: fileInstructions,
  };
};

const coreRedscriptLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(_api, _modName, fileTree, CoreRedscriptLayout.OnlyValid, detectCoreRedscriptLayout);

const deprecatedCoreRedscriptLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(_api, _modName, fileTree, CoreRedscriptLayout.Deprecated, detectDeprecatedCoreRedscriptLayout);

//
// Vortex API
//

// testSupported

export const testForCoreRedscript: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({
    supported: detectCoreRedscript(fileTree),
    requiredFiles: [],
  });

// install

export const installCoreRedscript: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => {
  //
  const me = InstallerType.CoreRedscript;

  const allPossibleCoreRedscriptLayouts = [
    coreRedscriptLayout,
    deprecatedCoreRedscriptLayout,
  ];

  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleCoreRedscriptLayouts,
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    //
    const errorMessage = `Didn't Find Expected Core Redscript Installation!`;
    api.log(
      `error`,
      `${me}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      me,
      errorMessage,
      sourcePaths(fileTree),
    );
    return Promise.reject(errorMessage);
  }

  // This would work better as a pipeline. Needs refactoring.
  // `generateInstructions
  //   |> checkForProblems
  //   |> checkDeprecated
  //   |> finalizeInstructions
  //  `
  if (selectedInstructions.kind === CoreRedscriptLayout.Deprecated) {
    const infoMessage = `Deprecated Core Redscript version! Prompting user to install or cancel.`;
    api.log(`info`, `${me}: ${infoMessage}`);

    const userDecision = await promptUserToInstallOrCancelOnDeprecatedCoreMod(
      api,
      me,
      filesUnder(FILETREE_ROOT, Glob.Any, fileTree),
    );

    if (userDecision === InstallDecision.UserWantsToCancel) {
      const cancelMessage = `${me}: user chose to cancel installing deprecated version`;

      api.log(`warn`, cancelMessage);
      return Promise.reject(new Error(cancelMessage));
    }

    api.log(`info`, `${me}: User confirmed installing deprecated version`);
  }

  return {
    instructions: selectedInstructions.instructions,
  };
};

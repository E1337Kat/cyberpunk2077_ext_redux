import * as RA from 'fp-ts/ReadonlyArray';
import { pipe } from 'fp-ts/function';
import {
  FileTree,
  sourcePaths,
  pathInTree,
  filesUnder,
  FILETREE_ROOT,
  Glob,
  fileTreeFromPaths,
} from "./filetree";
import {
  CoreRed4extLayout,
  CORE_RED4EXT_GENERATED_DIRS,
  DEPRECATED_RED4EXT_CORE_REQUIRED_FILES,
  Instructions,
  InvalidLayout,
  Layout,
  MaybeInstructions,
  NoInstructions,
  NoLayout,
  RED4EXT_CORE_ONE_NINE_REQUIRED_FILES,
  RED4EXT_CORE_ONE_SEVEN_REQUIRED_FILES,
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
  instructionsToGenerateDirs,
  useFirstMatchingLayoutForInstructions,
} from './installers.shared';
import {
  promptUserToInstallOrCancelOnDeprecatedCoreMod,
  showWarningForUnrecoverableStructureError,
} from './ui.dialogs';
import { Features } from './features';

// Recognizers

const detectCoreRed4extOneSevenLayout = (fileTree: FileTree): boolean =>
  pipe(
    RED4EXT_CORE_ONE_SEVEN_REQUIRED_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectDeprecatedCoreRed4extLayout = (fileTree: FileTree): boolean =>
  pipe(
    DEPRECATED_RED4EXT_CORE_REQUIRED_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectCoreRed4extOneNineLayout = (fileTree: FileTree): boolean =>
  pipe(
    RED4EXT_CORE_ONE_NINE_REQUIRED_FILES,
    RA.every(
      (requiredFile) => pathInTree(requiredFile, fileTree),
    ),
  );

const detectCoreRed4ext = (fileTree: FileTree): boolean =>
  detectCoreRed4extOneNineLayout(fileTree) ||
  detectCoreRed4extOneSevenLayout(fileTree) ||
  detectDeprecatedCoreRed4extLayout(fileTree);

export const testRed4ExtCore: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({
    supported: detectCoreRed4ext(fileTree),
    requiredFiles: [],
  });

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

  const generatedInstructions =
    instructionsToGenerateDirs(CORE_RED4EXT_GENERATED_DIRS);

  const allInstructions = [...fileInstructions, ...generatedInstructions];

  return {
    kind: layoutType,
    instructions: allInstructions,
  };
};

const coreRed4extOneSevenLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(_api, _modName, fileTree, CoreRed4extLayout.OneSeven, detectCoreRed4extOneSevenLayout);

const deprecatedCoreRed4ExtLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(_api, _modName, fileTree, CoreRed4extLayout.Deprecated, detectDeprecatedCoreRed4extLayout);

const coreRed4extOneNineLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions =>
  layout(_api, _modName, fileTree, CoreRed4extLayout.OneNine, detectCoreRed4extOneNineLayout);

// Prompts

const warnUserIfDeprecatedRed4ext = async (
  api: VortexApi,
  chosenInstructions: Instructions,
): Promise<InstallDecision> => {
  // Trying out the tree-based approach..
  const destinationPaths = chosenInstructions.instructions.map((i) => i.destination);
  const newTree = fileTreeFromPaths(destinationPaths);

  const containsDeprecatedRed4ExtPaths = DEPRECATED_RED4EXT_CORE_REQUIRED_FILES.every((red4extPath) =>
    filesUnder(FILETREE_ROOT, Glob.Any, newTree).includes(red4extPath));

  if (containsDeprecatedRed4ExtPaths) {
    return promptUserToInstallOrCancelOnDeprecatedCoreMod(
      api,
      InstallerType.CoreRed4ext,
      filesUnder(FILETREE_ROOT, Glob.Any, newTree),
    );
  }

  return InstallDecision.UserWantsToProceed;
};

export const coreRed4extInstructions = async (
  api: VortexApi,
  fileTree: FileTree,
): Promise<Instructions> => {
  const allPossibleCoreRed4extLayouts = [
    coreRed4extOneNineLayout,
    coreRed4extOneSevenLayout,
    deprecatedCoreRed4ExtLayout,
  ];
  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleCoreRed4extLayouts,
  );
  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
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
    return ({ kind: NoLayout.Optional, instructions: [] });
  }

  if (selectedInstructions.kind === CoreRed4extLayout.Deprecated) {
    const infoMessage = `Old RED4ext version!`;
    api.log(`info`, `${InstallerType.CoreRed4ext}: ${infoMessage} Confirming installation.`);

    const confirmedInstructions = await warnUserIfDeprecatedRed4ext(api, selectedInstructions);

    if (confirmedInstructions === InstallDecision.UserWantsToCancel) {
      const cancelMessage = `${InstallerType.CoreRed4ext}: user chose to cancel installing deprecated version`;

      api.log(`warn`, cancelMessage);
      return Promise.reject(new Error(cancelMessage));
    }

    api.log(
      `info`,
      `${InstallerType.ConfigXml}: User confirmed installing deprecated version`,
    );
  }

  return selectedInstructions;
};

// install

export const installRed4ExtCore: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: Features,
) => {
  //
  const selectedInstructions = await coreRed4extInstructions(
    api,
    fileTree,
  );

  return Promise.resolve({ instructions: selectedInstructions.instructions });
};

import {
  VortexApi,
  VortexTestResult,
} from "./vortex-wrapper";
import {
  FileTree,
  pathInTree,
  sourcePaths,
} from "./filetree";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";
import {
  AUDIOWARE_CORE_FILES,
  AUDIOWARE_MOD_CANONICAL_PATH_PREFIX,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsToGenerateDirs,
} from "./installers.shared";


const findCoreAudiowareFiles = (fileTree: FileTree): string[] =>
  AUDIOWARE_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreAudioware = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreAudiowareFiles(fileTree).length > 0;

export const testForCoreAudioware: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreAudioware(fileTree), requiredFiles: [] });

export const installCoreAudioware: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => {
  if (findCoreAudiowareFiles(fileTree).length !== AUDIOWARE_CORE_FILES.length) {
    const errorMessage = `Didn't Find Expected Audioware Installation!`;
    api.log(
      `error`,
      `${InstallerType.Audioware}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreAudioware,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  const coreAudiowareInstructions = [
    ...instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
    ...instructionsToGenerateDirs([AUDIOWARE_MOD_CANONICAL_PATH_PREFIX]),
  ];

  return Promise.resolve({ instructions: coreAudiowareInstructions });
};

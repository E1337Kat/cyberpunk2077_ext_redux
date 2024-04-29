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
  TWEAK_XL_CORE_FILES,
  TWEAK_XL_MOD_CANONICAL_PATH_PREFIX,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsToGenerateDirs,
} from "./installers.shared";


const findCoreTweakXLFiles = (fileTree: FileTree): string[] =>
  TWEAK_XL_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreTweakXL = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreTweakXLFiles(fileTree).length > 0;

export const testForCoreTweakXL: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreTweakXL(fileTree), requiredFiles: [] });

export const installCoreTweakXL: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => {
  if (findCoreTweakXLFiles(fileTree).length !== TWEAK_XL_CORE_FILES.length) {
    const errorMessage = `Didn't Find Expected TweakXL Installation!`;
    api.log(
      `error`,
      `${InstallerType.CoreTweakXL}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreTweakXL,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  const coreTweakXLInstructions = [
    ...instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
    ...instructionsToGenerateDirs([TWEAK_XL_MOD_CANONICAL_PATH_PREFIX]),
  ];

  return Promise.resolve({ instructions: coreTweakXLInstructions });
};

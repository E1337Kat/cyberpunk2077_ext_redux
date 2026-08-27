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
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  TWEAK_XL_CORE_IDENTIFIER,
  TWEAK_XL_MOD_CANONICAL_PATH_PREFIX,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsToGenerateDirs,
} from "./installers.shared";


const detectCoreTweakXL = (fileTree: FileTree): boolean =>
  pathInTree(TWEAK_XL_CORE_IDENTIFIER, fileTree);

export const testForCoreTweakXL: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreTweakXL(fileTree), requiredFiles: [] });

// Whatever this release of TweakXL ships is what gets installed, plus the
// directory tweak mods will want to write into.
export const installCoreTweakXL: V2077InstallFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => Promise.resolve({
  instructions: [
    ...instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
    ...instructionsToGenerateDirs([TWEAK_XL_MOD_CANONICAL_PATH_PREFIX]),
  ],
});

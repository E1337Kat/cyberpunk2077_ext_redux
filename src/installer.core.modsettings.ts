
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
  MOD_SETTINGS_CORE_IDENTIFIER,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
} from "./installers.shared";


const detectCoreModSettings = (fileTree: FileTree): boolean =>
  pathInTree(MOD_SETTINGS_CORE_IDENTIFIER, fileTree);


// test

export const testForCoreModSettings: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreModSettings(fileTree), requiredFiles: [] });


// install

// Whatever this release of Mod Settings ships is what gets installed.
export const installCoreModSettings: V2077InstallFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => Promise.resolve({
  instructions: instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
});

import { FeatureSet } from "./features";
import {
  FileTree,
  pathInTree,
  sourcePaths,
} from "./filetree";
import {
  AMM_CORE_IDENTIFIER,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import {
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  VortexApi,
  VortexTestResult,
} from "./vortex-wrapper";

const detectCoreAmm = (fileTree: FileTree): boolean =>
  pathInTree(AMM_CORE_IDENTIFIER, fileTree);

export const testForCoreAmm: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreAmm(fileTree), requiredFiles: [] });

// Whatever this release of AMM ships is what gets installed.
export const installCoreAmm: V2077InstallFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => Promise.resolve({
  instructions: instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
});

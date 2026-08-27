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
  ARCHIVE_XL_CORE_IDENTIFIER,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
} from "./installers.shared";

const detectCoreArchiveXL = (fileTree: FileTree): boolean =>
  pathInTree(ARCHIVE_XL_CORE_IDENTIFIER, fileTree);

export const testForCoreArchiveXL: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreArchiveXL(fileTree), requiredFiles: [] });

// Whatever this release of ArchiveXL ships is what gets installed.
export const installCoreArchiveXL: V2077InstallFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => Promise.resolve({
  instructions: instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
});

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
  AUDIOWARE_CORE_IDENTIFIER,
  AUDIOWARE_MOD_CANONICAL_PATH_PREFIX,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsToGenerateDirs,
} from "./installers.shared";


const detectCoreAudioware = (fileTree: FileTree): boolean =>
  pathInTree(AUDIOWARE_CORE_IDENTIFIER, fileTree);

export const testForCoreAudioware: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreAudioware(fileTree), requiredFiles: [] });

// Whatever this release of Audioware ships is what gets installed, plus the
// directory audio mods will want to write into.
export const installCoreAudioware: V2077InstallFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => Promise.resolve({
  instructions: [
    ...instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
    ...instructionsToGenerateDirs([AUDIOWARE_MOD_CANONICAL_PATH_PREFIX]),
  ],
});

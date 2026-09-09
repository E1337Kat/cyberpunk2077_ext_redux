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
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  INPUT_LOADER_CORE_IDENTIFIER,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";
import {
  instructionsForSameSourceAndDestPaths,
  instructionsToGenerateDirs,
} from "./installers.shared";


const detectCoreInputLoader = (fileTree: FileTree): boolean =>
  pathInTree(INPUT_LOADER_CORE_IDENTIFIER, fileTree);


// test

export const testForCoreInputLoader: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreInputLoader(fileTree), requiredFiles: [] });


// install

// Whatever this release of Input Loader ships is what gets installed, plus the
// directory input mods drop their mappings into.
export const installCoreInputLoader: V2077InstallFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => Promise.resolve({
  instructions: [
    ...instructionsForSameSourceAndDestPaths(sourcePaths(fileTree)),
    ...instructionsToGenerateDirs([CONFIG_XML_MOD_MERGEABLE_BASEDIR]),
  ],
});

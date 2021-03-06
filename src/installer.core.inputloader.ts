import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexProgressDelegate,
  VortexInstruction,
} from "./vortex-wrapper";
import { FileTree, fileCount, pathInTree, sourcePaths } from "./filetree";
import { InstallerType } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";
import {
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  INPUT_LOADER_CORE_FILES,
} from "./installers.layouts";

const CoreInputLoaderInstructions: VortexInstruction[] = [
  {
    type: `generatefile`,
    data: `[Player/Input]\n`,
    destination: `engine\\config\\platform\\pc\\input_loader.ini`,
  },
  {
    type: `mkdir`,
    destination: CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader\\input_loader.dll`,
    destination: `red4ext\\plugins\\input_loader\\input_loader.dll`,
  },
];

const findCoreInputLoaderFiles = (fileTree: FileTree): string[] =>
  INPUT_LOADER_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreInputLoader = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreInputLoaderFiles(fileTree).length > 0;

export const testForCoreInputLoader: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreInputLoader(fileTree), requiredFiles: [] });

export const installCoreInputLoader: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  if (
    fileCount(fileTree) !== INPUT_LOADER_CORE_FILES.length ||
    findCoreInputLoaderFiles(fileTree).length !== fileCount(fileTree)
  ) {
    const errorMessage = `Didn't Find Expected Input Loader Installation!`;
    api.log(
      `error`,
      `${InstallerType.CoreInputLoader}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreInputLoader,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  return Promise.resolve({ instructions: CoreInputLoaderInstructions });
};

import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,

  VortexProgressDelegate,
  VortexInstruction,
} from "./vortex-wrapper";
import {
  FileTree,
  fileCount,
  pathInTree,
  sourcePaths,
} from "./filetree";
import { InstallerType, V2077InstallFunc, V2077TestFunc } from "./installers.types";
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
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader\\inputUserMappings.xml`,
    destination: `red4ext\\plugins\\input_loader\\inputUserMappings.xml`,
  },
];

const findCoreInputLoaderFiles = (fileTree: FileTree): string[] =>
  INPUT_LOADER_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreInputLoader = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreInputLoaderFiles(fileTree).length > 0;

export const testForCoreInputLoader: V2077TestFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreInputLoader(fileTree), requiredFiles: [] });

export const installCoreInputLoader: V2077InstallFunc = async (
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

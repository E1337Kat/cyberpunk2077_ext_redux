import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import {
  fileCount,
  filesUnder,
  FileTree,
  Glob,
  pathInTree,
  sourcePaths,
} from "./filetree";
import {
  CYBERMOD_CORE_ASI,
  CYBERMOD_CORE_CETBASEDIR,
  CYBERMOD_CORE_CPSTYLING_PLUGINDIR,
  CYBERMOD_CORE_REQUIRED_FILES,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { InstallerType } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";

const detectCoreCyberMod = (fileTree: FileTree): boolean =>
  CYBERMOD_CORE_REQUIRED_FILES.some((requiredFile) => pathInTree(requiredFile, fileTree));

export const testForCoreCyberMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreCyberMod(fileTree), requiredFiles: [] });

export const installCoreCyberMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const allCoreCyberModFiles = [
    CYBERMOD_CORE_ASI,
    ...filesUnder(CYBERMOD_CORE_CETBASEDIR, Glob.Any, fileTree),
    ...filesUnder(CYBERMOD_CORE_CPSTYLING_PLUGINDIR, Glob.Any, fileTree),
  ];

  const missingRequiredCoreCyberModFiles = !CYBERMOD_CORE_REQUIRED_FILES.every(
    (requiredFile) => pathInTree(requiredFile, fileTree),
  );

  const filesOutsideKnownDirs = allCoreCyberModFiles.length !== fileCount(fileTree);

  if (missingRequiredCoreCyberModFiles || filesOutsideKnownDirs) {
    const errorMessage = missingRequiredCoreCyberModFiles
      ? `Didn't find all required CyberScript files!`
      : `Found files outside known CyberScript directories!`;

    api.log(
      `error`,
      `${InstallerType.CoreCyberMod}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreCyberMod,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  const allCoreCyberModInstructions =
    instructionsForSameSourceAndDestPaths(allCoreCyberModFiles);

  return Promise.resolve({ instructions: allCoreCyberModInstructions });
};

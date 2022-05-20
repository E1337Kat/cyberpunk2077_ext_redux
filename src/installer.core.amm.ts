import { FileTree, pathInTree, fileCount, sourcePaths } from "./filetree";
import { InstallerType } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";
import { VortexWrappedTestSupportedFunc, VortexApi, VortexLogFunc, VortexTestResult, VortexWrappedInstallFunc, VortexProgressDelegate } from "./vortex-wrapper";

const findCoreAmmFiles = (fileTree: FileTree): string[] =>
  AMM_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreAmm = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreAmmFiles(fileTree).length > 0;

export const testForCoreAmm: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreAmm(fileTree), requiredFiles: [] });

export const installCoreAmm: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  if (
    fileCount(fileTree) !== AMM_CORE_FILES.length ||
    findCoreAmmFiles(fileTree).length !== fileCount(fileTree)
  ) {
    const errorMessage = `Didn't Find Expected TweakXL Installation!`;
    api.log(
      `error`,
      `${InstallerType.CoreAmm}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreAmm,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  return Promise.resolve({ instructions: coreAmmInstructions });
};

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
import { showWarningForUnrecoverableStructureError } from "./dialogs";
import { ARCHIVE_XL_CORE_FILES } from "./installers.layouts";

const coreArchiveXLInstructions: VortexInstruction[] = [
  {
    type: `copy`,
    source: `red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`,
    destination: `red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`,
  },
];

const findCoreArchiveXLFiles = (fileTree: FileTree): string[] =>
  ARCHIVE_XL_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreArchiveXL = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreArchiveXLFiles(fileTree).length > 0;

export const testForCoreArchiveXL: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreArchiveXL(fileTree), requiredFiles: [] });

export const installCoreArchiveXL: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  if (
    fileCount(fileTree) !== ARCHIVE_XL_CORE_FILES.length ||
    findCoreArchiveXLFiles(fileTree).length !== fileCount(fileTree)
  ) {
    const errorMessage = `Didn't Find Expected ArchiveXL Installation!`;
    api.log(
      `error`,
      `${InstallerType.CoreArchiveXL}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreArchiveXL,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  return Promise.resolve({ instructions: coreArchiveXLInstructions });
};

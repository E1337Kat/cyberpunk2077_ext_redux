import {
  FileTree,
  pathInTree,
  fileCount,
  sourcePaths,
  Glob,
  filesUnder,
  filesIn,
} from "./filetree";
import {
  AMM_BASEDIR_PATH,
  AMM_CORE_REQUIRED_PATHS,
  ARCHIVE_MOD_CANONICAL_PREFIX,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { InstallerType, V2077InstallFunc, V2077TestFunc } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";
import {

  VortexApi,
  VortexLogFunc,
  VortexTestResult,

  VortexProgressDelegate,
} from "./vortex-wrapper";

const findRequiredCoreAmmFiles = (fileTree: FileTree): string[] =>
  AMM_CORE_REQUIRED_PATHS.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const findAllCoreAmmFiles = (fileTree: FileTree): string[] => [
  ...filesUnder(AMM_BASEDIR_PATH, Glob.Any, fileTree),
  ...filesIn(ARCHIVE_MOD_CANONICAL_PREFIX, Glob.Any, fileTree),
];

const detectCoreAmm = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  AMM_CORE_REQUIRED_PATHS.some((requiredFile) => pathInTree(requiredFile, fileTree));

export const testForCoreAmm: V2077TestFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreAmm(fileTree), requiredFiles: [] });

export const installCoreAmm: V2077InstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  const allCoreAmmFiles = findAllCoreAmmFiles(fileTree);

  const missingRequiredCoreAmmFiles =
    findRequiredCoreAmmFiles(fileTree).length < AMM_CORE_REQUIRED_PATHS.length;

  const hasExtraFiles = allCoreAmmFiles.length > fileCount(fileTree);

  if (missingRequiredCoreAmmFiles || hasExtraFiles) {
    const errorMessage = `Didn't Find Expected AMM Installation!`;
    api.log(`error`, `${InstallerType.CoreAmm}: ${errorMessage}`, sourcePaths(fileTree));

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreAmm,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  const coreAmmInstructions = instructionsForSameSourceAndDestPaths(allCoreAmmFiles);
  return Promise.resolve({ instructions: coreAmmInstructions });
};

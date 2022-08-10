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
  CYBERSCRIPT_CORE_ASI,
  CYBERSCRIPT_CORE_CETBASEDIR,
  CYBERSCRIPT_CORE_CPSTYLING_PLUGINDIR,
  CYBERSCRIPT_CORE_REQUIRED_FILES,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { InstallerType } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";

const detectCoreCyberScript = (fileTree: FileTree): boolean =>
  CYBERSCRIPT_CORE_REQUIRED_FILES.some((requiredFile) =>
    pathInTree(requiredFile, fileTree),
  );

export const testForCoreCyberScript: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreCyberScript(fileTree), requiredFiles: [] });

export const installCoreCyberScript: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const allCoreCyberScriptFiles = [
    CYBERSCRIPT_CORE_ASI,
    ...filesUnder(CYBERSCRIPT_CORE_CETBASEDIR, Glob.Any, fileTree),
    ...filesUnder(CYBERSCRIPT_CORE_CPSTYLING_PLUGINDIR, Glob.Any, fileTree),
  ];

  const missingRequiredCoreCyberScriptFiles = !CYBERSCRIPT_CORE_REQUIRED_FILES.every(
    (requiredFile) => pathInTree(requiredFile, fileTree),
  );

  const filesOutsideKnownDirs = allCoreCyberScriptFiles.length !== fileCount(fileTree);

  if (missingRequiredCoreCyberScriptFiles || filesOutsideKnownDirs) {
    const errorMessage = missingRequiredCoreCyberScriptFiles
      ? `Didn't find all required CyberScript files!`
      : `Found files outside known CyberScript directories!`;

    api.log(
      `error`,
      `${InstallerType.CoreCyberScript}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreCyberScript,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  const allCoreCyberScriptInstructions = instructionsForSameSourceAndDestPaths(
    allCoreCyberScriptFiles,
  );

  return Promise.resolve({ instructions: allCoreCyberScriptInstructions });
};

import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import { FileTree, FILETREE_ROOT, pathInTree, sourcePaths } from "./filetree";
import {
  CYBERCAT_CORE_BASEDIR,
  CYBERCAT_CORE_REQUIRED_FILES,
} from "./installers.layouts";
import { showInfoNotification, InfoNotification } from "./ui.notifications";
import { instructionsForSourceToDestPairs, moveFromTo } from "./installers.shared";
import { InstallerType } from "./installers.types";
import {
  showManualStepRequiredForToolInfo,
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";

const findRequiredCoreCyberCatFiles = (fileTree: FileTree): string[] =>
  CYBERCAT_CORE_REQUIRED_FILES.filter((requiredFile) =>
    pathInTree(requiredFile, fileTree),
  );

const detectCoreCyberCat = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  CYBERCAT_CORE_REQUIRED_FILES.some((requiredFile) => pathInTree(requiredFile, fileTree));

export const testForCyberCatCore: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreCyberCat(fileTree), requiredFiles: [] });

export const installCoreCyberCat: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const missingRequiredCoreCyberCatFiles =
    findRequiredCoreCyberCatFiles(fileTree).length !==
    CYBERCAT_CORE_REQUIRED_FILES.length;

  if (missingRequiredCoreCyberCatFiles) {
    const errorMessage = `CyberCAT archive seems to be missing required files!`;
    api.log(
      `error`,
      `${InstallerType.CoreCyberCat}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreCyberCat,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  const topleveltoCyberCat = files.map(moveFromTo(FILETREE_ROOT, CYBERCAT_CORE_BASEDIR));
  const movingInstructions = instructionsForSourceToDestPairs(topleveltoCyberCat);

  const isAutoEnableOnInstall =
    api.getState().settings.automation.enable &&
    api.getState().settings.automation.deploy;

  if (isAutoEnableOnInstall) {
    showInfoNotification(api, InfoNotification.CyberCatRestartRequired);
  } else {
    showManualStepRequiredForToolInfo(api, `CyberCAT`);
  }

  return Promise.resolve({ instructions: movingInstructions });
};

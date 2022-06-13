import { win32 } from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import { FileTree, FILETREE_ROOT } from "./filetree";
import { CYBERCAT_CORE_BASEDIR } from "./installers.layouts";
import { showInfoNotification, InfoNotification } from "./ui.notifications";
import { instructionsForSourceToDestPairs, moveFromTo } from "./installers.shared";
import { GAME_ID } from "./index.metadata";

const path = win32;

const CYBERCAT_CORE_IDENTIFIERS = [
  path.normalize("CP2077SaveEditor.exe"),
  path.normalize("licenses/CyberCAT.Core.LICENSE.txt"),
  path.normalize("previews/BodyGender/00.jpg"),
];

export const testForCyberCatCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryCyberCatFiles = CYBERCAT_CORE_IDENTIFIERS.every(
    (cyberCatPath) => files.includes(cyberCatPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryCyberCatFiles,
    requiredFiles: [],
  });
};

export const installCoreCyberCat: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  log("info", "Using CyberCAT installer");

  const topleveltoCyberCat = files.map(moveFromTo(FILETREE_ROOT, CYBERCAT_CORE_BASEDIR));

  const movingInstructions = instructionsForSourceToDestPairs(topleveltoCyberCat);

  api.emitAndAwait("discover-tools", GAME_ID);
  showInfoNotification(api, InfoNotification.CyberCatRestartRequired);

  return Promise.resolve({ instructions: movingInstructions });
};

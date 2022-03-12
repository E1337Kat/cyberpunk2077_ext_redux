import { win32 } from "path";
import {
  VortexAPI,
  VortexLogFunc,
  VortexTestResult,
  VortexInstruction,
  VortexInstallResult,
  VortexProgressDelegate,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import { allFilesInFolder } from "./installers";

const path = win32;

const INSTALL_DIR = path.normalize("bin/x64");
const CET_CORE_IDENTIFIER = path.join(
  INSTALL_DIR,
  "plugins",
  "cyber_engine_tweaks.asi",
);

export const testForCetCore: VortexWrappedTestSupportedFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _gameId: string,
): Promise<VortexTestResult> => {
  log("debug", "Starting CET Core matcher, input files: ", files);

  if (!files.includes(CET_CORE_IDENTIFIER))
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installCetCore: VortexWrappedInstallFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  log("info", "Using CETCore installer");

  const uniqueFiles = allFilesInFolder(INSTALL_DIR, files);

  const cetCoreInstructions = uniqueFiles.map((file: string) => {
    return {
      type: "copy",
      source: file,
      destination: file,
    };
  });
  const instructions = [].concat(cetCoreInstructions);
  return Promise.resolve({ instructions });
};

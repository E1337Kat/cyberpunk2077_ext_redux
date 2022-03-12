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
import { instructionsForSameSourceAndDestPaths } from "./installers";

const path = win32;

const CET_CORE_IDENTIFIER = path.normalize(
  "bin/x64/plugins/cyber_engine_tweaks.asi",
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

  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

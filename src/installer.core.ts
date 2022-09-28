import { win32 } from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,

} from "./vortex-wrapper";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { FileTree } from "./filetree";
import { V2077TestFunc, V2077InstallFunc } from "./installers.types";

const path = win32;

const CET_CORE_IDENTIFIERS = [path.normalize(`bin/x64/plugins/cyber_engine_tweaks.asi`)];

export const testForCetCore: V2077TestFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryCetFiles = CET_CORE_IDENTIFIERS.every((cetPath) =>
    files.includes(cetPath));

  return Promise.resolve({
    supported: containsAllNecessaryCetFiles,
    requiredFiles: [],
  });
};

export const installCetCore: V2077InstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  log(`info`, `Using CETCore installer`);

  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

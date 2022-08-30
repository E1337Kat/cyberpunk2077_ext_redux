import { win32 } from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { FileTree } from "./filetree";

const path = win32;

const CET_CORE_IDENTIFIERS = [path.normalize(`bin/x64/plugins/cyber_engine_tweaks.asi`)];

const REDSCRIPT_CORE_IDENTIFIERS = [
  path.normalize(`engine/config/base/scripts.ini`),
  path.normalize(`engine/tools/scc.exe`),
  path.normalize(`r6/scripts/redscript.toml`),
];

export const testForCetCore: VortexWrappedTestSupportedFunc = (
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

export const installCetCore: VortexWrappedInstallFunc = (
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

export const testForRedscriptCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryRedsFiles = REDSCRIPT_CORE_IDENTIFIERS.every((redsPath) =>
    files.includes(redsPath));

  return Promise.resolve({
    supported: containsAllNecessaryRedsFiles,
    requiredFiles: [],
  });
};

export const installRedscriptCore: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

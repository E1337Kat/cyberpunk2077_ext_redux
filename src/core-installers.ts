import { win32 } from "path";
import {
  VortexAPI,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";

const path = win32;

const CET_CORE_IDENTIFIERS = [
  path.normalize("bin/x64/plugins/cyber_engine_tweaks.asi"),
];

const REDSCRIPT_CORE_IDENTIFIERS = [
  path.normalize("engine/config/base/scripts.ini"),
  path.normalize("engine/tools/scc.exe"),
  path.normalize("r6/scripts/redscript.toml"),
];

const RED4EXT_CORE_IDENTIFIERS = [
  path.normalize("bin/x64/powrprof.dll"),
  path.normalize("red4ext/LICENSE.txt"),
  path.normalize("red4ext/RED4ext.dll"),
];

export const testForCetCore: VortexWrappedTestSupportedFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _gameId: string,
): Promise<VortexTestResult> => {
  log("debug", "Starting CET Core matcher, input files: ", files);
  const containsAllNecessaryCetFiles = CET_CORE_IDENTIFIERS.every((cetPath) =>
    files.includes(cetPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryCetFiles,
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

export const testForRedscriptCore: VortexWrappedTestSupportedFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _gameId: string,
): Promise<VortexTestResult> => {
  const containsAllNecessaryRedsFiles = REDSCRIPT_CORE_IDENTIFIERS.every(
    (redsPath) => files.includes(redsPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryRedsFiles,
    requiredFiles: [],
  });
};

export const installRedscriptCore: VortexWrappedInstallFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

export const testRed4ExtCore: VortexWrappedTestSupportedFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _gameId: string,
): Promise<VortexTestResult> => {
  const containsAllNecessaryRed4ExtPaths = RED4EXT_CORE_IDENTIFIERS.every(
    (red4extPath) => files.includes(red4extPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryRed4ExtPaths,
    requiredFiles: [],
  });
};

export const installRed4ExtCore: VortexWrappedInstallFunc = (
  api: VortexAPI,
  log: VortexLogFunc,
  files: string[],
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const red4extInstructions = instructionsForSameSourceAndDestPaths(files);

  const pluginsDir = [].concat({
    type: "mkdir",
    destination: path.normalize("red4ext/plugins"),
  });
  const instructions = [].concat(red4extInstructions, pluginsDir);

  return Promise.resolve({ instructions });
};

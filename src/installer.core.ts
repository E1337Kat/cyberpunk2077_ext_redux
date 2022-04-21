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
import { wolvenKitDesktopFoundErrorDialog } from "./dialogs";

const path = win32;

const CET_CORE_IDENTIFIERS = [path.normalize("bin/x64/plugins/cyber_engine_tweaks.asi")];

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

const CSVMERGE_UNIQUE_FILE = path.normalize("csvmerge/CSVMerge.cmd");

const WOLVENKIT_UNIQUE_FILE = path.normalize("WolvenKit CLI/WolvenKit.CLI.exe");

export const testForCetCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryCetFiles = CET_CORE_IDENTIFIERS.every((cetPath) =>
    files.includes(cetPath),
  );

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
  log("info", "Using CETCore installer");

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
    files.includes(redsPath),
  );

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

export const testRed4ExtCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryRed4ExtPaths = RED4EXT_CORE_IDENTIFIERS.every((red4extPath) =>
    files.includes(red4extPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryRed4ExtPaths,
    requiredFiles: [],
  });
};

export const installRed4ExtCore: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
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

export const testCoreCsvMerge: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  if (!files.includes(CSVMERGE_UNIQUE_FILE)) {
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installCoreCsvMerge: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  log("info", "Using CSV installer");

  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

export const testCoreWolvenKitCli: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  if (files.some((file: string) => file.toLowerCase().startsWith("wolvenkit desktop"))) {
    const message = "WolvenKit Desktop is not able to be installed with Vortex.";
    wolvenKitDesktopFoundErrorDialog(api, log, message, files, []);
    return Promise.reject(new Error(message));
  }

  if (!files.includes(WOLVENKIT_UNIQUE_FILE)) {
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installCoreWolvenkit: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  log("info", "Using Wolvenkit CLI installer");

  const allWolvenKitFiles = files.filter((file: string) => !file.endsWith(path.sep));

  const wolvenKitInstructions = allWolvenKitFiles.map((file: string) => {
    const regex = /^WolvenKit CLI/;
    const dest = file.replace(regex, path.normalize("csvmerge/wolvenkitcli"));

    return {
      type: "copy",
      source: file,
      destination: dest,
    };
  });

  const instructions = [].concat(wolvenKitInstructions);

  return Promise.resolve({ instructions });
};

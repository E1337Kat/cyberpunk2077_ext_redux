import { win32 } from "path";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import {
  FileTree,
  sourcePaths,
} from "./filetree";
import {
  V2077TestFunc,
  V2077InstallFunc,
  ModInfo,
} from "./installers.types";
import { Features } from "./features";

const path = win32;

const CET_CORE_IDENTIFIERS = [path.normalize(`bin/x64/plugins/cyber_engine_tweaks.asi`)];

export const testForCetCore: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const files =
    sourcePaths(fileTree);

  const containsAllNecessaryCetFiles = CET_CORE_IDENTIFIERS.every((cetPath) =>
    files.includes(cetPath));

  return Promise.resolve({
    supported: containsAllNecessaryCetFiles,
    requiredFiles: [],
  });
};

export const installCetCore: V2077InstallFunc = (
  _api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: Features,
): Promise<VortexInstallResult> => {
  const files =
    sourcePaths(fileTree);

  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

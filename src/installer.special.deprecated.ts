import { win32 } from "path";
import { FileTree } from "./filetree";
import { InstallerType, V2077TestFunc } from "./installers.types";
import {
  showErrorForDeprecatedModTool,
  wolvenKitDesktopFoundErrorDialog,
} from "./ui.dialogs";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
} from "./vortex-wrapper";

const path = win32;

const CSVMERGE_UNIQUE_FILE = path.normalize(`csvmerge/CSVMerge.cmd`);

const WOLVENKIT_UNIQUE_FILE = path.normalize(`WolvenKit CLI/WolvenKit.CLI.exe`);

export const testCoreCsvMerge: V2077TestFunc = (
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

  const message = `CSVMerge has been deprecated.`;
  showErrorForDeprecatedModTool(api, InstallerType.CoreCSVMerge, message);
  return Promise.reject(new Error(message));
};

export const testCoreWolvenKitCli: V2077TestFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  if (files.some((file: string) => file.toLowerCase().startsWith(`wolvenkit desktop`))) {
    const message = `WolvenKit Desktop is not able to be installed with Vortex.`;
    wolvenKitDesktopFoundErrorDialog(api, message);
    return Promise.reject(new Error(message));
  }

  if (!files.includes(WOLVENKIT_UNIQUE_FILE)) {
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  const message = `WolvenKit installation has been deprecated.`;
  showErrorForDeprecatedModTool(api, InstallerType.CoreWolvenKit, message);
  return Promise.reject(new Error(message));
};

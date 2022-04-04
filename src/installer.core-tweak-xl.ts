import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexProgressDelegate,
  VortexInstruction,
} from "./vortex-wrapper";
import { FileTree, fileCount, pathInTree, sourcePaths } from "./filetree";
import { InstallerType } from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./dialogs";
import {
  TWEAK_XL_MOD_CANONICAL_PATH_PREFIX,
  TWEAK_XL_CORE_FILES,
} from "./installers.layouts";

const coreTweakXLInstructions: VortexInstruction[] = [
  {
    type: `mkdir`,
    destination: TWEAK_XL_MOD_CANONICAL_PATH_PREFIX,
  },
  {
    type: `copy`,
    source: `r6\\scripts\\TweakXL\\TweakXL.reds`,
    destination: `r6\\scripts\\TweakXL\\TweakXL.reds`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\TweakXL\\TweakXL.dll`,
    destination: `red4ext\\plugins\\TweakXL\\TweakXL.dll`,
  },
];

const findCoreTweakXLFiles = (fileTree: FileTree): string[] =>
  TWEAK_XL_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

const detectCoreTweakXL = (fileTree: FileTree): boolean =>
  // We just need to know this looks right, not that it is
  findCoreTweakXLFiles(fileTree).length > 0;

export const TestForCoreTweakXL: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreTweakXL(fileTree), requiredFiles: [] });

export const installCoreTweakXL: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
) => {
  if (
    fileCount(fileTree) !== TWEAK_XL_CORE_FILES.length ||
    findCoreTweakXLFiles(fileTree).length !== fileCount(fileTree)
  ) {
    const errorMessage = `Didn't Find Expected TweakXL Installation!`;
    api.log(
      `error`,
      `${InstallerType.CoreTweakXL}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.CoreTweakXL,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  return Promise.resolve({ instructions: coreTweakXLInstructions });
};

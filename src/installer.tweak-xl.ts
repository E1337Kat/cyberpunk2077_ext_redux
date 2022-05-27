import path from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexProgressDelegate,
  VortexInstallResult,
} from "./vortex-wrapper";
import { FileTree, pathInTree, filesUnder } from "./filetree";
import {
  TWEAK_XL_MOD_CANONICAL_PATH_PREFIX,
  TWEAK_XL_MOD_CANONICAL_EXTENSIONS,
  MaybeInstructions,
  NoInstructions,
  TweakXLLayout,
  InvalidLayout,
  Instructions,
  NoLayout,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { InstallerType } from "./installers.types";
import { fallbackToPromptOrFailOnUnresolvableLayout } from "./installer.fallback";

const matchTweakYaml = (filePath: string): boolean =>
  TWEAK_XL_MOD_CANONICAL_EXTENSIONS.includes(path.extname(filePath));

export const findTweakXLCanonFiles = (fileTree: FileTree): string[] =>
  filesUnder(TWEAK_XL_MOD_CANONICAL_PATH_PREFIX, matchTweakYaml, fileTree);

export const detectTweakXLCanonLayout = (fileTree: FileTree): boolean =>
  // Anything here must be ours to deal with
  pathInTree(TWEAK_XL_MOD_CANONICAL_PATH_PREFIX, fileTree);

const tweakXLCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonTweakXLFiles = findTweakXLCanonFiles(fileTree);

  if (allCanonTweakXLFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: TweakXLLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonTweakXLFiles),
  };
};

// testSupport

export const testForTweakXLMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectTweakXLCanonLayout(fileTree), requiredFiles: [] });

// install

export const installTweakXLMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
): Promise<VortexInstallResult> => {
  // This is the only thing supported, so let's hold modders to it
  const selectedInstructions = tweakXLCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return fallbackToPromptOrFailOnUnresolvableLayout(
      api,
      InstallerType.TweakXL,
      fileTree,
    );
  }

  return Promise.resolve({
    instructions: selectedInstructions.instructions,
  });
};

//
// External use for MultiType etc.
//

export const detectAllowedTweakXLLayouts = (fileTree: FileTree): boolean =>
  detectTweakXLCanonLayout(fileTree);

export const tweakXLAllowedInMultiInstructions = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const selectedInstructions = tweakXLCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${InstallerType.TweakXL}: No valid extra archives`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return selectedInstructions;
};

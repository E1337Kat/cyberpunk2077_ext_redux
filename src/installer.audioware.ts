import path from "path";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";
import {
  FileTree,
  pathInTree,
  filesUnder,
} from "./filetree";
import {
  AUDIOWARE_MOD_CANONICAL_PATH_PREFIX,
  AUDIOWARE_MOD_CANONICAL_EXTENSIONS,
  MaybeInstructions,
  NoInstructions,
  AudiowareLayout,
  InvalidLayout,
  Instructions,
  NoLayout,
} from "./installers.layouts";
import {
  instructionsForSameSourceAndDestPaths,
} from "./installers.shared";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  promptToFallbackOrFailOnUnresolvableLayout,
} from "./installer.fallback";
import {
  FeatureSet,
} from "./features";

const matchAudiowareFiles = (filePath: string): boolean =>
  AUDIOWARE_MOD_CANONICAL_EXTENSIONS.includes(path.extname(filePath));

export const findAudiowareCanonFiles = (fileTree: FileTree): string[] =>
  filesUnder(AUDIOWARE_MOD_CANONICAL_PATH_PREFIX, matchAudiowareFiles, fileTree);

export const detectAudiowareCanonLayout = (fileTree: FileTree): boolean =>
  // Anything here must be ours to deal with
  pathInTree(AUDIOWARE_MOD_CANONICAL_PATH_PREFIX, fileTree);

const audiowareCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonAudiowareFiles = findAudiowareCanonFiles(fileTree);

  if (allCanonAudiowareFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: AudiowareLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonAudiowareFiles),
  };
};

// testSupport

export const testForAudiowareMod: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectAudiowareCanonLayout(fileTree), requiredFiles: [] });

// install

export const installAudiowareMod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
): Promise<VortexInstallResult> => {
  // This is the only thing supported, so let's hold modders to it
  const selectedInstructions = audiowareCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch
    || selectedInstructions === InvalidLayout.Conflict
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Audioware,
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

export const detectAllowedAudiowareLayouts = (fileTree: FileTree): boolean =>
  detectAudiowareCanonLayout(fileTree);

export const audiowareAllowedInMultiInstructions = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const selectedInstructions = audiowareCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch
    || selectedInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${InstallerType.Audioware}: No valid extra archives`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return selectedInstructions;
};

import {
  promptUserOnUnresolvableLayout,
  promptUserToInstallOrCancelOnReachingFallback,
} from "./ui.dialogs";
import {
  filesUnder,
  FileTree,
  FILETREE_ROOT,
  Glob,
  sourcePaths,
} from "./filetree";
import {
  FallbackLayout,
  InvalidLayout,
  LayoutToInstructions,
  MaybeInstructions,
  NoInstructions,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import {
  InstallerType,
  InstallDecision,
  V2077InstallFunc,
  V2077TestFunc,
  ModInfo,
} from "./installers.types";
import { exhaustiveMatchFailure } from "./util.functions";
import {
  VortexApi,
  VortexInstallResult,
  VortexTestResult,
} from "./vortex-wrapper";
import { FeatureSet } from "./features";

export const findFallbackFiles = (fileTree: FileTree): string[] =>
  filesUnder(FILETREE_ROOT, Glob.Any, fileTree);

export const detectFallbackLayout = (_fileTree: FileTree): boolean => true;

export const fallbackLayout: LayoutToInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  if (!detectFallbackLayout(fileTree)) {
    throw new Error(`Should never get here`);
  }

  const allTheFiles = findFallbackFiles(fileTree);

  return {
    kind: FallbackLayout.Unvalidated,
    instructions: instructionsForSameSourceAndDestPaths(allTheFiles),
  };
};

export const useFallbackOrFail = (
  api: VortexApi,
  installerType: InstallerType,
  fileTree: FileTree,
  installDecision: InstallDecision,
): Promise<VortexInstallResult> => {
  switch (installDecision) {
    case InstallDecision.UserWantsToCancel: {
      const message = `${installerType}: user chose to cancel installation`;
      api.log(`info`, message);
      api.log(`debug`, `Input files: `, sourcePaths(fileTree));
      return Promise.reject(new Error(message));
    }
    case InstallDecision.UserWantsToProceed: {
      api.log(`info`, `${installerType}: user chose to continue installation`);
      api.log(`info`, `${installerType}: using fallback layout to install everything`);

      const fallbackInstructions = fallbackLayout(api, undefined, fileTree);

      if (
        fallbackInstructions === InvalidLayout.Conflict ||
        fallbackInstructions === NoInstructions.NoMatch
      ) {
        return Promise.reject(
          new Error(
            `Fallback layout failed, should never get here: ${fallbackInstructions}`,
          ),
        );
      }

      api.log(`info`, `${installerType}: instructions generated by fallback installer`);
      api.log(`debug`, `Instructions`, fallbackInstructions.instructions);

      return Promise.resolve({
        instructions: fallbackInstructions.instructions,
      });
    }
    default: {
      return exhaustiveMatchFailure(installDecision);
    }
  }
};

export const promptToFallbackOrFailOnUnresolvableLayout = async (
  api: VortexApi,
  installerType: InstallerType,
  fileTree: FileTree,
): Promise<VortexInstallResult> => {
  const installDecision = await promptUserOnUnresolvableLayout(
    api,
    installerType,
    filesUnder(FILETREE_ROOT, Glob.Any, fileTree),
  );

  return useFallbackOrFail(api, installerType, fileTree, installDecision);
};

export const testForFallback: V2077TestFunc = (
  _api: VortexApi,
  _fileTree: FileTree,
): Promise<VortexTestResult> => Promise.resolve({
  supported: true,
  requiredFiles: [],
});

export const installFallback: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
): Promise<VortexInstallResult> => {
  const installDecision = await promptUserToInstallOrCancelOnReachingFallback(
    api,
    filesUnder(FILETREE_ROOT, Glob.Any, fileTree),
  );

  return useFallbackOrFail(api, InstallerType.Fallback, fileTree, installDecision);
};

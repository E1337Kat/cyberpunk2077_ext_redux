import path from "path";
import { promptUserOnProtectedPaths } from "./ui.dialogs";
import { FileTree, FILETREE_ROOT } from "./filetree";
import { EXTENSION_NAME_INTERNAL } from "./index.metadata";
import {
  Instructions,
  LayoutToInstructions,
  MaybeInstructions,
  NoInstructions,
  NotAllowed,
  PromptedOptionalInstructions,
} from "./installers.layouts";
import { InstallDecision, InstallerType } from "./installers.types";

import { VortexApi, VortexInstruction } from "./vortex-wrapper";
// Types

// Vortex gives us a 'destination path', which is actually
// the tempdir in which the archive is expanded into for
// the duration of the installation.
export const makeSyntheticName = (vortexDestinationPath: string) =>
  `${EXTENSION_NAME_INTERNAL}-${path.basename(vortexDestinationPath, ".installing")}`;

// Source to dest path mapping helpers
export const toSamePath = (f: string) => [f, f];
export const toDirInPath = (prefixPath: string, dir: string) => (f: string) =>
  [f, path.join(prefixPath, dir, path.basename(f))];

export const moveFromTo =
  (fromPrefix: string, toPrefix: string) => (filePath: string) => {
    if (fromPrefix === FILETREE_ROOT) {
      return [filePath, path.join(toPrefix, filePath)];
    }
    return [
      filePath,
      path
        .normalize(filePath)
        .replace(path.normalize(fromPrefix), path.normalize(toPrefix)),
    ];
  };

// Drop any folders and duplicates from the file list,
// and then create the instructions.
export const instructionsForSourceToDestPairs = (
  srcAndDestPairs: string[][],
): VortexInstruction[] => {
  const justTheRegularFiles = srcAndDestPairs.filter(
    ([src, _]) => !src.endsWith(path.sep),
  );

  // Is this actually necessary at all? I guess we could check there are
  // no duplicates that would override one another in case callers haven't
  // const uniqueFiles = [...new Set(justTheRegularFiles).values()];

  const instructions: VortexInstruction[] = justTheRegularFiles.map(
    ([src, dst]): VortexInstruction => ({
      type: "copy",
      source: src,
      destination: dst,
    }),
  );

  return instructions;
};

export const instructionsForSameSourceAndDestPaths = (
  files: string[],
): VortexInstruction[] => instructionsForSourceToDestPairs(files.map(toSamePath));

export const useFirstMatchingLayoutForInstructions = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
  possibleLayouts: LayoutToInstructions[],
): MaybeInstructions =>
  possibleLayouts.reduce(
    (found, tryLayout) =>
      found === NoInstructions.NoMatch ? tryLayout(api, modName, fileTree) : found,
    NoInstructions.NoMatch,
  );

export const useAllMatchingLayouts = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
  layoutsToTry: LayoutToInstructions[],
): Instructions[] => {
  const allInstructions = layoutsToTry
    .map((layout) => layout(api, modName, fileTree))
    .filter((instructions) => instructions !== NoInstructions.NoMatch);

  const someValidInstructions: Instructions[] = allInstructions.filter(
    (maybe): maybe is Instructions => (maybe as Instructions).kind !== undefined,
  );

  return someValidInstructions;
};

export const promptBeforeContinuingWithProtectedInstructions = async (
  api: VortexApi,
  installerType: InstallerType,
  protectedPaths: string[],
  instructionsToUse: Instructions,
): Promise<PromptedOptionalInstructions> => {
  const destinationPaths = instructionsToUse.instructions.map((i) => i.destination);
  const affectedPaths = destinationPaths.filter((p) => protectedPaths.includes(p));

  const installDecision = await promptUserOnProtectedPaths(
    api,
    installerType,
    affectedPaths,
  );

  if (installDecision === InstallDecision.UserWantsToCancel) {
    return NotAllowed.CanceledByUser;
  }

  return instructionsToUse;
};

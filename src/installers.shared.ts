import fs from "fs/promises";
import path from "path";

import * as A from "fp-ts/Array";
import { Task } from "fp-ts/lib/Task";
import * as T from "fp-ts/Task";

import { pipe } from "fp-ts/lib/function";
import { promptUserOnProtectedPaths } from "./ui.dialogs";
import { FileTree, FILETREE_ROOT } from "./filetree";
import { EXTENSION_NAME_INTERNAL } from "./index.metadata";
import {
  Instructions,
  LayoutToInstructions,
  LayoutToInstructionsAny,
  MaybeInstructions,
  NoInstructions,
  NotAllowed,
  PromptedOptionalInstructions,
} from "./installers.layouts";
import { InstallDecision, InstallerType } from "./installers.types";

import { VortexApi, VortexInstruction } from "./vortex-wrapper";

// Types
export interface File {
  readonly relativePath: string;
  readonly pathOnDisk: string;
  readonly content: string;
}

export interface FileMove extends File {
  readonly originalRelativePath: string;
}

export const fileFromDisk = (pathOnDisk: string, relativePath: string): Task<File> =>
  T.map((content: string) => ({ relativePath, pathOnDisk, content }))(() =>
    fs.readFile(pathOnDisk, `utf8`),
  );

export const fileMove = (to: string, file: File): FileMove => ({
  relativePath: path.join(to, path.basename(file.relativePath)),
  pathOnDisk: file.pathOnDisk,
  originalRelativePath: file.relativePath,
  content: file.content,
});

export const fileToInstruction = (movedFile: FileMove): VortexInstruction => ({
  type: `copy`,
  source: movedFile.originalRelativePath,
  destination: movedFile.relativePath,
});

// For a synthetic mod name
export const makeSyntheticName = (vortexStagingDirPath: string) =>
  `${EXTENSION_NAME_INTERNAL}-${path.basename(vortexStagingDirPath)}`;

//
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

//
// Instruction construction - DEPRECATE ME: use File/FileMove

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

export const instructionsToGenerateDirs = (
  dirs: string[],
): VortexInstruction[] =>
  pipe(
    dirs,
    A.map((dir) => ({
      type: `mkdir`,
      destination: dir,
    })),
  );


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

export const useFirstMatchingLayoutForInstructionsAsync = async (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
  sourceDirPathForMod: string,
  possibleLayouts: LayoutToInstructionsAny[],
): Promise<MaybeInstructions> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const tryLayout of possibleLayouts) {
    // eslint-disable-next-line no-await-in-loop
    const instructions = await tryLayout(api, modName, fileTree, sourceDirPathForMod);

    if (instructions !== NoInstructions.NoMatch) {
      return instructions;
    }
  }

  return NoInstructions.NoMatch;
};

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

import path from "path";
import { FileTree } from "./filetree";
import {
  InstructionsFromFileTree,
  NoInstructions,
  MaybeInstructions,
} from "./installers.layouts";

import { VortexApi, VortexInstruction } from "./vortex-wrapper";

// Source to dest path mapping helpers
export const toSamePath = (f: string) => [f, f];
export const toDirInPath = (prefixPath: string, dir: string) => (f: string) =>
  [f, path.join(prefixPath, dir, path.basename(f))];

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
): VortexInstruction[] =>
  instructionsForSourceToDestPairs(files.map(toSamePath));

export const useFirstMatchingLayoutForInstructions = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
  possibleLayouts: InstructionsFromFileTree[],
): MaybeInstructions =>
  possibleLayouts.reduce(
    (found, tryLayout) =>
      found === NoInstructions.NoMatch
        ? tryLayout(api, modName, fileTree)
        : found,
    NoInstructions.NoMatch,
  );

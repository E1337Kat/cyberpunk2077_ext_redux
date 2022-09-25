import fs from "fs/promises";
import path from "path";

import * as A from "fp-ts/Array";
import { Either, left, right } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { Task } from "fp-ts/lib/Task";
import * as T from "fp-ts/Task";

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
    fs.readFile(pathOnDisk, `utf8`));

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

export interface SemVer {
  v: string;
  major: string;
  minor?: string;
  patch?: string;
  prerelease?: string;
  build?: string;
}
export interface ModInfo {
  name: string;
  id: string;
  version: SemVer;
  createTime: Date;
  copy?: string;
  variant?: string;
}

const ModInfoFormatParser =
  // eslint-disable-next-line max-len
  /^(?<name>.+?)-(?<id>\d+)-(?<major>\w+)(?:-(?<minor>\w+)(?:-(?<patch>\w+))?)?-(?<createTime>\d+)(?<copy>(\.\d+||\(\d+\)))?(?:\+(?<variant>.+))?$/;

export const modInfoToArchiveName = (modInfo: ModInfo): string =>
  // eslint-disable-next-line prefer-template
  `${modInfo.name}-` +
  `${modInfo.id}-` +
  `${modInfo.version.major}-` +
  (modInfo.version.minor ? `${modInfo.version.minor}-` : ``) +
  (modInfo.version.patch ? `${modInfo.version.patch}-` : ``) +
  `${modInfo.createTime.getTime() / 1000}-` +
  (modInfo.copy ? modInfo.copy : ``) +
  (modInfo.variant ? modInfo.variant : ``);

export const modInfoFromArchiveName = (archiveName: string): Either<string, ModInfo> => {
  const match = ModInfoFormatParser.exec(archiveName);

  if (!match) {
    return left(`Failed to parse archive name: ${archiveName}`);
  }

  const {
    name, id, major, minor, patch, createTime, copy, variant,
  } = match.groups;

  const version: SemVer = {
    v: major + (minor ? `.${minor}` : ``) + (patch ? `.${patch}` : ``),
    major,
    minor,
    patch,
  };

  const modInfo: ModInfo = {
    name,
    id,
    version,
    createTime: new Date(parseInt(createTime, 10) * 1000),
    copy,
    variant,
  };

  return right(modInfo);
};

// For a synthetic mod name when one is not provided
//
// TODO: this should be changed to try to parse using ModInfo
//       and only use the synthetic name if we can't parse the
//       the real mod info.
//
// TODO https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/241
//
export const makeSyntheticName = (vortexStagingDirPath: string): string =>
  `${EXTENSION_NAME_INTERNAL}-${path.basename(vortexStagingDirPath, `.installing`)}`;

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
  srcAndDestPairs: readonly string[][],
): VortexInstruction[] => {
  const justTheRegularFiles = srcAndDestPairs.filter(
    ([src, _]) => !src.endsWith(path.sep),
  );

  // Is this actually necessary at all? I guess we could check there are
  // no duplicates that would override one another in case callers haven't
  // const uniqueFiles = [...new Set(justTheRegularFiles).values()];

  const instructions: VortexInstruction[] = justTheRegularFiles.map(
    ([src, dst]): VortexInstruction => ({
      type: `copy`,
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
      (found === NoInstructions.NoMatch ? tryLayout(api, modName, fileTree) : found),
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

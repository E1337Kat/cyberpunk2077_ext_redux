import path from "path";
import { filesUnder, FileTree, FILETREE_ROOT, prunedTreeFrom } from "./filetree";
import {
  Instructions,
  NoInstructions,
  InvalidLayout,
  NoLayout,
  MODS_EXTRA_FILETYPES_ALLOWED_IN_ANY_MOD,
  isKnownToplevelDir,
  LayoutFindFilesFunc,
  LayoutToInstructions,
  ExtraFilesLayout,
  MaybeInstructions,
  MODS_EXTRA_BASEDIR,
} from "./installers.layouts";
import {
  instructionsForSourceToDestPairs,
  moveFromTo,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType } from "./installers.types";
import { VortexApi } from "./vortex-wrapper";

const matchExtraFile = (file: string): boolean =>
  MODS_EXTRA_FILETYPES_ALLOWED_IN_ANY_MOD.includes(path.extname(file));

const findExtraFiles: LayoutFindFilesFunc = (fileTree: FileTree): string[] =>
  filesUnder(FILETREE_ROOT, matchExtraFile, prunedTreeFrom(isKnownToplevelDir, fileTree));

/*
const detectExtraFilesLayout: LayoutDetectFunc = (fileTree: FileTree): boolean =>
  dirWithSomeUnder(
    FILETREE_ROOT,
    matchExtraFile,
    prunedTreeFrom(isKnownToplevelDir, fileTree),
  );
  */

const extraFilesLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allExtraFiles = findExtraFiles(fileTree);

  if (allExtraFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const extraFilesDirForMod = path.normalize(`.\\${MODS_EXTRA_BASEDIR}\\${modName}`);

  const allFromOriginalPathToOurExtraDir = allExtraFiles.map(
    moveFromTo(FILETREE_ROOT, extraFilesDirForMod),
  );

  return {
    kind: ExtraFilesLayout.Toplevel,
    instructions: instructionsForSourceToDestPairs(allFromOriginalPathToOurExtraDir),
  };
};

//
// Extra files with other mod types
//

const extraFilesLayoutsAllowedInOtherModTypes = [extraFilesLayout];

export const extraFilesAllowedInOtherModTypesInstructions = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
): Instructions => {
  const extraFilesInstructionsToUse = useFirstMatchingLayoutForInstructions(
    api,
    modName,
    fileTree,
    extraFilesLayoutsAllowedInOtherModTypes,
  );

  if (
    extraFilesInstructionsToUse === NoInstructions.NoMatch ||
    extraFilesInstructionsToUse === InvalidLayout.Conflict
  ) {
    api.log(
      `debug`,
      `${InstallerType.SpecialExtraFiles}: No valid extra files (this is ok)`,
    );
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return extraFilesInstructionsToUse;
};

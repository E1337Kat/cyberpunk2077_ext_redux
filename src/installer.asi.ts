import path from "path";
import { FeatureSet } from "./features";
import {
  FileTree,
  filesIn,
  filesUnder,
  Glob,
  fileCount,
  sourcePaths,
} from "./filetree";
import {
  ASI_MOD_PATH,
  LayoutToInstructions,
  MaybeInstructions,
  NoInstructions,
  AsiLayout,
  InvalidLayout,
  ASI_MOD_EXT,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import {
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";

const matchAsiFile = (file: string) => path.extname(file) === ASI_MOD_EXT;

const findCanonicalAsiDirs = (fileTree: FileTree) =>
  filesIn(ASI_MOD_PATH, matchAsiFile, fileTree);

const detectASICanonLayout = (fileTree: FileTree): boolean =>
  findCanonicalAsiDirs(fileTree).length > 0;

const findCanonicalAsiFiles = (fileTree: FileTree): string[] =>
  filesUnder(ASI_MOD_PATH, Glob.Any, fileTree);

//
// Layouts
//

const asiCanonLayout: LayoutToInstructions = (
  _api: VortexApi,
  modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const hasBasedirFiles = filesIn(ASI_MOD_PATH, matchAsiFile, fileTree).length > 0;

  if (!hasBasedirFiles) {
    return NoInstructions.NoMatch;
  }

  const allCanonAsiFiles = findCanonicalAsiFiles(fileTree);

  if (allCanonAsiFiles.length === 0) {
    return NoInstructions.NoMatch;
  }

  return {
    kind: AsiLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonAsiFiles),
  };
};

//
// API
//

// test
export const testForAsiMod: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({
    supported: detectASICanonLayout(fileTree),
    requiredFiles: [],
  });

// install
export const installAsiMod: V2077InstallFunc = (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: FeatureSet,
): Promise<VortexInstallResult> => {
  const files =
    sourcePaths(fileTree);

  const chosenInstructions = asiCanonLayout(api, modInfo.name, fileTree);

  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    const message = `ASI installer failed to generate instructions`;
    api.log(`error`, message, files);
    return Promise.reject(new Error(message));
  }

  const { instructions } = chosenInstructions;

  const haveFilesOutsideSelectedInstructions =
    instructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    const message = `Too many files in ASI Mod! ${instructions.length}`;
    api.log(`error`, message, files);
    return Promise.reject(new Error(message));
  }

  api.log(`info`, `ASI installer installing files.`);
  api.log(`debug`, `ASI instructions: `, instructions);

  return Promise.resolve({ instructions });
};

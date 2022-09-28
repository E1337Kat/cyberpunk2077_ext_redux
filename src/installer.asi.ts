import path from "path";
import {
  FileTree,
  filesIn,
  filesUnder,
  Glob,
  fileCount,
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
import {
  instructionsForSameSourceAndDestPaths,
  makeSyntheticName,
} from "./installers.shared";
import {
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  VortexApi,
  VortexLogFunc,
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

export const testForAsiMod: V2077TestFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  if (!detectASICanonLayout(fileTree)) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  return Promise.resolve({ supported: true, requiredFiles: [] });
};

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

export const installAsiMod: V2077InstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
): Promise<VortexInstallResult> => {
  const modname = makeSyntheticName(destinationPath);

  const chosenInstructions = asiCanonLayout(api, modname, fileTree);

  if (
    chosenInstructions === NoInstructions.NoMatch ||
    chosenInstructions === InvalidLayout.Conflict
  ) {
    const message = `ASI installer failed to generate instructions`;
    log(`error`, message, files);
    return Promise.reject(new Error(message));
  }

  const { instructions } = chosenInstructions;

  const haveFilesOutsideSelectedInstructions =
    instructions.length !== fileCount(fileTree);

  if (haveFilesOutsideSelectedInstructions) {
    const message = `Too many files in ASI Mod! ${instructions.length}`;
    log(`error`, message, files);
    return Promise.reject(new Error(message));
  }

  log(`info`, `ASI installer installing files.`);
  log(`debug`, `ASI instructions: `, instructions);

  return Promise.resolve({ instructions });
};

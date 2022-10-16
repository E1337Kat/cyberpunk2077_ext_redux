import path from "path";
import KeyTree from "key-tree";
import {
  FileTree,
  findDirectSubdirsWithSome,
  filesUnder,
  Glob,
  sourcePaths,
} from "./filetree";
import { extraCanonArchiveInstructions } from "./installer.archive";
import {
  CET_MOD_CANONICAL_PATH_PREFIX,
  CET_MOD_CANONICAL_INIT_FILE,
  MaybeInstructions,
  NoInstructions,
  CetLayout,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";
import {
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import { Features } from "./features";

const allFilesInFolder = (folder: string, files: string[]) => {
  const fileTree = new KeyTree({ separator: path.sep });

  files.forEach((file) => fileTree.add(file, file));

  const moddir = fileTree._getNode(folder); // eslint-disable-line no-underscore-dangle

  if (!moddir) {
    return [];
  }

  const moddirPath = path.join(...moddir.fullPath);

  const allTheFiles: string[] = [].concat(
    ...Object.values(fileTree.getSub(moddirPath, true)),
  );

  return allTheFiles;
};

const allCanonicalCetFiles = (files: string[]) =>
  allFilesInFolder(CET_MOD_CANONICAL_PATH_PREFIX, files);

//
//
//
//
// Installers
//
// These should come in (roughly) reverse order of priority,
// because the highest-priority ones will use Layouts and
// other parts from the simpler installers.
//
//

// CET

const matchCetInitLua = (f: string): boolean =>
  path.basename(f) === CET_MOD_CANONICAL_INIT_FILE;

const findCanonicalCetDirs = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(CET_MOD_CANONICAL_PATH_PREFIX, matchCetInitLua, fileTree);

export const detectCetCanonLayout = (fileTree: FileTree): boolean =>
  findCanonicalCetDirs(fileTree).length > 0;

export const cetCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonCetFiles = findCanonicalCetDirs(fileTree).flatMap((namedSubdir) =>
    filesUnder(namedSubdir, Glob.Any, fileTree));

  if (allCanonCetFiles.length < 1) {
    api.log(`debug`, `No canonical CET files found.`);
    return NoInstructions.NoMatch;
  }

  return {
    kind: CetLayout.Canon,
    instructions: instructionsForSameSourceAndDestPaths(allCanonCetFiles),
  };
};

// CET

// CET mods are detected by:
//
// Canonical:
//  - .\bin\x64\plugins\cyber_engine_tweaks\mods\MODNAME\init.lua
//  - .\r6\scripts\[modname]\*.reds
//
// Fixable: no
//
// Archives: both canonical

export const testForCetMod: V2077TestFunc = (
  api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const hasCetFilesInANamedModDir = detectCetCanonLayout(fileTree);

  if (!hasCetFilesInANamedModDir) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  api.log(`info`, `Matching CET installer: ${hasCetFilesInANamedModDir}`);

  return Promise.resolve({
    supported: hasCetFilesInANamedModDir,
    requiredFiles: [],
  });
};

// Install the CET stuff, as well as any archives we find
export const installCetMod: V2077InstallFunc = (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: Features,
): Promise<VortexInstallResult> => {
  const files =
    sourcePaths(fileTree);

  const cetFiles = allCanonicalCetFiles(files);

  if (cetFiles.length === 0) {
    return Promise.reject(
      new Error(`CET install but no CET files, should never get here`),
    );
  }

  const extraArchiveInstructions = extraCanonArchiveInstructions(api, fileTree);

  const instructions = [
    ...instructionsForSameSourceAndDestPaths(cetFiles),
    ...extraArchiveInstructions.instructions,
  ];

  return Promise.resolve({ instructions });
};

import path from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexProgressDelegate,
  VortexInstallResult,
} from "./vortex-wrapper";
import {
  FileTree,
  filesUnder,
  findDirectSubdirsWithSome,
  Glob,
  dirInTree,
  fileCount,
  subtreeFrom,
} from "./filetree";
import {
  MaybeInstructions,
  NoInstructions,
  AmmLayout,
  InvalidLayout,
  Instructions,
  NoLayout,
  AMM_MOD_CUSTOMS_CANON_DIR,
  AMM_MOD_USERMOD_CANON_DIR,
  AMM_BASEDIR_PATH,
} from "./installers.layouts";
import { instructionsForSameSourceAndDestPaths } from "./installers.shared";
import { InstallerType } from "./installers.types";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import { extraCanonArchiveInstructions } from "./installer.archive";

const matchAmmLua = (filePath: string): boolean => path.extname(filePath) === `.lua`;

const matchAmmJson = (filePath: string): boolean => path.extname(filePath) === `.json`;

const findAmmCanonCustomsFiles = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(AMM_MOD_CUSTOMS_CANON_DIR, matchAmmLua, fileTree).flatMap(
    (dir) => filesUnder(dir, Glob.Any, fileTree),
  );

const findAmmCanonUsermodFiles = (fileTree: FileTree): string[] =>
  findDirectSubdirsWithSome(AMM_MOD_USERMOD_CANON_DIR, matchAmmJson, fileTree).flatMap(
    (dir) => filesUnder(dir, Glob.Any, fileTree),
  );

const findAmmCanonFiles = (fileTree: FileTree): string[] => [
  ...findAmmCanonCustomsFiles(fileTree),
  ...findAmmCanonUsermodFiles(fileTree),
];

const detectAmmCanonCustomLayouts = (fileTree: FileTree): boolean =>
  findDirectSubdirsWithSome(AMM_MOD_CUSTOMS_CANON_DIR, matchAmmLua, fileTree).length > 0;

const detectAmmCanonUsermodLayouts = (fileTree: FileTree): boolean =>
  findDirectSubdirsWithSome(AMM_MOD_USERMOD_CANON_DIR, matchAmmJson, fileTree).length > 0;

const detectAmmCanonLayout = (fileTree: FileTree): boolean =>
  detectAmmCanonCustomLayouts(fileTree) || detectAmmCanonUsermodLayouts(fileTree);

//
// Layouts
//

const ammCanonLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonAmmFiles = findAmmCanonFiles(fileTree);

  if (allCanonAmmFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const totalFilesInAmmBasedir = fileCount(subtreeFrom(AMM_BASEDIR_PATH, fileTree));

  if (allCanonAmmFiles.length !== totalFilesInAmmBasedir) {
    api.log(`debug`, `${InstallerType.AMM}: unknown files in a canon layout, conflict`);
    return InvalidLayout.Conflict;
  }

  const ammCanonInstructions = instructionsForSameSourceAndDestPaths(allCanonAmmFiles);

  const allowedArchiveInstructionsIfAny = extraCanonArchiveInstructions(api, fileTree);

  const allInstructions = [
    ...ammCanonInstructions,
    ...allowedArchiveInstructionsIfAny.instructions,
  ];

  return {
    kind: AmmLayout.Canon,
    instructions: allInstructions,
  };
};

// testSupport

export const testForAmmMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const looksLikeCanonAmmMod = dirInTree(`${AMM_BASEDIR_PATH}\\`, fileTree);

  if (looksLikeCanonAmmMod) {
    return Promise.resolve({
      supported: true,
      requiredFiles: [],
    });
  }

  return Promise.resolve({ supported: false, requiredFiles: [] });
};

// install

export const installAmmMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _progressDelegate: VortexProgressDelegate,
): Promise<VortexInstallResult> => {
  const selectedInstructions = ammCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(api, InstallerType.AMM, fileTree);
  }

  return Promise.resolve({
    instructions: selectedInstructions.instructions,
  });
};

//
// External use for MultiType etc.
//

export const detectAllowedAmmLayouts = (fileTree: FileTree): boolean =>
  detectAmmCanonLayout(fileTree);

export const ammAllowedInMultiInstructions = (
  api: VortexApi,
  fileTree: FileTree,
): Instructions => {
  const selectedInstructions = ammCanonLayout(api, undefined, fileTree);

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${InstallerType.AMM}: No valid extra archives`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  return selectedInstructions;
};

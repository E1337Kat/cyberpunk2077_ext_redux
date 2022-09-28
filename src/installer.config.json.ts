import path from "path";
import {
  filesIn,
  filesUnder,
  FileTree,
  FILETREE_ROOT,
  pathInTree,
} from "./filetree";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import {
  CONFIG_JSON_MOD_EXTENSION,
  CONFIG_JSON_MOD_PROTECTED_DIRS,
  ConfigJsonLayout,
  InvalidLayout,
  NoInstructions,
  NotAllowed,
  CONFIG_JSON_MOD_PROTECTED_FILES,
  LayoutToInstructions,
  MaybeInstructions,
  CONFIG_JSON_MOD_PROTECTED_FILENAMES,
  CONFIG_JSON_MOD_UNFIXABLE_FILENAMES,
  CONFIG_JSON_MOD_FIXABLE_FILENAMES_TO_PATHS,
  PromptedOptionalInstructions,
  NoLayout,
} from "./installers.layouts";
import {
  useFirstMatchingLayoutForInstructions,
  promptBeforeContinuingWithProtectedInstructions,
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
} from "./installers.shared";
import {
  InstallerType,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";

const matchConfigJson = (filePath: string): boolean =>
  path.extname(filePath) === CONFIG_JSON_MOD_EXTENSION;

const findConfigJsonProtectedFiles = (fileTree: FileTree): string[] =>
  CONFIG_JSON_MOD_PROTECTED_FILES.filter((protectedPath) =>
    pathInTree(protectedPath, fileTree));

const detectConfigJsonProtectedLayout = (fileTree: FileTree): boolean =>
  findConfigJsonProtectedFiles(fileTree).length > 0;

const findConfigJsonToplevelFiles = (fileTree: FileTree): string[] =>
  filesIn(FILETREE_ROOT, matchConfigJson, fileTree).filter((json) =>
    CONFIG_JSON_MOD_PROTECTED_FILENAMES.includes(path.basename(json)));

const detectConfigJsonToplevelLayout = (fileTree: FileTree): boolean =>
  findConfigJsonToplevelFiles(fileTree).length > 0;

const findJsonFilesInProtectedDirs = (fileTree: FileTree): string[] =>
  CONFIG_JSON_MOD_PROTECTED_DIRS.flatMap((dir) =>
    filesUnder(dir, matchConfigJson, fileTree));

const detectJsonFilesInProtectedDirs = (fileTree: FileTree): boolean =>
  findJsonFilesInProtectedDirs(fileTree).length > 0;

//
// Layouts
//

const configJsonProtectedLayout: LayoutToInstructions = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allProtectedConfigJsonFiles = findConfigJsonProtectedFiles(fileTree);

  if (allProtectedConfigJsonFiles.length < 1) {
    // Shouldn't get here?
    return NoInstructions.NoMatch;
  }

  const protectedJsonInstructions = instructionsForSameSourceAndDestPaths(
    allProtectedConfigJsonFiles,
  );

  return {
    kind: ConfigJsonLayout.Protected,
    instructions: protectedJsonInstructions,
  };
};

const configJsonTopevelLayout: LayoutToInstructions = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allToplevelProtectedConfigJsonFilenames = findConfigJsonToplevelFiles(
    fileTree,
  ).map((protectedPath) => path.basename(protectedPath));

  if (allToplevelProtectedConfigJsonFilenames.length < 1) {
    return NoInstructions.NoMatch;
  }

  const unresolvableJsonNames = allToplevelProtectedConfigJsonFilenames.some(
    (protectedName) => CONFIG_JSON_MOD_UNFIXABLE_FILENAMES.includes(protectedName),
  );

  if (unresolvableJsonNames) {
    return InvalidLayout.Conflict;
  }

  const toplevelConfigJsonsWithFixedPaths = allToplevelProtectedConfigJsonFilenames.map(
    (protectedName) => [
      protectedName,
      CONFIG_JSON_MOD_FIXABLE_FILENAMES_TO_PATHS[protectedName],
    ],
  );

  const toplevelToCanonInstructions = instructionsForSourceToDestPairs(
    toplevelConfigJsonsWithFixedPaths,
  );

  return {
    kind: ConfigJsonLayout.Toplevel,
    instructions: toplevelToCanonInstructions,
  };
};

//
// testSupport
//

export const testForJsonMod: V2077TestFunc = async (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const foundJsonToHandle =
    detectConfigJsonProtectedLayout(fileTree) ||
    detectConfigJsonToplevelLayout(fileTree) ||
    detectJsonFilesInProtectedDirs(fileTree);

  return {
    supported: foundJsonToHandle,
    requiredFiles: [],
  };
};

//
// install
//

export const installJsonMod: V2077InstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const me = InstallerType.ConfigJson;

  const allPossibleConfigJsonLayouts = [
    configJsonProtectedLayout,
    configJsonTopevelLayout,
  ];

  const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleConfigJsonLayouts,
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
    // Also gets here if detectJsonFilesInProtectedDirs matched in test
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.ConfigJson,
      fileTree,
    );
  }

  const confirmedInstructions = await promptBeforeContinuingWithProtectedInstructions(
    api,
    InstallerType.ConfigJson,
    CONFIG_JSON_MOD_PROTECTED_FILES,
    selectedInstructions,
  );

  if (confirmedInstructions === NotAllowed.CanceledByUser) {
    const cancelMessage = `${me}: user chose to cancel installing to protected paths`;

    api.log(`warn`, cancelMessage);
    return Promise.reject(new Error(cancelMessage));
  }

  api.log(`info`, `${me}: User confirmed installing to protected paths`);
  return Promise.resolve({
    instructions: confirmedInstructions.instructions,
  });
};

//
// External use for MultiType etc.
//

export const detectAllowedConfigJsonLayouts = detectConfigJsonProtectedLayout;

export const configJsonAllowedInMultiInstructions = async (
  api: VortexApi,
  fileTree: FileTree,
): Promise<PromptedOptionalInstructions> => {
  const me = InstallerType.ConfigJson;

  const maybeInstructions = configJsonProtectedLayout(api, undefined, fileTree);

  if (
    maybeInstructions === NoInstructions.NoMatch ||
    maybeInstructions === InvalidLayout.Conflict
  ) {
    api.log(`debug`, `${me}: No valid JSON config files found, this is ok`);
    return { kind: NoLayout.Optional, instructions: [] };
  }

  const confirmedInstructions = await promptBeforeContinuingWithProtectedInstructions(
    api,
    InstallerType.ConfigJson,
    CONFIG_JSON_MOD_PROTECTED_FILES,
    maybeInstructions,
  );

  if (confirmedInstructions === NotAllowed.CanceledByUser) {
    api.log(`warn`, `${me}: user did not allow installing to protected paths`);

    return NotAllowed.CanceledByUser;
  }

  return confirmedInstructions;
};

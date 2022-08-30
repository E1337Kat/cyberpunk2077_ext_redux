import { win32 } from "path";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexInstallResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexInstruction,
} from "./vortex-wrapper";
import { instructionsForSameSourceAndDestPaths, useFirstMatchingLayoutForInstructions } from "./installers.shared";
import { filesIn, filesUnder, FileTree, fileTreeFromPaths, FILETREE_ROOT, Glob, pathInTree } from "./filetree";
import { CoreDeprecatedRed4extLayout, CoreRed4extLayout, DEPRECATED_RED4EXT_CORE_REQUIRED_FILES, Instructions, InvalidLayout, MaybeInstructions, NoInstructions, NoLayout, RED4EXT_CORE_REQUIRED_FILES } from "./installers.layouts";
import { promptUserToInstallOrCancelOnDepecatedRed4ext } from "./ui.dialogs";
import { InstallerType } from "./installers.types";

const path = win32;

const CET_CORE_IDENTIFIERS = [path.normalize("bin/x64/plugins/cyber_engine_tweaks.asi")];

const REDSCRIPT_CORE_IDENTIFIERS = [
  path.normalize("engine/config/base/scripts.ini"),
  path.normalize("engine/tools/scc.exe"),
  path.normalize("r6/scripts/redscript.toml"),
];

const OLD_RED4EXT_CORE_IDENTIFIERS = [
  path.normalize("bin/x64/powrprof.dll"),
  path.normalize("red4ext/LICENSE.txt"),
  path.normalize("red4ext/RED4ext.dll"),
];

const RED4EXT_CORE_IDENTIFIERS = [
  path.normalize("bin/x64/d3d11.dll"),
  path.normalize("red4ext/LICENSE.txt"),
  path.normalize("red4ext/THIRD_PARTY_LICENSES.txt"),
  path.normalize("red4ext/RED4ext.dll"),
];
// Recognizers
  
  const findCoreRed4extFiles = (fileTree: FileTree): string[] =>
  RED4EXT_CORE_REQUIRED_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));

  const findDeprecatedCoreRed4extFiles = (fileTree: FileTree): string[] =>
  DEPRECATED_RED4EXT_CORE_REQUIRED_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree));
  
  const detectCoreRed4ext = (fileTree: FileTree): boolean =>
    // We just need to know this looks right, not that it is
    findCoreRed4extFiles(fileTree).length > 0;
  
  const detectDeprecatedCoreRed4ext = (fileTree: FileTree): boolean =>
    // We just need to know this looks right, not that it is
    findDeprecatedCoreRed4extFiles(fileTree).length > 0;

export const testForCetCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryCetFiles = CET_CORE_IDENTIFIERS.every((cetPath) =>
    files.includes(cetPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryCetFiles,
    requiredFiles: [],
  });
};

export const installCetCore: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  log("info", "Using CETCore installer");

  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

export const testForRedscriptCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const containsAllNecessaryRedsFiles = REDSCRIPT_CORE_IDENTIFIERS.every((redsPath) =>
    files.includes(redsPath),
  );

  return Promise.resolve({
    supported: containsAllNecessaryRedsFiles,
    requiredFiles: [],
  });
};

export const installRedscriptCore: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const instructions = instructionsForSameSourceAndDestPaths(files);

  return Promise.resolve({ instructions });
};

export const testRed4ExtCore: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
): Promise<VortexTestResult> =>
    Promise.resolve({
        supported:
        detectCoreRed4ext(fileTree) ||
        detectDeprecatedCoreRed4ext(fileTree),
        requiredFiles: [],
    });

const coreRed4extLayout = (
    _api: VortexApi,
    _modName: string,
    fileTree: FileTree,
  ): MaybeInstructions => {
    const allCanonConfigXmlFiles = findCoreRed4extFiles(fileTree);
  
    if (allCanonConfigXmlFiles.length < 1) {
      return NoInstructions.NoMatch;
    }
  
    return {
      kind: CoreRed4extLayout.OnlyValid,
      instructions: instructionsForSameSourceAndDestPaths(allCanonConfigXmlFiles),
    };
  };
  
  const deprecatedCoreRed4ExtLayout = (
    _api: VortexApi,
    _modName: string,
    fileTree: FileTree,
  ): MaybeInstructions => {
    const allMergeableConfigXmlFiles = findDeprecatedCoreRed4extFiles(fileTree);
  
    if (allMergeableConfigXmlFiles.length < 1) {
      return NoInstructions.NoMatch;
    }
  
    return {
      kind: CoreDeprecatedRed4extLayout.OnlyValid,
      instructions: instructionsForSameSourceAndDestPaths(allMergeableConfigXmlFiles),
    };
  };

export const installRed4ExtCore: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {

  const theGoodGoodInstructions = coreRed4extInstructions(api, fileTree)
  const pluginsDir = [].concat({
    type: "mkdir",
    destination: path.normalize("red4ext/plugins"),
  });
  const instructions = [].concat(theGoodGoodInstructions.instructions, pluginsDir);

  return Promise.resolve({ instructions });
};



export const coreRed4extInstructions = (
    api: VortexApi,
    fileTree: FileTree,
  ): Instructions => {
    const allPossibleConfigXmlLayouts = [
        coreRed4extLayout,
        deprecatedCoreRed4ExtLayout,
      ];
    const selectedInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    allPossibleConfigXmlLayouts,
    );
    if (
        selectedInstructions === NoInstructions.NoMatch ||
        selectedInstructions === InvalidLayout.Conflict
      ) {
        api.log(`debug`, `${InstallerType.CoreRed4ext}: No valid extra canon archives`);
        return { kind: NoLayout.Optional, instructions: [] };
      }

    warnUserIfDeprecatedRed4ext(api, selectedInstructions);
  
    return selectedInstructions;
  };


// Prompts

const warnUserIfDeprecatedRed4ext = (
    api: VortexApi,
    chosenInstructions: Instructions,
  ) => {
    // Trying out the tree-based approach..
    const destinationPaths = chosenInstructions.instructions.map((i) => i.destination);
    const newTree = fileTreeFromPaths(destinationPaths);
  
    // const warnAboutSubdirs = subdirsIn(ARCHIVE_MOD_CANONICAL_PREFIX, newTree).length > 0;
  
    const containsDeprecatedRed4ExtPaths = OLD_RED4EXT_CORE_IDENTIFIERS.every((red4extPath) =>
    filesUnder(FILETREE_ROOT, Glob.Any, newTree).includes(red4extPath),
    );
  
    if (containsDeprecatedRed4ExtPaths) {
        promptUserToInstallOrCancelOnDepecatedRed4ext(
        api,
        filesUnder(FILETREE_ROOT, Glob.Any, newTree),
      );
    }
  };

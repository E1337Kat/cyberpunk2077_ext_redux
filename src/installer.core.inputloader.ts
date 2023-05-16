import {
  VortexApi,
  VortexTestResult,
  VortexInstruction,
} from "./vortex-wrapper";
import {
  FileTree,
  fileCount,
  pathInTree,
  sourcePaths,
} from "./filetree";
import {
  InstallDecision,
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  promptUserToInstallOrCancelOnDeprecatedCoreMod,
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";
import {
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  DEPRECATED_INPUT_LOADER_CORE_FILES,
  INPUT_LOADER_CORE_REQUIRED_FILES,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";

const me = InstallerType.CoreInputLoader;

const DeprecatedCoreInputLoaderInstructions: VortexInstruction[] = [
  {
    type: `generatefile`,
    data: `[Player/Input]\n`,
    destination: `engine\\config\\platform\\pc\\input_loader.ini`,
  },
  {
    type: `mkdir`,
    destination: CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader\\input_loader.dll`,
    destination: `red4ext\\plugins\\input_loader\\input_loader.dll`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader\\inputUserMappings.xml`,
    destination: `red4ext\\plugins\\input_loader\\inputUserMappings.xml`,
  },
];

const CoreInputLoaderInstructions: VortexInstruction[] = [
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader\\license.md`,
    destination: `red4ext\\plugins\\input_loader\\license.md`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader\\readme.md`,
    destination: `red4ext\\plugins\\input_loader\\readme.md`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\input_loader_uninstall.bat`,
    destination: `red4ext\\plugins\\input_loader_uninstall.bat`,
  },
  ...DeprecatedCoreInputLoaderInstructions,
];


const findCoreInputLoaderFiles = (fileTree: FileTree): string[] => [
  ...INPUT_LOADER_CORE_REQUIRED_FILES.V011.filter((requiredFile) => pathInTree(requiredFile, fileTree)),
];

const findDeprecatedCoreInputLoaderFiles = (fileTree: FileTree): string[] => [
  ...DEPRECATED_INPUT_LOADER_CORE_FILES.V010.filter((deprecatedFile) => pathInTree(deprecatedFile, fileTree)),
];

const detectCoreInputLoader = (fileTree: FileTree): boolean =>
  // We just need to know this looks like it should be a core input loader installation, for errors
  findCoreInputLoaderFiles(fileTree).length > 0
  || findDeprecatedCoreInputLoaderFiles(fileTree).length > 0;


// test

export const testForCoreInputLoader: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreInputLoader(fileTree), requiredFiles: [] });


// install


export const installCoreInputLoader: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => {
  const currentInstallationFiles = findCoreInputLoaderFiles(fileTree);

  if (currentInstallationFiles.length === fileCount(fileTree)
    && currentInstallationFiles.length === INPUT_LOADER_CORE_REQUIRED_FILES.V011.length) {
    return Promise.resolve({ instructions: CoreInputLoaderInstructions });
  }

  const deprecatedInstallationFiles = findDeprecatedCoreInputLoaderFiles(fileTree);

  if (deprecatedInstallationFiles.length === fileCount(fileTree)
      && deprecatedInstallationFiles.length === DEPRECATED_INPUT_LOADER_CORE_FILES.V010.length) {
    const infoMessage = `Old core mod version!`;
    api.log(`info`, `${me}: ${infoMessage} Confirming installation.`);

    const confirmedInstructions = await promptUserToInstallOrCancelOnDeprecatedCoreMod(
      api,
      InstallerType.CoreInputLoader,
      [] as string[],
    );

    if (confirmedInstructions === InstallDecision.UserWantsToCancel) {
      const cancelMessage = `${me}: user chose to cancel installing deprecated version`;

      api.log(`warn`, cancelMessage);
      return Promise.reject(new Error(cancelMessage));
    }

    api.log(`info`, `${me}: User confirmed installing deprecated version`);
    return Promise.resolve({ instructions: DeprecatedCoreInputLoaderInstructions });
  }

  const errorMessage = `Didn't Find Expected Input Loader Installation!`;
  api.log(
    `error`,
    `${InstallerType.CoreInputLoader}: ${errorMessage}`,
    sourcePaths(fileTree),
  );

  showWarningForUnrecoverableStructureError(
    api,
    InstallerType.CoreInputLoader,
    errorMessage,
    sourcePaths(fileTree),
  );

  return Promise.reject(new Error(errorMessage));
};

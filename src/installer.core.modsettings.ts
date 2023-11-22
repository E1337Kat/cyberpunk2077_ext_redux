
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
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";
import {
  MOD_SETTINGS_CORE_FILES,
} from "./installers.layouts";
import {
  FeatureSet,
} from "./features";

const me = InstallerType.CoreModSettings;

const CoreModSettingsInstructions: VortexInstruction[] = [
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\license.md`,
    destination: `red4ext\\plugins\\mod_settings\\license.md`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\readme.md`,
    destination: `red4ext\\plugins\\mod_settings\\readme.md`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\ModSettings.archive`,
    destination: `red4ext\\plugins\\mod_settings\\ModSettings.archive`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\ModSettings.archive.xl`,
    destination: `red4ext\\plugins\\mod_settings\\ModSettings.archive.xl`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\mod_settings.dll`,
    destination: `red4ext\\plugins\\mod_settings\\mod_settings.dll`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\module.reds`,
    destination: `red4ext\\plugins\\mod_settings\\module.reds`,
  },
  {
    type: `copy`,
    source: `red4ext\\plugins\\mod_settings\\packed.reds`,
    destination: `red4ext\\plugins\\mod_settings\\packed.reds`,
  },
];


const findCoreModSettingsFiles = (fileTree: FileTree): string[] => [
  ...MOD_SETTINGS_CORE_FILES.filter((requiredFile) => pathInTree(requiredFile, fileTree)),
];


const detectCoreModSettings = (fileTree: FileTree): boolean =>
  // We just need to know this looks like it should be a core mod settings installation, for errors
  findCoreModSettingsFiles(fileTree).length > 0;


// test

export const testForCoreModSettings: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> =>
  Promise.resolve({ supported: detectCoreModSettings(fileTree), requiredFiles: [] });


// install


export const installCoreModSettings: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
) => {
  const currentInstallationFiles = findCoreModSettingsFiles(fileTree);

  if (currentInstallationFiles.length === fileCount(fileTree)
    && currentInstallationFiles.length === MOD_SETTINGS_CORE_FILES.length) {
    return Promise.resolve({ instructions: CoreModSettingsInstructions });
  }

  const errorMessage = `Didn't Find Expected Input Loader Installation!`;
  api.log(
    `error`,
    `${me}: ${errorMessage}`,
    sourcePaths(fileTree),
  );

  showWarningForUnrecoverableStructureError(
    api,
    me,
    errorMessage,
    sourcePaths(fileTree),
  );

  return Promise.reject(new Error(errorMessage));
};

import path from "path";
import {
  map,
} from "fp-ts/lib/ReadonlyArray";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  CONFIG_INI_MOD_BASEDIR,
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  CYBERPUNK_CACHE_PATH,
} from "../../src/installers.layouts";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  copiedToSamePath,
  createdDirectory,
  generatedFile,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  ExampleSucceedingMod,
  pathHierarchyFor,
  RED4EXT_PREFIX,
} from "./utils.helper";
import {
  InstallChoices,
} from "../../src/ui.dialogs";

const inputLoaderInFiles = {
  v012: [
    path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\inputUserMappings.xml`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\license.md`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\readme.md`),
    path.join(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.ini`),
    path.join(`${CYBERPUNK_CACHE_PATH}\\inputContexts.xml`),
    path.join(`${CYBERPUNK_CACHE_PATH}\\inputUserMappings.xml`),
  ],
  v011: [
    path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\inputUserMappings.xml`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\license.md`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\readme.md`),
    path.join(`${RED4EXT_PREFIX}\\input_loader_uninstall.bat`),
  ],
  v010: [
    path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
    path.join(`${RED4EXT_PREFIX}\\input_loader\\inputUserMappings.xml`),
  ],
};


const CoreInputLoaderInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Core Input Loader version v0.1.2 installs without prompting when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreInputLoader,
      inFiles: [
        ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
        ...pathHierarchyFor(`${CONFIG_INI_MOD_BASEDIR}\\`),
        ...pathHierarchyFor(`${CYBERPUNK_CACHE_PATH}\\`),
        ...inputLoaderInFiles.v012,
      ],
      outInstructions: [
        createdDirectory(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}`), // This is a special case
        ...pipe(
          inputLoaderInFiles.v012,
          map(copiedToSamePath),
        ),
      ],
    },
  ],
]);


const CoreInputLoaderDeprecatedPromptsToInstall = new Map<string, ExamplePromptInstallableMod>([
  [
    `Deprecated Core Input Loader version v0.1.1 installs when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreInputLoader,
      inFiles: [
        ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
        ...inputLoaderInFiles.v011,
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        generatedFile(`[Player/Input]\n`, `${CONFIG_INI_MOD_BASEDIR}\\input_loader.ini`),
        createdDirectory(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}`), // This is a special case
        ...pipe(
          inputLoaderInFiles.v011,
          map(copiedToSamePath),
        ),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: `${InstallerType.CoreInputLoader}: user chose to cancel installing deprecated version`,
    },
  ],
  [
    `Deprecated Core Input Loader version v0.1.0 installs when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreInputLoader,
      inFiles: [
        ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
        ...inputLoaderInFiles.v010,
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        generatedFile(`[Player/Input]\n`, `${CONFIG_INI_MOD_BASEDIR}\\input_loader.ini`),
        createdDirectory(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}`), // This is a special case
        ...pipe(
          inputLoaderInFiles.v010,
          map(copiedToSamePath),
        ),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: `${InstallerType.CoreInputLoader}: user chose to cancel installing deprecated version`,
    },
  ],
]);


const CoreInputLoaderInstallFails = new Map<string, ExampleFailingMod>(
  pipe(
    Object.entries(inputLoaderInFiles),
    map(([version, files]) => [
      `Core Input Loader verson ${version} fails without prompting when extra files are present`,
      {
        expectedInstallerType: InstallerType.CoreInputLoader,
        inFiles: [
          ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
          ...files,
          path.join(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.txt`),
        ],
        failure: `Didn't Find Expected Input Loader Installation!`,
        errorDialogTitle: `Didn't Find Expected Input Loader Installation!`,
      },
    ]),
  ),
);


const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreInputLoaderInstallSucceeds,
  AllExpectedDirectFailures: CoreInputLoaderInstallFails,
  AllExpectedPromptInstalls: CoreInputLoaderDeprecatedPromptsToInstall,
};

export default examples;

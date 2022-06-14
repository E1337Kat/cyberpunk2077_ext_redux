import path from "path";
import {
  CONFIG_INI_MOD_BASEDIR,
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  copiedToSamePath,
  createdDirectory,
  createdFile,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  ExampleSucceedingMod,
  pathHierarchyFor,
  RED4EXT_PREFIX,
} from "./utils.helper";

const CoreInputLoaderInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Core Input Loader installs without prompting when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreInputLoader,
      inFiles: [
        ...pathHierarchyFor(CONFIG_INI_MOD_BASEDIR),
        path.join(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.ini`),
        ...pathHierarchyFor(CONFIG_XML_MOD_MERGEABLE_BASEDIR),
        ...pathHierarchyFor(`${RED4EXT_PREFIX}\\input_loader\\`),
        path.join(`${RED4EXT_PREFIX}\\input_loader\\input_loader.dll`),
      ],
      outInstructions: [
        createdFile(`${CONFIG_INI_MOD_BASEDIR}\\input_loader.ini`),
        createdDirectory(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}`), // This is a special case
        copiedToSamePath(`${RED4EXT_PREFIX}\\input_loader\\input.dll`),
      ],
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreInputLoaderInstallSucceeds,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

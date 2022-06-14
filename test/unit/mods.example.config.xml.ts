import path from "path";
import {
  CONFIG_XML_MOD_PROTECTED_FILES,
  CONFIG_XML_MOD_PROTECTED_FILENAMES,
  CONFIG_XML_MOD_BASEDIR,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExamplePromptInstallableMod,
  copiedToSamePath,
  expectedUserCancelProtectedMessageFor,
  expectedUserCancelMessageForHittingFallback,
  ExampleSucceedingMod,
  ExampleFailingMod,
  mergeOrFailOnConflict,
  ExamplesForType,
} from "./utils.helper";

const ConfigXmlModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    configXmlWithRandomNameInCanonicalBasedirWillInstall: {
      expectedInstallerType: InstallerType.ConfigXml,
      inFiles: [path.join(`${CONFIG_XML_MOD_BASEDIR}\\dunnowhythisishere.xml`)],
      outInstructions: [
        copiedToSamePath(path.join(`${CONFIG_XML_MOD_BASEDIR}\\dunnowhythisishere.xml`)),
      ],
    },
  }),
);

const ConfigXmlModShouldPromptToInstall = new Map<string, ExamplePromptInstallableMod>([
  ...CONFIG_XML_MOD_PROTECTED_FILES.map(
    (xml: string): [string, ExamplePromptInstallableMod] => [
      `Protected XML file ${path.basename(xml)} in XML basedir prompts to install`,
      {
        expectedInstallerType: InstallerType.ConfigXml,
        inFiles: [path.join(xml)],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [copiedToSamePath(xml)],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageFor(
          InstallerType.ConfigXml,
        ),
      },
    ],
  ),
  ...CONFIG_XML_MOD_PROTECTED_FILENAMES.map(
    (xmlname: string): [string, ExamplePromptInstallableMod] => [
      `Protected XML file ${xmlname} in toplevel prompts to install into XML basedir`,
      {
        expectedInstallerType: InstallerType.ConfigXml,
        inFiles: [path.join(xmlname)],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [
          {
            type: `copy`,
            source: path.join(xmlname),
            destination: path.join(`${CONFIG_XML_MOD_BASEDIR}\\${xmlname}`),
          },
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageFor(
          InstallerType.ConfigXml,
        ),
      },
    ],
  ),
  [
    `Config XML files when there's a combination of protected and non-protected canonical prompts to install`,
    {
      expectedInstallerType: InstallerType.ConfigXml,
      inFiles: [
        CONFIG_XML_MOD_PROTECTED_FILES[0],
        path.join(`${CONFIG_XML_MOD_BASEDIR}\\weeblewobble.xml`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(CONFIG_XML_MOD_PROTECTED_FILES[0]),
        copiedToSamePath(`${CONFIG_XML_MOD_BASEDIR}\\weeblewobble.xml`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelProtectedMessageFor(InstallerType.ConfigXml),
    },
  ],
  [
    `Config XML files with random XML file in toplevel prompts to install via Fallback`,
    {
      expectedInstallerType: InstallerType.ConfigXml,
      inFiles: [path.join(`myfancy.xml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(path.join(`myfancy.xml`))],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: ConfigXmlModSucceeds,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: mergeOrFailOnConflict(ConfigXmlModShouldPromptToInstall),
};

export default examples;

import path from "path";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  AUDIOWARE_PATH,
  AUDIOWARE_PATHS,
  copiedToSamePath,
  ExamplePromptInstallableMod,
  expectedUserCancelMessageForHittingFallback,
  expectedUserCancelMessageFor,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
} from "./utils.helper";

const AudiowareModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    audiowareWithFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.Audioware,
      inFiles: [
        ...AUDIOWARE_PATHS,
        path.join(`${AUDIOWARE_PATH}\\mytweak.yaml`),
        path.join(`${AUDIOWARE_PATH}\\myothertweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${AUDIOWARE_PATH}\\mytweak.yaml`),
        copiedToSamePath(`${AUDIOWARE_PATH}\\myothertweak.yml`),
      ],
    },
    audiowareWithFilesInSubdirsCanonical: {
      expectedInstallerType: InstallerType.Audioware,
      inFiles: [
        ...AUDIOWARE_PATHS,
        path.join(`${AUDIOWARE_PATH}\\sub1\\mytweak.yaml`),
        path.join(`${AUDIOWARE_PATH}\\sub2\\myothertweak.yml`),
        path.join(`${AUDIOWARE_PATH}\\sub3\\sub4\\mythirdtweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${AUDIOWARE_PATH}\\sub1\\mytweak.yaml`),
        copiedToSamePath(`${AUDIOWARE_PATH}\\sub2\\myothertweak.yml`),
        copiedToSamePath(`${AUDIOWARE_PATH}\\sub3\\sub4\\mythirdtweak.yml`),
      ],
    },
    audiowareWithFilesInBasedirAndSubdirsCanonical: {
      expectedInstallerType: InstallerType.Audioware,
      inFiles: [
        ...AUDIOWARE_PATHS,
        path.join(`${AUDIOWARE_PATH}\\mytweak.yaml`),
        path.join(`${AUDIOWARE_PATH}\\sub2\\myothertweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${AUDIOWARE_PATH}\\mytweak.yaml`),
        copiedToSamePath(`${AUDIOWARE_PATH}\\sub2\\myothertweak.yml`),
      ],
    },
  }),
);

const AudiowareModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    audiowareWithFileAtToplevelPromptsToInstallThroughFallback: {
      expectedInstallerType: InstallerType.Audioware,
      inFiles: [path.join(`mytweak.yaml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`mytweak.yaml`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
    audiowareWithIncorrectFileExtensionPromptsToInstallDirectly: {
      expectedInstallerType: InstallerType.Audioware,
      inFiles: [path.join(`${AUDIOWARE_PATH}\\mytweak.xml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`${AUDIOWARE_PATH}\\mytweak.xml`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Audioware),
    },
  }),
);
const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(AudiowareModSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: mergeOrFailOnConflict(AudiowareModShouldPromptForInstall),
};

export default examples;

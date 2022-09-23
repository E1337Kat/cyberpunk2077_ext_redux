import path from "path";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  TWEAK_XL_PATHS,
  TWEAK_XL_PATH,
  copiedToSamePath,
  ExamplePromptInstallableMod,
  expectedUserCancelMessageForHittingFallback,
  expectedUserCancelMessageFor,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
} from "./utils.helper";

const TweakXLModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    tweakXLWithFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        path.join(`${TWEAK_XL_PATH}\\myothertweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\myothertweak.yml`),
      ],
    },
    tweakXLWithFilesInSubdirsCanonical: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\sub1\\mytweak.yaml`),
        path.join(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
        path.join(`${TWEAK_XL_PATH}\\sub3\\sub4\\mythirdtweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub1\\mytweak.yaml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub3\\sub4\\mythirdtweak.yml`),
      ],
    },
    tweakXLWithFilesInBasedirAndSubdirsCanonical: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        path.join(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
      ],
    },
  }),
);

const TweakXLModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    tweakXLWithFileAtToplevelPromptsToInstallThroughFallback: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [path.join(`mytweak.yaml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`mytweak.yaml`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
    tweakXLWithIncorrectFileExtensionPromptsToInstallDirectly: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [path.join(`${TWEAK_XL_PATH}\\mytweak.xml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`${TWEAK_XL_PATH}\\mytweak.xml`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.TweakXL),
    },
  }),
);
const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(TweakXLModSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: mergeOrFailOnConflict(TweakXLModShouldPromptForInstall),
};

export default examples;

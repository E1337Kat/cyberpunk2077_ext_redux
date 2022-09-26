import path from "path";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExamplePromptInstallableMod,
  expectedUserCancelMessageForHittingFallback,
  pathHierarchyFor,
  FAKE_STAGING_PATH,
  ExamplesForType,
  ExampleFailingMod,
  ExampleSucceedingMod,
} from "./utils.helper";

const FallbackForNonMatchedAndInvalidShouldPromptForInstall =
  new Map<string, ExamplePromptInstallableMod>(
    Object.entries({
      invalidModContainingJustAnExe: {
        expectedInstallerType: InstallerType.Fallback,
        inFiles: [path.normalize(`bin/myProg.exe`)],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [
          {
            type: `copy`,
            source: path.normalize(`bin/myProg.exe`),
            destination: path.normalize(`bin/myProg.exe`),
          },
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
      },
      invalidModContainingRandomFiles: {
        expectedInstallerType: InstallerType.Fallback,
        inFiles: [`Categorized AIO Command List.xlsx`, `readme.md`],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [
          {
            type: `copy`,
            source: path.normalize(`Categorized AIO Command List.xlsx`),
            destination: path.normalize(`Categorized AIO Command List.xlsx`),
          },
          {
            type: `copy`,
            source: path.normalize(`readme.md`),
            destination: path.normalize(`readme.md`),
          },
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
      },
      invalidModWithDeepInvalidPath: {
        expectedInstallerType: InstallerType.Fallback,
        inFiles: [
          ...pathHierarchyFor(FAKE_STAGING_PATH),
          path.join(FAKE_STAGING_PATH, `toodles.txt`),
        ],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [
          {
            type: `copy`,
            source: path.join(FAKE_STAGING_PATH, `toodles.txt`),
            destination: path.join(FAKE_STAGING_PATH, `toodles.txt`),
          },
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
      },
    }), // object
  );
const examples: ExamplesForType = {
  AllExpectedSuccesses: new Map<string, ExampleSucceedingMod>(),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: FallbackForNonMatchedAndInvalidShouldPromptForInstall,
};

export default examples;

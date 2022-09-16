import path from "path";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  copiedToSamePath,
  expectedUserCancelMessageForDeprecated,
  CORE_REDSCRIPT_PREFIXES,
  DEPRECATED_CORE_REDSCRIPT_PREFIXES,
} from "./utils.helper";

const CoreRedscriptInstallSuccesses = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    validCoreRedscriptFileLayout: {
      expectedInstallerType: InstallerType.CoreRedscript,
      inFiles: [
        ...CORE_REDSCRIPT_PREFIXES,
        path.normalize(`engine\\config\\base\\scripts.ini`),
        path.normalize(`engine\\tools\\scc.exe`),
        path.normalize(`r6\\config\\cybercmd\\scc.toml`),
      ],
      outInstructions: [
        copiedToSamePath(`engine\\config\\base\\scripts.ini`),
        copiedToSamePath(`engine\\tools\\scc.exe`),
        copiedToSamePath(`r6\\config\\cybercmd\\scc.toml`),
      ],
    },
  }),
);

const CoreRedscriptDeprecatedPromptables = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    deprecatedCoreRedscriptFileLayout: {
      expectedInstallerType: InstallerType.CoreRedscript,
      inFiles: [
        ...DEPRECATED_CORE_REDSCRIPT_PREFIXES,
        path.normalize(`engine\\config\\base\\scripts.ini`),
        path.normalize(`engine\\tools\\scc.exe`),
        path.normalize(`r6\\scripts\\redscript.toml`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`engine\\config\\base\\scripts.ini`),
        copiedToSamePath(`engine\\tools\\scc.exe`),
        copiedToSamePath(`r6\\scripts\\redscript.toml`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForDeprecated(InstallerType.CoreRedscript),
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreRedscriptInstallSuccesses,
  // No point to add failures, we test for all required files
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: CoreRedscriptDeprecatedPromptables,
};

export default examples;

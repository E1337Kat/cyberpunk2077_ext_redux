import path from "path";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  REDS_PREFIXES,
  REDS_PREFIX,
  FAKE_MOD_NAME,
  ExamplePromptInstallableMod,
  expectedUserCancelMessageFor,
  ExamplesForType,
  ExampleFailingMod,
  copiedToSamePath,
} from "./utils.helper";

const RedscriptModShouldSucceed = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    redsWithBasedirAndCanonicalFilesInstallsToSubdir: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/yay.reds`),
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}\\yay.reds`),
          destination: path.join(`${REDS_PREFIX}\\${FAKE_MOD_NAME}\\yay.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}\\rexmod\\script.reds`),
          destination: path.join(`${REDS_PREFIX}\\${FAKE_MOD_NAME}\\rexmod\\script.reds`),
        },
      ],
    },
    redsWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
      ],
    },
    redsWithMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
        },
      ],
    },
    redsIncludingNonRedsFilesCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        path.join(`${REDS_PREFIX}/rexmod/options.json`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/options.json`),
          destination: path.join(`${REDS_PREFIX}/rexmod/options.json`),
        },
      ],
    },
    redsSingleScriptTopLevel: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [path.join(`script.reds`)],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`script.reds`),
          destination: path.join(`${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`),
        },
      ],
    },
    redsWithMultipleFilesInRedsBaseDir: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/`),
        path.join(`${REDS_PREFIX}/script.reds`),
        path.join(`${REDS_PREFIX}/notascript.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/script.reds`),
          destination: path.join(`${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/notascript.reds`),
          destination: path.join(`${REDS_PREFIX}/${FAKE_MOD_NAME}/notascript.reds`),
        },
      ],
    },
    redsWithFirstRedsFilesInDeepSubdir: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/dirname/`),
        path.join(`${REDS_PREFIX}/rexmod/dirname/anotherdirname/`),
        path.join(`${REDS_PREFIX}/rexmod/dirname/anotherdirname/patch.reds`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/dirname/anotherdirname/patch.reds`),
      ],
    },
  }),
);

const RedscriptModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    redsWithRedsInToplevelSubdirPromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [path.join(`rexmod/script.reds`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.join(`rexmod/script.reds`),
          destination: path.join(`rexmod/script.reds`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Redscript),
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: RedscriptModShouldSucceed,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: RedscriptModShouldPromptForInstall,
};

export default examples;

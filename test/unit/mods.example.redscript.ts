import path from "path";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  InstallChoices,
} from "../../src/ui.dialogs";
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
  movedFromTo,
  REDS_HINTS,
  FAKE_MOD_NAME_CURRENT_NEXUS,
  FAKE_STAGING_PATH_CURRENT_NEXUS,
  REDS_STORAGES,
  REDS_STORAGES_PREFIXES,
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
        movedFromTo(
          `${REDS_PREFIX}/yay.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/yay.reds`,
        ),
        movedFromTo(
          `${REDS_PREFIX}/rexmod/script.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/rexmod/script.reds`,
        ),
      ],
    },
    redsWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
      ],
      outInstructions: [copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`)],
    },
    redsWithSingleFileCanonicalUppercase: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/SCRIPT.REDS`),
      ],
      outInstructions: [copiedToSamePath(`${REDS_PREFIX}/rexmod/SCRIPT.REDS`)],
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
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/notascript.reds`),
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
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/options.json`),
      ],
    },
    redsSingleScriptTopLevel: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [path.join(`script.reds`)],
      outInstructions: [
        movedFromTo(`script.reds`, `${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`),
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
        movedFromTo(
          `${REDS_PREFIX}/script.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`,
        ),
        movedFromTo(
          `${REDS_PREFIX}/notascript.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/notascript.reds`,
        ),
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
    redsWithUserHintsFileCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_HINTS}/whatevs.toml`),
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_HINTS}/whatevs.toml`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
      ],
    },
    redsWithUserHintsBasedir: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_HINTS}/whatevs.toml`),
        path.join(`${REDS_PREFIX}/script.reds`),
        path.join(`${REDS_PREFIX}/notascript.reds`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_HINTS}/whatevs.toml`),
        movedFromTo(
          `${REDS_PREFIX}/script.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`,
        ),
        movedFromTo(
          `${REDS_PREFIX}/notascript.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/notascript.reds`,
        ),
      ],
    },
    redsWithOnlyUserHintsFile: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_HINTS}/whatevs.toml`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_HINTS}/whatevs.toml`),
      ],
    },
    redsBasedirFromCurrentNexusFilenameInstallsToModNamedSubdir: {
      expectedInstallerType: InstallerType.Redscript,
      stagingPath: FAKE_STAGING_PATH_CURRENT_NEXUS,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/script.reds`),
      ],
      outInstructions: [
        movedFromTo(
          `${REDS_PREFIX}/script.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME_CURRENT_NEXUS}/script.reds`,
        ),
      ],
    },
    redsCanonicalWithStoragesFiles: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...REDS_STORAGES_PREFIXES,
        path.join(`${REDS_STORAGES}/rexmod/`),
        path.join(`${REDS_STORAGES}/rexmod/data.json`),
        path.join(`${REDS_STORAGES}/RedscriptConfigFramework/`),
        path.join(`${REDS_STORAGES}/RedscriptConfigFramework/rexmod.card.json`),
        path.join(`${REDS_STORAGES}/RedscriptConfigFramework/rexmod.docs.txt`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${REDS_STORAGES}/rexmod/data.json`),
        copiedToSamePath(`${REDS_STORAGES}/RedscriptConfigFramework/rexmod.card.json`),
        copiedToSamePath(`${REDS_STORAGES}/RedscriptConfigFramework/rexmod.docs.txt`),
      ],
    },
    redsBasedirWithStoragesFiles: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/script.reds`),
        ...REDS_STORAGES_PREFIXES,
        path.join(`${REDS_STORAGES}/RedscriptConfigFramework/`),
        path.join(`${REDS_STORAGES}/RedscriptConfigFramework/rexmod.card.json`),
      ],
      outInstructions: [
        movedFromTo(
          `${REDS_PREFIX}/script.reds`,
          `${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`,
        ),
        copiedToSamePath(`${REDS_STORAGES}/RedscriptConfigFramework/rexmod.card.json`),
      ],
    },
    redsWithOnlyStoragesFiles: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_STORAGES_PREFIXES,
        path.join(`${REDS_STORAGES}/HUDPainter/`),
        path.join(`${REDS_STORAGES}/HUDPainter/PRESET.json`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_STORAGES}/HUDPainter/PRESET.json`),
      ],
    },
    redsToplevelWithSideFilesKeepsSideFilesInPlace: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        path.join(`script.reds`),
        ...REDS_PREFIXES,
        path.join(`${REDS_HINTS}/whatevs.toml`),
        ...REDS_STORAGES_PREFIXES,
        path.join(`${REDS_STORAGES}/HUDPainter/`),
        path.join(`${REDS_STORAGES}/HUDPainter/PRESET.json`),
      ],
      outInstructions: [
        movedFromTo(`script.reds`, `${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`),
        copiedToSamePath(`${REDS_HINTS}/whatevs.toml`),
        copiedToSamePath(`${REDS_STORAGES}/HUDPainter/PRESET.json`),
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
      proceedOutInstructions: [copiedToSamePath(`rexmod/script.reds`)],
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

import path from "path";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  CONFIG_JSON_MOD_BASEDIR_PLATFORM,
  CONFIG_JSON_MOD_BASEDIR_SETTINGS,
  CONFIG_JSON_MOD_FIXABLE_FILENAMES_TO_PATHS,
  CONFIG_JSON_MOD_PROTECTED_DIRS,
  CONFIG_JSON_MOD_PROTECTED_FILES,
  CONFIG_JSON_MOD_UNFIXABLE_FILENAMES,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplesForType,
  ExamplePromptInstallableMod,
  expectedUserCancelMessageFor,
  copiedToSamePath,
  mergeOrFailOnConflict,
  expectedUserCancelProtectedMessageFor,
  mockedFsLayout,
} from "./utils.helper";

const RANDOM_FAKE_JSON = JSON.stringify({ empty: true });

const JsonModShouldPromptOnProtected = new Map<string, ExamplePromptInstallableMod>(
  CONFIG_JSON_MOD_PROTECTED_FILES.map((protectedPath) => [
    `JSON prompts to install protected file ${protectedPath}`,
    {
      expectedInstallerType: InstallerType.ConfigJson,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [protectedPath],
      proceedOutInstructions: [copiedToSamePath(protectedPath)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelProtectedMessageFor(InstallerType.ConfigJson),
    },
  ]),
);

const JsonModShouldPromptOnProtectedFilenameToplevelFixables = new Map<
  string,
  ExamplePromptInstallableMod
>(
  Object.keys(CONFIG_JSON_MOD_FIXABLE_FILENAMES_TO_PATHS).map((protectedName) => [
    `JSON prompts to install protected filename to correct dir when ${protectedName}`,
    {
      expectedInstallerType: InstallerType.ConfigJson,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [path.join(protectedName)],
      // AMM also looks at these
      fsMocked: mockedFsLayout(Object.fromEntries([[protectedName, RANDOM_FAKE_JSON]])),
      proceedOutInstructions: [
        {
          type: `copy`,
          source: path.join(protectedName),
          destination: path.join(
            CONFIG_JSON_MOD_FIXABLE_FILENAMES_TO_PATHS[protectedName],
          ),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelProtectedMessageFor(InstallerType.ConfigJson),
    },
  ]),
);

// A bit silly these are separate but -.-
const JsonModShouldPromptOnProtectedFilenameToplevelUnfixables = new Map<
  string,
  ExamplePromptInstallableMod
>(
  CONFIG_JSON_MOD_UNFIXABLE_FILENAMES.map((protectedName) => [
    `JSON prompts to install unfixable protected filename as is because we don't know where to put it ${protectedName}`,
    {
      expectedInstallerType: InstallerType.ConfigJson,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [path.join(protectedName)],
      // AMM also looks at these
      fsMocked: mockedFsLayout(Object.fromEntries([[protectedName, RANDOM_FAKE_JSON]])),
      proceedOutInstructions: [copiedToSamePath(path.join(protectedName))],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.ConfigJson),
    },
  ]),
);

const JsonModShouldPromptOnUnknownJsonInConfigDirs = new Map<
  string,
  ExamplePromptInstallableMod
>(
  CONFIG_JSON_MOD_PROTECTED_DIRS.map((protectedDir) => [
    `JSON prompts to install any unknown JSON in protected dir ${protectedDir}`,
    {
      expectedInstallerType: InstallerType.ConfigJson,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [path.join(protectedDir, `some.json`)],
      proceedOutInstructions: [copiedToSamePath(path.join(protectedDir, `some.json`))],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.ConfigJson),
    },
  ]),
);

const JsonModGoesToFallbackPromptWhenUnknownsCombinedWithProtected = new Map<
  string,
  ExamplePromptInstallableMod
>(
  Object.entries({
    "JSON will go to conflict fallback prompt with protected and unknown files in basedir":
      {
        expectedInstallerType: InstallerType.ConfigJson,
        proceedLabel: InstallChoices.Proceed,
        inFiles: [
          path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
          path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\some.json`),
        ],
        proceedOutInstructions: [
          copiedToSamePath(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
          copiedToSamePath(path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\some.json`)),
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageFor(
          InstallerType.ConfigJson,
        ),
      },
  }),
);

const JsonModGoesToFallbackPromptOnOtherUnknownJsons = new Map<
  string,
  ExamplePromptInstallableMod
>(
  Object.entries({
    "JSON will go to no-match fallback prompt when only unknown files in basedir": {
      expectedInstallerType: InstallerType.ConfigJson,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [
        path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\some.json`),
        path.join(`${CONFIG_JSON_MOD_BASEDIR_PLATFORM}\\someother.json`),
      ],
      proceedOutInstructions: [
        copiedToSamePath(path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\some.json`)),
        copiedToSamePath(
          path.join(`${CONFIG_JSON_MOD_BASEDIR_PLATFORM}\\someother.json`),
        ),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.ConfigJson),
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: new Map<string, ExampleSucceedingMod>(),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: mergeOrFailOnConflict(
    JsonModShouldPromptOnProtected,
    JsonModShouldPromptOnProtectedFilenameToplevelFixables,
    JsonModShouldPromptOnProtectedFilenameToplevelUnfixables,
    JsonModShouldPromptOnUnknownJsonInConfigDirs,
    JsonModGoesToFallbackPromptWhenUnknownsCombinedWithProtected,
    JsonModGoesToFallbackPromptOnOtherUnknownJsons,
  ),
};

export default examples;

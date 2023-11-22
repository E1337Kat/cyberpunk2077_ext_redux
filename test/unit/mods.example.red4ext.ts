import path from "path";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  map,
} from "fp-ts/lib/ReadonlyArray";
import {
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS,
} from "../../src/installers.layouts";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  InstallChoices,
} from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  RED4EXT_PREFIXES,
  RED4EXT_PREFIX,
  FAKE_MOD_NAME,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  expectedUserCancelMessageFor,
  expectedUserCancelMessageForHittingFallback,
  ExamplesForType,
  copiedToSamePath,
} from "./utils.helper";

const Red4ExtModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    red4extWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        },
      ],
    },
    red4extWithMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/notascript.dll`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/notascript.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/notascript.dll`),
        },
      ],
    },
    red4extWithRedScriptEmbeddedCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/module.reds`),
        path.join(`${RED4EXT_PREFIX}/r4emod/readme.md`),
      ],
      outInstructions: [
        ...pipe(
          [
            path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
            path.join(`${RED4EXT_PREFIX}/r4emod/module.reds`),
            path.join(`${RED4EXT_PREFIX}/r4emod/readme.md`),
          ],
          map(copiedToSamePath),
        ),
      ],
    },
    red4extIncludingNonRedsAndNonemptySubdirsCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/subsies/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/subsies/whoa.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/subsies/totally.dude`),
        path.join(`${RED4EXT_PREFIX}/r4emod/emptysubs/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/options.json`),
        path.join(`${RED4EXT_PREFIX}/r4emod/instructions.txt`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/options.json`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/options.json`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/instructions.txt`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/instructions.txt`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/whoa.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/whoa.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/totally.dude`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/totally.dude`),
        },
      ],
    },
    red4extWithDllsInBasedirIsFixableNameable: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/`),
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        path.join(`${RED4EXT_PREFIX}/notascript.dll`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/notascript.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/notascript.dll`),
        },
      ],
    },
    red4extWithFilesInBasedirANDSubdirsIeInCanonicalIsFixableNameable: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        path.join(`${RED4EXT_PREFIX}/notcanonicalnow/`),
        path.join(`${RED4EXT_PREFIX}/notcanonicalnow/notascript.dll`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/notcanonicalnow/notascript.dll`),
          destination: path.join(
            `${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/notcanonicalnow/notascript.dll`,
          ),
        },
      ],
    },
    red4extWithFilesInToplevelAndMaybeSubdirsIsFixableModnamed: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`script.dll`),
        path.join(`notcanonicalnow/`),
        path.join(`notcanonicalnow/notascript.dll`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`notcanonicalnow/notascript.dll`),
          destination: path.join(
            `${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/notcanonicalnow/notascript.dll`,
          ),
        },
      ],
    },
    red4extWithFilesInToplevelSubdirIsFixable: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`notcanonicalnow/`),
        path.join(`notcanonicalnow/notascript.dll`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`notcanonicalnow/notascript.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/notcanonicalnow/notascript.dll`),
        },
      ],
    },
  }),
);

const Red4ExtModShouldFailInTest = new Map<string, ExampleFailingMod>([
  ...RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS.map(
    (dir: string): [string, ExampleFailingMod] => [
      `red4ext DLL in dangerous dir ${dir}`,
      {
        expectedInstallerType: InstallerType.Red4Ext,
        inFiles: [path.join(dir, `some.dll`)],
        failure: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
        errorDialogTitle: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
      },
    ],
  ),
  ...RED4EXT_KNOWN_NONOVERRIDABLE_DLLS.map((dll: string): [string, ExampleFailingMod] => [
    `red4ext DLL with reserved name ${dll}`,
    {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [path.join(`bin/x64/scripties.dll`)],
      failure: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
      errorDialogTitle: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
    },
  ]),
]);

const Red4ExtModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    red4extWithMultipleSubdirsPromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        path.join(`subdir1/`),
        path.join(`subdir1/script1.dll`),
        path.join(`subdir2/`),
        path.join(`subdir2/script2.dll`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: `copy`,
          source: path.join(`subdir1\\script1.dll`),
          destination: path.join(`subdir1\\script1.dll`),
        },
        {
          type: `copy`,
          source: path.join(`subdir2\\script2.dll`),
          destination: path.join(`subdir2\\script2.dll`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Red4Ext),
    },
    red4extWithExtraArchivesInWrongPlacePromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        path.join(`subdir1/`),
        path.join(`subdir1/script1.dll`),
        path.join(`outtaplace.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: `copy`,
          source: path.join(`subdir1\\script1.dll`),
          destination: path.join(`subdir1\\script1.dll`),
        },
        {
          type: `copy`,
          source: path.join(`outtaplace.archive`),
          destination: path.join(`outtaplace.archive`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: Red4ExtModSucceeds,
  AllExpectedDirectFailures: Red4ExtModShouldFailInTest,
  AllExpectedPromptInstalls: Red4ExtModShouldPromptForInstall,
};

export default examples;

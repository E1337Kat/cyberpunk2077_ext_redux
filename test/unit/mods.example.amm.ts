import path from "path";
import {
  AMM_BASEDIR_PATH,
  ARCHIVE_MOD_CANONICAL_PREFIX,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExamplesForType,
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  pathHierarchyFor,
  copiedToSamePath,
  ARCHIVE_PREFIXES,
  mergeOrFailOnConflict,
  expectedUserCancelMessageFor,
} from "./utils.helper";

const AMM_BASE_PREFIXES = pathHierarchyFor(AMM_BASEDIR_PATH);

const AmmModCanonicalCollabsInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `custom appearance lua in canonical location`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Appearances\\custapp.lua`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Appearances\\custapp.lua`),
      ],
    },
  ],
  [
    `custom entity lua in canonical location`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
      ],
    },
  ],
  [
    `custom prop lua in canonical location`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
      ],
    },
  ],
  [
    `custom combinations in canonical location`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
      ],
    },
  ],
  [
    `customs including extra archives in canonical location`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        copiedToSamePath(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
    },
  ],
]);

const AmmModCanonicalUserStuffModsInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  [
    [
      `decor json in canonical location`,
      {
        expectedInstallerType: InstallerType.AMM,
        inFiles: [
          ...AMM_BASE_PREFIXES,
          path.join(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        ],
        outInstructions: [
          copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        ],
      },
    ],
    [
      `location json in canonical location`,
      {
        expectedInstallerType: InstallerType.AMM,
        inFiles: [
          ...AMM_BASE_PREFIXES,
          path.join(`${AMM_BASEDIR_PATH}\\User\\Locations\\loc.json`),
        ],
        outInstructions: [
          copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Locations\\loc.json`),
        ],
      },
    ],
    [
      `script json in canonical location`,
      {
        expectedInstallerType: InstallerType.AMM,
        inFiles: [
          ...AMM_BASE_PREFIXES,
          path.join(`${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`),
        ],
        outInstructions: [
          copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`),
        ],
      },
    ],
    [
      `theme json in canonical location`,
      {
        expectedInstallerType: InstallerType.AMM,
        inFiles: [
          ...AMM_BASE_PREFIXES,
          path.join(`${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`),
        ],
        outInstructions: [
          copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`),
        ],
      },
    ],
    [
      `user things combined in canonical location`,
      {
        expectedInstallerType: InstallerType.AMM,
        inFiles: [
          ...AMM_BASE_PREFIXES,
          path.join(`${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`),
          path.join(`${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`),
        ],
        outInstructions: [
          copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`),
          copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`),
        ],
      },
    ],
  ],
);

const AmmModCanonicalCombinationsInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `combining canonicals`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        copiedToSamePath(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
    },
  ],
]);

const AmmModNonConformingLayoutsPromptToInstall = new Map<
  string,
  ExamplePromptInstallableMod
>([
  [
    `luas in user dir prompt to install since should be jsons present at least`,
    {
      expectedInstallerType: InstallerType.CoreAmm,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.lua`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.lua`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.AMM),
    },
  ],
  [
    `jsons in collabs dir prompt to install since should be luas present at least`,
    {
      expectedInstallerType: InstallerType.CoreAmm,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custdecor.json`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custdecor.json`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.AMM),
    },
  ],
  [
    `files in AMM basedir only even if possibly supported`,
    {
      expectedInstallerType: InstallerType.CoreAmm,
      inFiles: [...AMM_BASE_PREFIXES, path.join(`${AMM_BASEDIR_PATH}\\noidea.lua`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`${AMM_BASEDIR_PATH}\\noidea.lua`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.AMM),
    },
  ],
  [
    `files in AMM basedir even if there are other, supported files in correct places`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        path.join(`${AMM_BASEDIR_PATH}\\wtf.md`),
        path.join(`${AMM_BASEDIR_PATH}\\swhatisaid.lua`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\wtf.md`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\swhatisaid.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        copiedToSamePath(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.AMM),
    },
  ],
]);

/*
const AmmModToplevelsMatchingSchemaInstallSucceeds = new Map<
  string,
  ExampleSucceedingMod
>([
  [
    `customs and user stuffs identified in canonical location for type (plus archives)`,
    {
      expectedInstallerType: InstallerType.AMM,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Appearances\\custapp.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        path.join(`${AMM_BASEDIR_PATH}\\User\\Locations\\loc.json`),
        path.join(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        path.join(`${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`),
        path.join(`${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Appearances\\custapp.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Locations\\loc.json`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`),
        copiedToSamePath(`${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`),

        copiedToSamePath(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`),
      ],
    },
  ],
]);
*/

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    AmmModCanonicalCollabsInstallSucceeds,
    AmmModCanonicalUserStuffModsInstallSucceeds,
    AmmModCanonicalCombinationsInstallSucceeds,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: mergeOrFailOnConflict(
    AmmModNonConformingLayoutsPromptToInstall,
  ),
};

export default examples;

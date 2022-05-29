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
  ARCHIVE_PREFIXES,
  mergeOrFailOnConflict,
  expectedUserCancelMessageFor,
  movedFromTo,
  copiedToSamePath,
} from "./utils.helper";

const AMM_BASE_PREFIXES = pathHierarchyFor(AMM_BASEDIR_PATH);

const AMM_CANON_AND_TOPLEVEL_TEST_PREFIXES = [
  {
    kind: `canonical`,
    ammPrefixes: AMM_BASE_PREFIXES,
    ammPrefix: AMM_BASEDIR_PATH,
    archivePrefixes: ARCHIVE_PREFIXES,
    archivePrefix: ARCHIVE_MOD_CANONICAL_PREFIX,
    expectedNoMatchPromptType: InstallerType.AMM,
  },
  {
    kind: `toplevel canonical subdir`,
    ammPrefixes: [],
    ammPrefix: `.`,
    archivePrefixes: [],
    archivePrefix: `.`,
    expectedNoMatchPromptType: InstallerType.Fallback,
  },
];

const AmmModCanonicalCollabsInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  AMM_CANON_AND_TOPLEVEL_TEST_PREFIXES.flatMap(
    ({ kind, ammPrefixes, ammPrefix, archivePrefixes, archivePrefix }) => [
      [
        `custom appearance lua in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Appearances\\custapp.lua`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Appearances\\custapp.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Appearances\\custapp.lua`,
            ),
          ],
        },
      ],
      [
        `custom entity lua in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`,
            ),
          ],
        },
      ],
      [
        `custom prop lua in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`,
            ),
          ],
        },
      ],
      [
        `custom combinations in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
            path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`,
            ),
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`,
            ),
          ],
        },
      ],
      [
        `customs including extra archives in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
            ...archivePrefixes,
            path.join(`${archivePrefix}\\custent.archive`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`,
            ),
            movedFromTo(
              path.join(`${archivePrefix}\\custent.archive`),
              `${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`,
            ),
          ],
        },
      ],
    ],
  ),
);

const AmmModCanonicalUserStuffModsInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  AMM_CANON_AND_TOPLEVEL_TEST_PREFIXES.flatMap(
    ({ kind, ammPrefixes, ammPrefix, archivePrefixes, archivePrefix }) => [
      [
        `decor json in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\User\\Decor\\custdecor.json`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Decor\\custdecor.json`),
              `${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`,
            ),
          ],
        },
      ],
      [
        `location json in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [...ammPrefixes, path.join(`${ammPrefix}\\User\\Locations\\loc.json`)],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Locations\\loc.json`),
              `${AMM_BASEDIR_PATH}\\User\\Locations\\loc.json`,
            ),
          ],
        },
      ],
      [
        `script json in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\User\\Scripts\\weeflekit.json`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Scripts\\weeflekit.json`),
              `${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`,
            ),
          ],
        },
      ],
      [
        `theme json in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\User\\Themes\\mytheme.json`),
          ],
          outInstructions: [
            movedFromTo(
              `${ammPrefix}\\User\\Themes\\mytheme.json`,
              `${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`,
            ),
          ],
        },
      ],
      [
        `user things combined in ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\User\\Themes\\mytheme.json`),
            path.join(`${ammPrefix}\\User\\Scripts\\weeflekit.json`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Themes\\mytheme.json`),
              `${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`,
            ),
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Scripts\\weeflekit.json`),
              `${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`,
            ),
          ],
        },
      ],
      [
        `user things combined in ${kind}, with archives`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\User\\Themes\\mytheme.json`),
            path.join(`${ammPrefix}\\User\\Scripts\\weeflekit.json`),
            ...archivePrefixes,
            path.join(`${archivePrefix}\\weeflekit.archive`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Themes\\mytheme.json`),
              `${AMM_BASEDIR_PATH}\\User\\Themes\\mytheme.json`,
            ),
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Scripts\\weeflekit.json`),
              `${AMM_BASEDIR_PATH}\\User\\Scripts\\weeflekit.json`,
            ),
            movedFromTo(
              path.join(`${archivePrefix}\\weeflekit.archive`),
              `${ARCHIVE_MOD_CANONICAL_PREFIX}\\weeflekit.archive`,
            ),
          ],
        },
      ],
    ],
  ),
);

const AmmModCanonicalCombinationsInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  AMM_CANON_AND_TOPLEVEL_TEST_PREFIXES.flatMap(
    ({ kind, ammPrefixes, ammPrefix, archivePrefixes, archivePrefix }) => [
      [
        `combining ${kind} AMMs`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
            path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
            path.join(`${ammPrefix}\\User\\Decor\\custdecor.json`),
            ...archivePrefixes,
            path.join(`${archivePrefix}\\custent.archive`),
          ],
          outInstructions: [
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Props\\custprop.lua`,
            ),
            movedFromTo(
              path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
              `${AMM_BASEDIR_PATH}\\Collabs\\Custom Entities\\custent.lua`,
            ),
            movedFromTo(
              path.join(`${ammPrefix}\\User\\Decor\\custdecor.json`),
              `${AMM_BASEDIR_PATH}\\User\\Decor\\custdecor.json`,
            ),
            movedFromTo(
              path.join(`${archivePrefix}\\custent.archive`),
              `${ARCHIVE_MOD_CANONICAL_PREFIX}\\custent.archive`,
            ),
          ],
        },
      ],
    ],
  ),
);

const AmmModNonConformingLayoutsPromptToInstall = new Map<
  string,
  ExamplePromptInstallableMod
>(
  AMM_CANON_AND_TOPLEVEL_TEST_PREFIXES.flatMap(
    ({
      kind,
      ammPrefixes,
      ammPrefix,
      archivePrefixes,
      archivePrefix,
      expectedNoMatchPromptType,
    }) => [
      [
        `luas in user dir prompt with ${expectedNoMatchPromptType} to install since should be jsons present at least for ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\User\\Decor\\custdecor.lua`),
          ],
          proceedLabel: InstallChoices.Proceed,
          proceedOutInstructions: [
            copiedToSamePath(path.join(`${ammPrefix}\\User\\Decor\\custdecor.lua`)),
          ],
          cancelLabel: InstallChoices.Cancel,
          cancelErrorMessage: expectedUserCancelMessageFor(expectedNoMatchPromptType),
        },
      ],
      [
        `jsons in collabs dir prompt with ${expectedNoMatchPromptType} to install since should be luas present at least for ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Props\\custdecor.json`),
          ],
          proceedLabel: InstallChoices.Proceed,
          proceedOutInstructions: [
            copiedToSamePath(
              path.join(`${ammPrefix}\\Collabs\\Custom Props\\custdecor.json`),
            ),
          ],
          cancelLabel: InstallChoices.Cancel,
          cancelErrorMessage: expectedUserCancelMessageFor(expectedNoMatchPromptType),
        },
      ],
      [
        `files in AMM basedir even if there are other, supported files in correct places for ${kind}`,
        {
          expectedInstallerType: InstallerType.AMM,
          inFiles: [
            ...ammPrefixes,
            path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
            path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
            path.join(`${ammPrefix}\\User\\Decor\\custdecor.json`),
            path.join(`${ammPrefix}\\wtf.md`),
            path.join(`${ammPrefix}\\swhatisaid.lua`),
            ...archivePrefixes,
            path.join(`${archivePrefix}\\custent.archive`),
          ],
          proceedLabel: InstallChoices.Proceed,
          proceedOutInstructions: [
            copiedToSamePath(
              path.join(`${ammPrefix}\\Collabs\\Custom Props\\custprop.lua`),
            ),
            copiedToSamePath(
              path.join(`${ammPrefix}\\Collabs\\Custom Entities\\custent.lua`),
            ),
            copiedToSamePath(path.join(`${ammPrefix}\\User\\Decor\\custdecor.json`)),
            copiedToSamePath(path.join(`${ammPrefix}\\wtf.md`)),
            copiedToSamePath(path.join(`${ammPrefix}\\swhatisaid.lua`)),
            copiedToSamePath(path.join(`${archivePrefix}\\custent.archive`)),
          ],
          cancelLabel: InstallChoices.Cancel,
          cancelErrorMessage: expectedUserCancelMessageFor(expectedNoMatchPromptType),
        },
      ],
    ],
  ),
);

const AmmModNonConformingCanonDirOnlyLayoutsPromptToInstall = new Map<
  string,
  ExamplePromptInstallableMod
>([
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
    AmmModNonConformingCanonDirOnlyLayoutsPromptToInstall,
  ),
};

export default examples;

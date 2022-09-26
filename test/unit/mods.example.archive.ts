import path from "path";
import { ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX } from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  ARCHIVE_PREFIXES,
  ARCHIVE_PREFIX,
  copiedToSamePath,
  ExamplePromptInstallableMod,
  expectedUserCancelMessageFor,
  CET_PREFIXES,
  CET_PREFIX,
  CET_INIT,
  REDS_PREFIXES,
  REDS_PREFIX,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
} from "./utils.helper";

const ArchiveModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    archiveWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [...ARCHIVE_PREFIXES, `${ARCHIVE_PREFIX}/first.archive`].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
      ],
    },
    archiveWithMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_PREFIX}/first.archive`,
        `${ARCHIVE_PREFIX}/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithMultipleFilesCanonicalButInSubfolder: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_PREFIX}/fold1/first.archive`,
        `${ARCHIVE_PREFIX}/fold1/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
      ],
    },
    archiveWithMultipleFilesInHeritageFolderFixable: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/first.archive`,
        `${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(
            `${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/second.archive`,
          ),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithSingleArchiveToplevel: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [`first.archive`].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
      ],
    },
    archiveWithMultipleArchivesTopLevel: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [`first.archive`, `second.archive`].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithArchivesInRandomFolder: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [`fold1/`, `fold1/first.archive`, `fold1/second.archive`].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`fold1/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
      ],
    },
    archiveWithArchivesTopLevelAndFolder: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [`first.archive`, `fold1/`, `fold1/second.archive`].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
      ],
    },
    archiveWithArchivesInRandomFolderPlusRandomFiles: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        `fold1/`,
        `fold1/first.archive`,
        `fold1/foobar.txt`,
        `fold1/more`,
        `fold1/second.archive`,
        `fold1/thisisenough.md`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`fold1/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/foobar.txt`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/foobar.txt`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/more`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/more`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/thisisenough.md`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/thisisenough.md`),
        },
      ],
    },
    archiveXLWithFilesWithMatchingNamesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
      ],
    },
    archiveXLWithFilesWithDifferentNamesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\surprise.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
      ],
    },
    archiveXLWithMultipleFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
        path.join(`${ARCHIVE_PREFIX}\\surprise.xl`),
        path.join(`${ARCHIVE_PREFIX}\\surprise2.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise2.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
      ],
    },
    archiveXLWithMultipleArchivesOnlyInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\surprise.xl`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
      ],
    },
    archiveXLWithoutArchiveFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [...ARCHIVE_PREFIXES, path.join(`${ARCHIVE_PREFIX}\\surprise.xl`)],
      outInstructions: [copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`)],
    },
  }),
);

const ArchiveOnlyModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    archiveWithToplevelAndCanonicalFilesPromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`outtaplace.archive`),
        path.join(`${ARCHIVE_PREFIX}/innaspot.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: `copy`,
          source: path.join(`outtaplace.archive`),
          destination: path.join(`outtaplace.archive`),
        },
        {
          type: `copy`,
          source: path.join(`${ARCHIVE_PREFIX}\\innaspot.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}\\innaspot.archive`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Archive),
    },

    archiveWithCanonAndXlPromptsOnConflictForFallbackWhenExtraToplevels: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`outtaplace.archive`),
        path.join(`${ARCHIVE_PREFIX}/innaspot.archive.xl`),
        path.join(`${ARCHIVE_PREFIX}/innaspot.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`outtaplace.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/innaspot.archive.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/innaspot.archive`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Archive),
    },
  }),
);

const ValidExtraArchivesWithTypeSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    cetWithExtraArchiveFilesCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/configfile.json`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/preemtextures.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        copiedToSamePath(`${CET_PREFIX}/exmod/configfile.json`),
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/preemtextures.archive`),
      ],
    },
    cetWithExtraArchiveXLFilesOnlyCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/configfile.json`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/preemtextures.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        copiedToSamePath(`${CET_PREFIX}/exmod/configfile.json`),
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/preemtextures.xl`),
      ],
    },
    redsWithExtraArchiveFilesCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        path.join(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        path.join(`${REDS_PREFIX}/rexmod/options.json`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        path.join(`${ARCHIVE_PREFIX}/magicgoesherebutbigger.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/options.json`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\magicgoesherebutbigger.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    redsWithExtraArchiveXLFilesOnlyCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        path.join(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        path.join(`${REDS_PREFIX}/rexmod/options.json`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoesherebutbigger.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/options.json`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\magicgoesherebutbigger.xl`),
      ],
    },
  }),
);
const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(ArchiveModSucceeds, ValidExtraArchivesWithTypeSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: mergeOrFailOnConflict(ArchiveOnlyModShouldPromptForInstall),
};

export default examples;

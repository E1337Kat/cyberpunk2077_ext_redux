import path from "path";
import {
  Features,
  CurrentFeatureSet,
  Feature,
} from "../../src/features";
import {
  REDMOD_AUTOCONVERTED_NAME_TAG,
  REDMOD_BASEDIR,
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_INFO_FILENAME,
  ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX,
  ARCHIVE_MOD_CANONICAL_PREFIX,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import { InfoNotification } from "../../src/ui.notifications";
import {
  FAKE_MOD_INFO,
  ExampleSucceedingMod,
  ARCHIVE_PREFIXES,
  ARCHIVE_PREFIX,
  movedFromTo,
  generatedFile,
  GIFTWRAP_PREFIX,
  copiedToSamePath,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  CET_INIT,
  CET_PREFIX,
  CET_PREFIXES,
  FAKE_MOD_NAME,
  RED4EXT_PREFIX,
  RED4EXT_PREFIXES,
  REDS_PREFIX,
  REDS_PREFIXES,
} from "./utils.helper";


const FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES: Features = {
  ...CurrentFeatureSet,
  REDmodAutoconvertArchives: Feature.Enabled,
};

const AUTOCONVERT_MOD_NAME = `${FAKE_MOD_INFO.name} ${REDMOD_AUTOCONVERTED_NAME_TAG}`;
const AUTOCONVERT_MOD_DIR = AUTOCONVERT_MOD_NAME;
const AUTOCONVERT_MOD_VERSION = `${FAKE_MOD_INFO.version.v}+V2077RED`;

const REDMOD_FAKE_INFO_JSON = JSON.stringify({
  name: AUTOCONVERT_MOD_NAME,
  version: AUTOCONVERT_MOD_VERSION,
});

const ArchiveModToREDmodMigrationSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Canonical with single archive migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `Heritage with single archive migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `toplevel archive mod with single archive migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        path.join(`first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `giftwrapped archive mod with single archive migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        path.join(`${GIFTWRAP_PREFIX}\\${ARCHIVE_MOD_CANONICAL_PREFIX}\\first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${GIFTWRAP_PREFIX}\\${ARCHIVE_MOD_CANONICAL_PREFIX}\\first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `Multiple archives warn about manual intervention but install as autoconverted REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/first.archive`),
        path.join(`${ARCHIVE_PREFIX}/second.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/second.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\second.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoDialogTitle: `Mod Installed But May Need Manual Adjustment!`,
    },
  ],
  [
    `Subfoldered archives warn about manual intervention but install as autoconverted REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/some-dir/first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/some-dir/first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\some-dir\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
]);


const MultiTypeWithArchiveREDmodAutoconversion = new Map<string, ExampleSucceedingMod>([
  [
    `MultiType with Archive converts Archive to REDmod when autoconversion enabled`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        {
          type: `copy`,
          source: path.join(`${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_DIR}\\${REDMOD_INFO_FILENAME}`),
        ),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
]);

const ArchiveModToREDmodMigrationCantBeDoneButWeFallbackToOldstyle = new Map<string, ExampleSucceedingMod>([
  [
    `XL can't be autoconverted fully so it is installed as a regular Archive mod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/first.archive`),
        path.join(`${ARCHIVE_PREFIX}/first.archive.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}/first.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/first.archive.xl`),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveNOTautoconverted,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    ArchiveModToREDmodMigrationSucceeds,
    MultiTypeWithArchiveREDmodAutoconversion,
    ArchiveModToREDmodMigrationCantBeDoneButWeFallbackToOldstyle,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

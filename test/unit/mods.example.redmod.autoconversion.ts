import path from "path";
import {
  FeatureState,
  FeatureSet,
  BaselineFeatureSetForTests,
} from "../../src/features";
import {
  normalizeDir,
} from "../../src/filetree";
import {
  REDMOD_AUTOCONVERTED_NAME_TAG,
  REDMOD_BASEDIR,
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_INFO_FILENAME,
  ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX,
  ARCHIVE_MOD_CANONICAL_PREFIX,
  REDMOD_MODTYPE_ATTRIBUTE,
  REDMOD_SCRIPTS_MODDED_DIR,
  REDMOD_AUTOCONVERTED_VERSION_TAG,
} from "../../src/installers.layouts";
import {
  InstallerType,
  REDmodInfo,
  REDmodInfoForVortex,
} from "../../src/installers.types";
import {
  jsonpp,
} from "../../src/util.functions";
import {
  InfoNotification,
} from "../../src/ui.notifications";
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
  addedMetadataAttribute,
  createdDirectory,
  addedREDmodInfoArrayAttribute,
  FAKE_STAGING_PATH,
  mockedFsLayout,
} from "./utils.helper";


const myREDModCompleteInfo = {
  name: `myRedMod`,
  version: `1.0.0`,
  description: `This is a description I guess`,
  customSounds: [
    {
      name: `mySound`,
      type: `mod_sfx_2d`,
      path: `mySound.wav`,
    },
  ],
};
const myREDmodCompleteInfoForVortex: REDmodInfoForVortex = {
  name: myREDModCompleteInfo.name,
  version: myREDModCompleteInfo.version,
  relativePath: normalizeDir(path.join(REDMOD_BASEDIR, myREDModCompleteInfo.name)),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodCompleteInfoJson = jsonpp(myREDModCompleteInfo);

const FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES: FeatureSet = {
  ...BaselineFeatureSetForTests,
  REDmodAutoconvertArchives: () => FeatureState.Enabled,
};

const FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES_WITHOUT_TAGGING: FeatureSet = {
  ...BaselineFeatureSetForTests,
  REDmodAutoconversionTag: FeatureState.Disabled,
  REDmodAutoconvertArchives: () => FeatureState.Enabled,
};

const AUTOCONVERT_MOD_NAME = `${FAKE_MOD_INFO.name} ${REDMOD_AUTOCONVERTED_NAME_TAG}`;
const AUTOCONVERT_MOD_NAME_UNTAGGED = `${FAKE_MOD_INFO.name}`;
const AUTOCONVERT_MOD_VERSION = `${FAKE_MOD_INFO.version.v}+V2077RED`;

const REDMOD_FAKE_INFO: REDmodInfo = {
  name: AUTOCONVERT_MOD_NAME,
  version: AUTOCONVERT_MOD_VERSION,
};
const REDMOD_FAKE_INFO_UNTAGGED: REDmodInfo = {
  name: AUTOCONVERT_MOD_NAME_UNTAGGED,
  version: AUTOCONVERT_MOD_VERSION,
};
const REDMOD_FAKE_INFO_FOR_VORTEX: REDmodInfoForVortex = {
  ...REDMOD_FAKE_INFO,
  relativePath: normalizeDir(path.join(REDMOD_BASEDIR, REDMOD_FAKE_INFO.name)),
  vortexModId: FAKE_MOD_INFO.id,
};
const REDMOD_FAKE_INFO_JSON = jsonpp(REDMOD_FAKE_INFO);
const REDMOD_FAKE_INFO_FOR_VORTEX_UNTAGGED: REDmodInfoForVortex = {
  ...REDMOD_FAKE_INFO_UNTAGGED,
  relativePath: normalizeDir(path.join(REDMOD_BASEDIR, REDMOD_FAKE_INFO_UNTAGGED.name)),
  vortexModId: FAKE_MOD_INFO.id,
};
const REDMOD_FAKE_INFO_UNTAGGED_JSON = jsonpp(REDMOD_FAKE_INFO_UNTAGGED);

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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `Canonical with single archive migrated to REDmod without name tagging`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES_WITHOUT_TAGGING,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME_UNTAGGED}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_UNTAGGED_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME_UNTAGGED}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX_UNTAGGED),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `Canonical with archive and .xl migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/first.archive`),
        path.join(`${ARCHIVE_PREFIX}/first.xl`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/first.xl`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.xl`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `Canonical with just .xl migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/first.xl`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/first.xl`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.xl`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `toplevel archive mod with archives and .xl migrated to REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        path.join(`first.archive`),
        path.join(`second.archive`),
        path.join(`some.xl`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        movedFromTo(
          path.join(`second.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\second.archive`),
        ),
        movedFromTo(
          path.join(`some.xl`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\some.xl`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/second.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\second.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoDialogTitle: `Mod Installed But May Need Manual Adjustment!`,
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\some-dir\\first.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoDialogTitle: `Mod Installed But May Need Manual Adjustment!`,
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
]);


//
// Regression test, this should go thru same pipeline as regular REDmod
//


const badFakeModInfo = {
  ...FAKE_MOD_INFO,
  name: `yay.archive`,
};

const badFakeModPath = FAKE_STAGING_PATH.replace(FAKE_MOD_INFO.name, badFakeModInfo.name);

const autoconvertedFakeStagingName = `yay_archive ${REDMOD_AUTOCONVERTED_NAME_TAG}`;

const badFakeREDmodInfo: REDmodInfo = {
  name: `${badFakeModInfo.name} ${REDMOD_AUTOCONVERTED_NAME_TAG}`,
  version: `${badFakeModInfo.version.v}+${REDMOD_AUTOCONVERTED_VERSION_TAG}`,
};
const badFakeREDmodInfoJson = jsonpp(badFakeREDmodInfo);

const badFakeREDModInfoForVortex: REDmodInfoForVortex = {
  ...badFakeREDmodInfo,
  relativePath: normalizeDir(path.join(REDMOD_BASEDIR, autoconvertedFakeStagingName)),
  vortexModId: badFakeModInfo.id,
};

const ArchiveModToREDmodMigrationWithAutofixSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Archive with a dot in the name is autofixed by REDmod installer and installed as REDmod`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.Archive,
      stagingPath: badFakeModPath,
      inFiles: [
        path.join(`first.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`first.archive`),
          path.join(`${REDMOD_BASEDIR}\\${autoconvertedFakeStagingName}\\${REDMOD_ARCHIVES_DIRNAME}\\first.archive`),
        ),
        generatedFile(
          badFakeREDmodInfoJson,
          path.join(`${REDMOD_BASEDIR}\\${autoconvertedFakeStagingName}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(badFakeREDModInfoForVortex),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
]);


//
// Multitype
//

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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `MultiType with just Archive and redscript converts Archive to REDmod when autoconversion enabled`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `MultiType with just Archive and CET converts Archive to REDmod when autoconversion enabled`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `MultiType with Archive and XL converts to REDmod when autoconversion enabled`,
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
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
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
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.xl`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
  [
    `MultiType: REDmod maybe with archive installable with old-style archive + CET converts to REDmod when autoconversion enabled`,
    {
      features: FLAG_ENABLED_REDMOD_AUTOCONVERT_ARCHIVES,
      expectedInstallerType: InstallerType.MultiType,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodCompleteInfoJson,
            },
          },
        },
      ),
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.xl`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/yay_its_javascript.ws`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        movedFromTo(
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.xl`),
        ),
        generatedFile(
          REDMOD_FAKE_INFO_JSON,
          path.join(`${REDMOD_BASEDIR}\\${AUTOCONVERT_MOD_NAME}\\${REDMOD_INFO_FILENAME}`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(REDMOD_FAKE_INFO_FOR_VORTEX),
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.xl`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/yay_its_javascript.ws`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
        // and a second time because fuck it we ball
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodCompleteInfoForVortex),
      ],
      infoNotificationId: InfoNotification.REDmodArchiveAutoconverted,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    ArchiveModToREDmodMigrationSucceeds,
    ArchiveModToREDmodMigrationWithAutofixSucceeds,
    MultiTypeWithArchiveREDmodAutoconversion,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

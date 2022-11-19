// The instructions will be grouped in the order that we try
// to match things, and normally within them.

import path from "path";
import {
  InstallChoices,
} from "../../src/ui.dialogs";
import {
  CONFIG_XML_MOD_BASEDIR,
  CONFIG_JSON_MOD_BASEDIR_SETTINGS,
  CONFIG_XML_MOD_MERGEABLE_BASEDIR,
  REDMOD_BASEDIR,
  REDMOD_SCRIPTS_MODDED_DIR,
  REDMOD_INFO_FILENAME,
  REDMOD_MODTYPE_ATTRIBUTE,
} from "../../src/installers.layouts";
import {
  InstallerType,
  REDmodInfo,
  REDmodInfoForVortex,
} from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  copiedToSamePath,
  FAKE_MOD_NAME,
  ExamplePromptInstallableMod,
  ARCHIVE_PREFIX,
  ARCHIVE_PREFIXES,
  CET_INIT,
  CET_PREFIX,
  CET_PREFIXES,
  RED4EXT_PREFIX,
  RED4EXT_PREFIXES,
  REDS_PREFIX,
  REDS_PREFIXES,
  TWEAK_XL_PATH,
  TWEAK_XL_PATHS,
  XML_PREFIXES,
  expectedUserCancelProtectedMessageInMultiType,
  ExamplesForType,
  ExampleFailingMod,
  expectedUserCancelMessageForHittingFallback,
  movedFromTo,
  createdDirectory,
  mockedFsLayout,
  mergeOrFailOnConflict,
  addedMetadataAttribute,
  FAKE_MOD_INFO,
  addedREDmodInfoArrayAttribute,
} from "./utils.helper";
import {
  normalizeDir,
} from "../../src/filetree";
import {
  jsonpp,
} from "../../src/util.functions";


const myREDmodInfo: REDmodInfo = {
  name: `myRedMod`,
  version: `1.0.0`,
};
/* Unused for now, this is a failing case
const myREDmodInfoForVortex: REDmodInfoForVortex = {
  ...myREDmodInfo,
  relativePath: normalizeDir(path.join(REDMOD_BASEDIR, myREDmodInfo.name)),
  vortexModId: FAKE_MOD_INFO.id,
};
*/
const myREDmodInfoJson = jsonpp(myREDmodInfo);


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


const ValidTypeCombinations = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    cetWithRedsAndArchivesCanonical: {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/notascript.reds`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    // We should probably add some kind of a reference to
    // mods that are structured this way if they exist.
    cetWithRedsAtRedsRootFixableUsesSyntheticModName: {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/`),
        path.join(`${REDS_PREFIX}/script.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        {
          type: `copy`,
          source: path.join(`${REDS_PREFIX}/script.reds`),
          destination: path.join(`${REDS_PREFIX}/${FAKE_MOD_NAME}/script.reds`),
        },
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    cetWithRedsInDeepCanonSubdirOnly: {
      // Mod example: Simple Gameplay Fixes
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/`),
        path.join(`${REDS_PREFIX}/canonical/`),
        path.join(`${REDS_PREFIX}/canonical/butweallowdeeper/`),
        path.join(`${REDS_PREFIX}/canonical/butweallowdeeper/yay.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDS_PREFIX}/canonical/butweallowdeeper/yay.reds`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    // Regression
    "Reds in basedir installs correctly, not doubled as canonical subdir (with CET + Archive for the ride)":
      {
        expectedInstallerType: InstallerType.MultiType,
        inFiles: [
          ...CET_PREFIXES,
          path.join(`${CET_PREFIX}/exmod/`),
          path.join(`${CET_PREFIX}/exmod/Modules/`),
          path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          ...REDS_PREFIXES,
          path.join(`${REDS_PREFIX}/`),
          path.join(`${REDS_PREFIX}/sneaky.reds`),
          path.join(`${REDS_PREFIX}/notactuallycanonical/`),
          path.join(`${REDS_PREFIX}/notactuallycanonical/yay.reds`),
          ...ARCHIVE_PREFIXES,
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        ],
        outInstructions: [
          copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
          copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          movedFromTo(
            `${REDS_PREFIX}/sneaky.reds`,
            `${REDS_PREFIX}/${FAKE_MOD_NAME}/sneaky.reds`,
          ),
          movedFromTo(
            `${REDS_PREFIX}/notactuallycanonical/yay.reds`,
            `${REDS_PREFIX}/${FAKE_MOD_NAME}/notactuallycanonical/yay.reds`,
          ),
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        ],
      },
    multiTypeCetRedscriptRed4ExtCanonical: {
      // Mod example: Furigana
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
        path.join(`${RED4EXT_PREFIX}/r4xmod/`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sub/`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    "MultiType: CET + Reds + Archive (Canonical), Red4Ext basedir, FIXABLE [Example mod: Furigana]":
      {
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
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        ],
      },
    "MultiType: CET, Redscript, TweakXL, Archive Canonical + Basedir Red4Ext": {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
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
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
      ],
    },
    "MultiType: CET, Redscript, TweakXL, ArchiveXL Canonical + Basedir Red4Ext": {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
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
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
      ],
    },
    "MultiType: CET, Redscript, TweakXL, ArchiveXL only Canonical + Basedir Red4Ext": {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        ...ARCHIVE_PREFIXES,
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
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
      ],
    },
    "MultiType: CET, Redscript, TweakXL, ArchiveXL only Canonical, ConfigXml Mergeable + Basedir Red4Ext":
      {
        expectedInstallerType: InstallerType.MultiType,
        inFiles: [
          ...CET_PREFIXES,
          path.join(`${CET_PREFIX}/exmod/`),
          path.join(`${CET_PREFIX}/exmod/Modules/`),
          path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          ...REDS_PREFIXES,
          path.join(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}/someyay.xml`),
          path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          ...TWEAK_XL_PATHS,
          path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
          ...RED4EXT_PREFIXES,
          path.join(`${RED4EXT_PREFIX}/script.dll`),
          ...ARCHIVE_PREFIXES,
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        ],
        outInstructions: [
          copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
          copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          copiedToSamePath(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}/someyay.xml`),
          copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
          {
            type: `copy`,
            source: path.join(`${RED4EXT_PREFIX}/script.dll`),
            destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
          },
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
          copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ],
      },
    "MultiType: TweakXL + Archive Canonical": {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
      ],
    },
    "MultiType: Red4ext + Archive Canonical": {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    "MultiType: Red4ext + TweakXL Canonical": {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
      ],
      outInstructions: [
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
      ],
    },
  }),
);

const MultiTypeWithREDmodSuccesses = new Map<string, ExampleSucceedingMod>([
  [
    `MultiType: REDmod installable with other types except old-style archives`,
    {
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
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
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
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        movedFromTo(
          path.join(`${RED4EXT_PREFIX}/script.dll`),
          path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        ),
        copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/yay_its_javascript.ws`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodCompleteInfoForVortex),
      ],
    },
  ],
]);

const MultiTypeModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    "MultiType: XML Config should prompt, w/ CET, Reds, Red4ext, Archive + XL, TweakXL, JSON":
      {
        expectedInstallerType: InstallerType.MultiType,
        proceedLabel: InstallChoices.Proceed,
        inFiles: [
          ...CET_PREFIXES,
          path.join(`${CET_PREFIX}/exmod/`),
          path.join(`${CET_PREFIX}/exmod/Modules/`),
          path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          ...REDS_PREFIXES,
          path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          ...XML_PREFIXES,
          path.join(`${CONFIG_XML_MOD_BASEDIR}\\inputUserMappings.xml`),
          path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
          ...RED4EXT_PREFIXES,
          path.join(`${RED4EXT_PREFIX}/r4xmod/`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/sub/`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
          ...TWEAK_XL_PATHS,
          path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
          ...ARCHIVE_PREFIXES,
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        ],
        proceedOutInstructions: [
          copiedToSamePath(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
          copiedToSamePath(`${CONFIG_XML_MOD_BASEDIR}\\inputUserMappings.xml`),
          copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
          copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
          copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
          copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
          copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageInMultiType,
      },
    // Yes, this is the same one as the xml - but at some point impl might differ, be safe
    "MultiType: JSON Config should prompt, w/ CET, Reds, Red4ext, Archive + XL, TweakXL, XML, Mergeable Xml":
      {
        expectedInstallerType: InstallerType.MultiType,
        proceedLabel: InstallChoices.Proceed,
        inFiles: [
          ...CET_PREFIXES,
          path.join(`${CET_PREFIX}/exmod/`),
          path.join(`${CET_PREFIX}/exmod/Modules/`),
          path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          ...REDS_PREFIXES,
          path.join(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}/someyay.xml`),
          path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          ...XML_PREFIXES,
          path.join(`${CONFIG_XML_MOD_BASEDIR}\\inputUserMappings.xml`),
          path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
          ...RED4EXT_PREFIXES,
          path.join(`${RED4EXT_PREFIX}/r4xmod/`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/sub/`),
          path.join(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
          ...TWEAK_XL_PATHS,
          path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
          ...ARCHIVE_PREFIXES,
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          path.join(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
        ],
        proceedOutInstructions: [
          copiedToSamePath(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
          copiedToSamePath(`${CONFIG_XML_MOD_BASEDIR}\\inputUserMappings.xml`),
          copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
          copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          copiedToSamePath(`${CONFIG_XML_MOD_MERGEABLE_BASEDIR}/someyay.xml`),
          copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
          copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
          copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
          copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.xl`),
          copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          copiedToSamePath(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageInMultiType,
      },
    multitypeWithArchivesAtToplevelPromptsOnConflict: {
      expectedInstallerType: InstallerType.MultiType,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4xmod/`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sub/`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
        ...ARCHIVE_PREFIXES,
        path.join(`magicgoeselsewhere.archive`),
      ],
      proceedOutInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
        copiedToSamePath(`magicgoeselsewhere.archive`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
    multitypeWithCanonAndToplevelRedsPromptsOnConflict: {
      expectedInstallerType: InstallerType.MultiType,
      proceedLabel: InstallChoices.Proceed,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`topsies.reds`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4xmod/`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sub/`),
        path.join(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\magicgoeshere.archive`),
      ],
      proceedOutInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        copiedToSamePath(`topsies.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/script.reds`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sme.ini`),
        copiedToSamePath(`${RED4EXT_PREFIX}/r4xmod/sub/subscript.dll`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\magicgoeshere.archive`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
  }),
);

const MultiTypeDirectFailures = new Map<string, ExampleFailingMod>([
  [
    `Invalid REDmod will cause the entire install to fail directly`,
    {
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
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4xmod/script.dll`),
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\tw\\mytweak.yaml`),
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/`),
        //
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/thisiswrong.script`),
        //
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
      ],
      failure: `MultiType Mod Installer: REDmod instructions failed, canceling installation: Error: Script sublayout: these files don't look like valid REDmod scripts: mods\\myRedMod\\scripts\\thisiswrong.script`,
      errorDialogTitle: `Can't Install MultiType Mod when the REDmod Part Fails!`,
    },
  ],
  [
    `REDmod MultiType will fail if it contains both REDmod and old style archives`,
    {
      expectedInstallerType: InstallerType.MultiType,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
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
        path.join(`${ARCHIVE_PREFIX}\\magicgoeshere.archive`),
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
      ],
      errorDialogTitle: `Can't Install Both REDmod and Old-Style Archive in the Same Mod!`,
      failure: `MultiType Mod Installer: Can't install REDmod and Old-Style Archive at the same time, canceling installation`,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(ValidTypeCombinations, MultiTypeWithREDmodSuccesses),
  AllExpectedDirectFailures: MultiTypeDirectFailures,
  AllExpectedPromptInstalls: MultiTypeModShouldPromptForInstall,
};

export default examples;

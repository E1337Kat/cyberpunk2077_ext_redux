import {
  pipe,
} from "fp-ts/lib/function";
import {
  map,
  toArray as toMutableArray,
} from "fp-ts/lib/ReadonlyArray";
import path from "path";
import {
  REDMOD_BASEDIR,
  REDMOD_INFO_FILENAME,
  REDMOD_MODTYPE_ATTRIBUTE,
  REDMOD_SCRIPTS_MODDED_DIR,
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
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  movedFromTo,
  copiedToSamePath,
  mockedFsLayout,
  mergeOrFailOnConflict,
  createdDirectory,
  addedMetadataAttribute,
  FAKE_MOD_INFO,
  addedREDmodInfoArrayAttribute,
} from "./utils.helper";

const myREDmodInfo: REDmodInfo = {
  name: `myRedMod`,
  version: `1.0.0`,
};
const myREDmodInfoForVortex: REDmodInfoForVortex = {
  ...myREDmodInfo,
  relativePath: path.join(REDMOD_BASEDIR, myREDmodInfo.name),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodInfoJson = jsonpp(myREDmodInfo);

const myREDmodInfoWithSound: REDmodInfo = {
  name: `myRedMod`,
  version: `1.0.0`,
  description: `This is a description I guess`,
  customSounds: [
    {
      name: `mySound`,
      type: `mod_sfx_2d`,
      file: `mySound.wav`,
    },
  ],
};
const myREDmodInfoWithSoundForVortex: REDmodInfoForVortex = {
  name: myREDmodInfoWithSound.name,
  version: myREDmodInfoWithSound.version,
  relativePath: path.join(REDMOD_BASEDIR, myREDmodInfoWithSound.name),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodInfoWithSoundJson = jsonpp(myREDmodInfoWithSound);


const myREDmodInfoWithSkipSound: REDmodInfo = {
  name: `myRedMod`,
  version: `1.0.0`,
  description: `This is a description I guess`,
  customSounds: [
    {
      name: `mySound`,
      type: `mod_skip`,
    },
  ],
};
const myREDmodInfoWithSkipSoundForVortex: REDmodInfoForVortex = {
  name: myREDmodInfoWithSkipSound.name,
  version: myREDmodInfoWithSkipSound.version,
  relativePath: path.join(REDMOD_BASEDIR, myREDmodInfoWithSkipSound.name),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodInfoWithSkipSoundJson = jsonpp(myREDmodInfoWithSkipSound);


const invalidREDmodInfo = {
  name: `myRedMod`,
};
const invalidREDmodInfoJson = jsonpp(invalidREDmodInfo);

const myREDmodInfoWithBlankVersion = {
  name: `myRedMod`,
  version: ``,
};
const myREDmodInfoWithBlankVersionForVortex: REDmodInfoForVortex = {
  ...myREDmodInfoWithBlankVersion,
  version: FAKE_MOD_INFO.version.v,
  relativePath: path.join(REDMOD_BASEDIR, myREDmodInfo.name),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodInfoWithBlankVersionJson = jsonpp(myREDmodInfoWithBlankVersion);

const NOTmyREDmodInfo = {
  name: `NOTmyRedMod`,
  version: `1.0.0`,
};
const NOTmyREDmodInfoForVortex: REDmodInfoForVortex = {
  ...NOTmyREDmodInfo,
  relativePath: path.join(REDMOD_BASEDIR, NOTmyREDmodInfo.name),
  vortexModId: FAKE_MOD_INFO.id,
};
const NOTmyRedModInfoJson = jsonpp(NOTmyREDmodInfo);


const myREDmodInfoNumber2 = {
  name: `myRedModNumber2`,
  version: `1.0.1`,
};
const myREDmodNumber2InfoForVortex: REDmodInfoForVortex = {
  ...myREDmodInfoNumber2,
  relativePath: path.join(REDMOD_BASEDIR, myREDmodInfoNumber2.name),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodNumber2InfoJson = jsonpp(myREDmodInfoNumber2);


const MANUAL_ARCHIVE_CHECK_WARNING_TITLE =
  `Mod Installed But May Need Manual Adjustment!`;


//
// Examples
//

const REDmodSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `canonical REDmod with dir matching mod name`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `canonical REDmod with multiple archives and no XL files installs with warning`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff_opt1.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff_opt2.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff_opt1.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff_opt2.archive`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
      infoDialogTitle: MANUAL_ARCHIVE_CHECK_WARNING_TITLE,
    },
  ],
  [
    `canonical REDmod with Archive and ArchiveXL`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.xl`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `canonical REDmod with multiple archives installs without warning if XL files present (it generally means there's no need to prompt)`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cooler_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/whatever.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cooler_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/whatever.xl`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `canonical REDmod with just ArchiveXL`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.xl`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `canonical REDmod with dir matching mod name and more complete info.json`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoWithSoundJson,
            },
          },
        },
      ),
      inFiles: [
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sounds.wav`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sounds.wav`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSoundForVortex),
      ],
    },
  ],
  [
    `multiple canonical REDmods with dirs matching mod names`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
            },
            myRedModNumber2: {
              [REDMOD_INFO_FILENAME]: myREDmodNumber2InfoJson,
            },
          },
        },
      ),
      inFiles: [
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedModNumber2/`),
        path.join(`${REDMOD_BASEDIR}/myRedModNumber2/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedModNumber2/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedModNumber2/archives/boring_stuff.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedModNumber2/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedModNumber2/archives/boring_stuff.archive`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex, myREDmodNumber2InfoForVortex),
      ],
    },
  ],
  [
    `canonical REDmod with multiple subtypes and dir matching mod name`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoWithSoundJson,
            },
          },
        },
      ),
      inFiles: [
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
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/yay_its_javascript.ws`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSoundForVortex),
      ],
    },
  ],
  [
    `named REDmod with dir matching mod name`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          myRedMod: {
            [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          },
        },
      ),
      inFiles: [
        path.join(`myRedMod/`),
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`myRedMod/info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`myRedMod/archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `multiple named REDmods with dirs matching mod names`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          myRedMod: {
            [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          },
          myRedModNumber2: {
            [REDMOD_INFO_FILENAME]: myREDmodNumber2InfoJson,
          },
        },
      ),
      inFiles: [
        path.join(`myRedMod/`),
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
        path.join(`myRedModNumber2/`),
        path.join(`myRedModNumber2/info.json`),
        path.join(`myRedModNumber2/archives/`),
        path.join(`myRedModNumber2/archives/4d.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`myRedMod/info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`myRedMod/archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        movedFromTo(
          path.join(`myRedModNumber2/info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedModNumber2/info.json`),
        ),
        movedFromTo(
          path.join(`myRedModNumber2/archives/4d.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedModNumber2/archives/4d.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex, myREDmodNumber2InfoForVortex),
      ],
    },
  ],
  [
    `named REDmod with multiple subtypes and dir matching mod name`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          myRedMod: {
            [REDMOD_INFO_FILENAME]: myREDmodInfoWithSoundJson,
          },
        },
      ),
      inFiles: [
        path.join(`myRedMod/`),
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
        path.join(`myRedMod/customSounds/`),
        path.join(`myRedMod/customSounds/cool_sound.wav`),
        path.join(`myRedMod/scripts/`),
        path.join(`myRedMod/scripts/exec/`),
        path.join(`myRedMod/scripts/exec/cool_scripts.script`),
        path.join(`myRedMod/scripts/core/ai/`),
        path.join(`myRedMod/scripts/core/ai/deepScripts.script`),
        path.join(`myRedMod/scripts/core/ai/helperstuff.ws`),
        path.join(`myRedMod/tweaks/`),
        path.join(`myRedMod/tweaks/base/`),
        path.join(`myRedMod/tweaks/base/gameplay/`),
        path.join(`myRedMod/tweaks/base/gameplay/static_data/`),
        path.join(`myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`myRedMod/info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`myRedMod/archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        movedFromTo(
          path.join(`myRedMod/customSounds/cool_sound.wav`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        ),
        movedFromTo(
          path.join(`myRedMod/scripts/exec/cool_scripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        ),
        movedFromTo(
          path.join(`myRedMod/scripts/core/ai/deepScripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        ),
        movedFromTo(
          path.join(`myRedMod/scripts/core/ai/helperstuff.ws`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/helperstuff.ws`),
        ),
        movedFromTo(
          path.join(`myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSoundForVortex),
      ],
    },
  ],
  [
    `toplevel REDmod`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `toplevel REDmod with multiple subtypes`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoWithSoundJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
        path.join(`archives/xlnamedoesntneedtomatch.xl`),
        path.join(`customSounds/`),
        path.join(`customSounds/cool_sound.wav`),
        path.join(`scripts/`),
        path.join(`scripts/exec/`),
        path.join(`scripts/exec/cool_scripts.script`),
        path.join(`scripts/core/`),
        path.join(`scripts/core/ai/`),
        path.join(`scripts/core/ai/deepScripts.script`),
        path.join(`tweaks/`),
        path.join(`tweaks/base/`),
        path.join(`tweaks/base/gameplay/`),
        path.join(`tweaks/base/gameplay/static_data/`),
        path.join(`tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        movedFromTo(
          path.join(`archives/xlnamedoesntneedtomatch.xl`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/xlnamedoesntneedtomatch.xl`),
        ),
        movedFromTo(
          path.join(`customSounds/cool_sound.wav`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.wav`),
        ),
        movedFromTo(
          path.join(`scripts/exec/cool_scripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        ),
        movedFromTo(
          path.join(`scripts/core/ai/deepScripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/core/ai/deepScripts.script`),
        ),
        movedFromTo(
          path.join(`tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSoundForVortex),
      ],
    },
  ],
]);

const REDmodSpecialValidationSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `REDmod with dir NOT matching mod name goes to dir named after mod name`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          myRedMod: {
            [REDMOD_INFO_FILENAME]: NOTmyRedModInfoJson,
          },
        },
      ),
      inFiles: [
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`myRedMod/info.json`),
          path.join(`${REDMOD_BASEDIR}/${NOTmyREDmodInfo.name}/info.json`),
        ),
        movedFromTo(
          path.join(`myRedMod/archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/${NOTmyREDmodInfo.name}/archives/cool_stuff.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(NOTmyREDmodInfoForVortex),
      ],
    },
  ],
  [
    `REDmod without sound files if info customSounds only has skip files`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoWithSkipSoundJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSkipSoundForVortex),
      ],
    },
  ],
  [
    `REDmod with archives in subdirectories, with a warning message`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoWithSkipSoundJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
        path.join(`archives/isntreallyvalid/`),
        path.join(`archives/isntreallyvalid/cool_stuff.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`archives/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
        movedFromTo(
          path.join(`archives/isntreallyvalid/cool_stuff.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/isntreallyvalid/cool_stuff.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSkipSoundForVortex),
      ],
      infoDialogTitle: `Mod Installed But May Need Manual Adjustment!`,
    },
  ],
  [
    `REDmod with multiple .archive files in correct dir (which may indicate optionals), with a warning message`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoWithSkipSoundJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff_option0.archive`),
        path.join(`archives/cool_stuff_option1.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.join(`archives/cool_stuff_option0.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff_option0.archive`),
        ),
        movedFromTo(
          path.join(`archives/cool_stuff_option1.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff_option1.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSkipSoundForVortex),
      ],
      infoDialogTitle: `Mod Installed But May Need Manual Adjustment!`,
    },
  ],
  [
    `canonical REDmod, placeholder r6/cache/modded/ files have those files ignored (we always generate the dir)`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        path.join(REDMOD_SCRIPTS_MODDED_DIR, `placething.txt`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/cool_scripts.script`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
  [
    `Canonical REDmod without any files except info.json if info customSounds only has skip files`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoWithSkipSoundJson,
            },
          },
        },
      ),
      inFiles: [
        path.join(`mods/myRedMod/info.json`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`mods/myRedMod/info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithSkipSoundForVortex),
      ],
    },
  ],
]);


//
// Autofixes
//


const makeBadDirnameRedmodInfo = (badDirname: string): REDmodInfo => ({
  name: badDirname,
  version: `1.0.0`,
});

const makeBadDirnameRedmodInfoJson = (badDirname: string): string =>
  JSON.stringify(makeBadDirnameRedmodInfo(badDirname));

const makeBadDirnameRedmodInfoForVortex = (stillBadModname: string, fixedDirname: string): REDmodInfoForVortex => ({
  ...makeBadDirnameRedmodInfo(stillBadModname),
  relativePath: path.join(REDMOD_BASEDIR, fixedDirname),
  vortexModId: FAKE_MOD_INFO.id,
});


const REDmodAutofixesSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `canonical REDmod with a blank version installed with version from Vortex (or generated)`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoWithBlankVersionJson,
            },
          },
        },
      ),
      inFiles: [
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoWithBlankVersionForVortex),
      ],
    },
  ],
  ...pipe(
    [
      [`with a file extension`, `myRedMod.zip`, `myRedMod_zip`],
      [`with another file extension`, `myRedMod.archive`, `myRedMod_archive`],
      [`with a file extension and stuff after it`, `myRedMod.7z (V2077 Autoconverted)`, `myRedMod_7z (V2077 Autoconverted)`],
      [`with a version number`, `myRedMod v1.3`, `myRedMod v1_3`],
      [`with a version number in the middle`, `myRedMod 2.3 fancy version`, `myRedMod 2_3 fancy version`],
      [`with just some random dot`, `my.RedMod`, `my_RedMod`],
    ],
    map(([description, modname, fixedDirname]): [string, ExampleSucceedingMod] =>
      [
        // Name > dir, this is always fixed in collecting the path
        `REDmod with a modname ${description} (${modname}) that redmMod.exe can't is sanitized`,
        {
          expectedInstallerType: InstallerType.REDmod,
          fsMocked: mockedFsLayout(
            {
              [REDMOD_BASEDIR]: {
                [modname]: {
                  [REDMOD_INFO_FILENAME]: makeBadDirnameRedmodInfoJson(modname),
                },
              },
            },
          ),
          inFiles: [
            path.join(`${REDMOD_BASEDIR}/`),
            path.join(`${REDMOD_BASEDIR}/${modname}/`),
            path.join(`${REDMOD_BASEDIR}/${modname}/info.json`),
            path.join(`${REDMOD_BASEDIR}/${modname}/archives/`),
            path.join(`${REDMOD_BASEDIR}/${modname}/archives/cool_stuff.archive`),
          ],
          outInstructions: [
            movedFromTo(
              `${REDMOD_BASEDIR}/${modname}/info.json`,
              `${REDMOD_BASEDIR}/${fixedDirname}/info.json`,
            ),
            movedFromTo(
              `${REDMOD_BASEDIR}/${modname}/archives/cool_stuff.archive`,
              `${REDMOD_BASEDIR}/${fixedDirname}/archives/cool_stuff.archive`,
            ),
            createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
            addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
            addedREDmodInfoArrayAttribute(makeBadDirnameRedmodInfoForVortex(modname, fixedDirname)),
          ],
        },
      ]),
    toMutableArray,
  ),
  // This could be generated from the above but it gets really painful to read
  ...pipe(
    [
      [`with a file extension`, `myRedMod.zip`, `myRedMod_zip`],
      [`with another file extension`, `myRedMod.archive`, `myRedMod_archive`],
      [`with a file extension and stuff after it`, `myRedMod.7z (V2077 Autoconverted)`, `myRedMod_7z (V2077 Autoconverted)`],
      [`with a version number`, `myRedMod v1.3`, `myRedMod v1_3`],
      [`with a version number in the middle`, `myRedMod 2.3 fancy version`, `myRedMod 2_3 fancy version`],
      [`with just some random dot`, `my.RedMod`, `my_RedMod`],
    ],
    map(([description, modname, fixedDirname]): [string, ExampleSucceedingMod] =>
      [
        `REDmod without a given dirname and a modname ${description} (${modname}) that redmMod.exe can't handle is sanitized`,
        {
          expectedInstallerType: InstallerType.REDmod,
          fsMocked: mockedFsLayout(
            {
              [REDMOD_INFO_FILENAME]: makeBadDirnameRedmodInfoJson(modname),
            },
          ),
          inFiles: [
            path.join(`info.json`),
            path.join(`archives/`),
            path.join(`archives/cool_stuff.archive`),
          ],
          outInstructions: [
            movedFromTo(
              `info.json`,
              `${REDMOD_BASEDIR}/${fixedDirname}/info.json`,
            ),
            movedFromTo(
              `archives/cool_stuff.archive`,
              `${REDMOD_BASEDIR}/${fixedDirname}/archives/cool_stuff.archive`,
            ),
            createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
            addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
            addedREDmodInfoArrayAttribute(makeBadDirnameRedmodInfoForVortex(modname, fixedDirname)),
          ],
        },
      ]),
    toMutableArray,
  ),
]);


//
// Fails
//

const REDmodDirectFailures = new Map<string, ExampleFailingMod>([
  [
    `Canonical REDmod with one or more of the moddirs missing a required file`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedModBad/`),
        path.join(`${REDMOD_BASEDIR}/myRedModBad/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedModBad/archives/wouldbesupercool.archive`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `basedir REDmod without a module-named dir`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
          },
        },
      ),
      inFiles: [
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/info.json`),
        path.join(`${REDMOD_BASEDIR}/archives/`),
        path.join(`${REDMOD_BASEDIR}/archives/cool_stuff.archive`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `REDmod with invalid info.json`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          myRedMod: {
            [REDMOD_INFO_FILENAME]: invalidREDmodInfoJson,
          },
        },
      ),
      inFiles: [
        path.join(`myRedMod/`),
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `REDmod with *.tweak outside expected additional prefix inside tweaks/`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/mytweak.tweak`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `REDmod with a *.script outside the top-level script subdirs`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/nope.script`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `REDmod with a *.script in an unknown top-level script subdir`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/exec/thisoneisgood.script`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/nope.script`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `REDmod with sound files but no customSounds in info.json`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
        path.join(`customSounds/`),
        path.join(`customSounds/cool_sound.wav`),
        path.join(`scripts/`),
        path.join(`scripts/exec/`),
        path.join(`scripts/exec/cool_scripts.script`),
        path.join(`scripts/core/`),
        path.join(`scripts/core/ai/`),
        path.join(`scripts/core/ai/deepScripts.script`),
        path.join(`tweaks/`),
        path.join(`tweaks/base/`),
        path.join(`tweaks/base/gameplay/`),
        path.join(`tweaks/base/gameplay/static_data/`),
        path.join(`tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
  [
    `REDmod with non-skip customSounds decl, but no sound files`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myREDmodInfoWithSoundJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
        path.join(`customSounds/`),
        path.join(`scripts/`),
        path.join(`scripts/exec/`),
        path.join(`scripts/exec/cool_scripts.script`),
        path.join(`scripts/core/`),
        path.join(`scripts/core/ai/`),
        path.join(`scripts/core/ai/deepScripts.script`),
        path.join(`tweaks/`),
        path.join(`tweaks/base/`),
        path.join(`tweaks/base/gameplay/`),
        path.join(`tweaks/base/gameplay/static_data/`),
        path.join(`tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    REDmodSucceeds,
    REDmodSpecialValidationSucceeds,
    REDmodAutofixesSucceeds,
  ),
  AllExpectedDirectFailures: REDmodDirectFailures,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

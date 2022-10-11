import path from "path";
import {
  REDMOD_BASEDIR,
  REDMOD_INFO_FILENAME,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  movedFromTo,
  copiedToSamePath,
  mockedFsLayout,
  mergeOrFailOnConflict,
} from "./utils.helper";

const myRedModInfoJson = JSON.stringify({
  name: `myRedMod`,
  version: `1.0.0`,
});

const myRedModCompleteInfoJson = JSON.stringify({
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
});

const myRedModWithSkipSoundInfoJson = JSON.stringify({
  name: `myRedMod`,
  version: `1.0.0`,
  description: `This is a description I guess`,
  customSounds: [
    {
      name: `mySound`,
      type: `mod_skip`,
    },
  ],
});

const invalidREDmodInfoJson = JSON.stringify({
  name: `myRedMod`,
});

const NOTmyRedModInfoJson = JSON.stringify({
  name: `NOTmyRedMod`,
  version: `1.0.0`,
});

const myRedModNumber2InfoJson = JSON.stringify({
  name: `myRedModNumber2`,
  version: `1.0.1`,
});

const REDmodSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `canonical REDmod with dir matching mod name`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
              [REDMOD_INFO_FILENAME]: myRedModCompleteInfoJson,
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
              [REDMOD_INFO_FILENAME]: myRedModInfoJson,
            },
            myRedModNumber2: {
              [REDMOD_INFO_FILENAME]: myRedModNumber2InfoJson,
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
              [REDMOD_INFO_FILENAME]: myRedModCompleteInfoJson,
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
            [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
            [REDMOD_INFO_FILENAME]: myRedModInfoJson,
          },
          myRedModNumber2: {
            [REDMOD_INFO_FILENAME]: myRedModNumber2InfoJson,
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
            [REDMOD_INFO_FILENAME]: myRedModCompleteInfoJson,
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
          path.join(`myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/base/gameplay/static_data/tweak_tweak_baby.tweak`),
        ),
      ],
    },
  ],
  [
    `toplevel REDmod`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
      ],
    },
  ],
  [
    `toplevel REDmod with multiple subtypes`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myRedModCompleteInfoJson,
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
      ],
    },
  ],
]);

const REDmodSpecialValidationSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `REDmod without sound files if info customSounds only has skip files`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myRedModWithSkipSoundInfoJson,
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
      ],
    },
  ],
  [
    `REDmod with archives in subdirectories, with a warning message`,
    {
      expectedInstallerType: InstallerType.REDmod,
      fsMocked: mockedFsLayout(
        {
          [REDMOD_INFO_FILENAME]: myRedModWithSkipSoundInfoJson,
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
          [REDMOD_INFO_FILENAME]: myRedModWithSkipSoundInfoJson,
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
      ],
      infoDialogTitle: `Mod Installed But May Need Manual Adjustment!`,
    },
  ],
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
              [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
            [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
    `REDmod with dir NOT matching mod name`,
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
              [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
              [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
              [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
          [REDMOD_INFO_FILENAME]: myRedModInfoJson,
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
          [REDMOD_INFO_FILENAME]: myRedModCompleteInfoJson,
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
  AllExpectedSuccesses: mergeOrFailOnConflict(REDmodSucceeds, REDmodSpecialValidationSucceeds),
  AllExpectedDirectFailures: REDmodDirectFailures,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

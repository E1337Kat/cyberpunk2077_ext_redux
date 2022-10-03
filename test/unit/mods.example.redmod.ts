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
} from "./utils.helper";

const myRedModInfoJson = JSON.stringify({
  name: `myRedMod`,
  version: `1.0.0`,
});

const myRedModCompleteInfoJson = JSON.stringify({
  name: `myRedMod`,
  version: `1.0.0`,
  description: `This is a description I guess`,
  customSounds: [`dunno what goes here but who cares`],
});

const mySoundModWithoutCustomSoundsFieldJson = JSON.stringify({
  name: `myRedMod`,
  version: `1.0.0`,
  description: `For some reason I left out the required customSounds field`,
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
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sounds.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sounds.archive`),
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
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/cool_scripts.script`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/deepScripts.script`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/`),
        path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/tweak_tweak_baby.tweak`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/info.json`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.archive`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/cool_scripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/deepScripts.script`),
        copiedToSamePath(`${REDMOD_BASEDIR}/myRedMod/tweaks/tweak_tweak_baby.tweak`),
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
        path.join(`myRedModNumber4/`),
        path.join(`myRedModNumber4/info.json`),
        path.join(`myRedModNumber4/archives/`),
        path.join(`myRedModNumber4/archives/4d.archive`),
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
          path.join(`myRedModNumber4/info.json`),
          path.join(`${REDMOD_BASEDIR}/myRedModNumber4/info.json`),
        ),
        movedFromTo(
          path.join(`myRedModNumber4/archives/4d.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedModNumber4/archives/4d.archive`),
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
            [REDMOD_INFO_FILENAME]: myRedModInfoJson,
          },
        },
      ),
      inFiles: [
        path.join(`myRedMod/`),
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
        path.join(`myRedMod/customSounds/`),
        path.join(`myRedMod/customSounds/cool_sound.archive`),
        path.join(`myRedMod/scripts/`),
        path.join(`myRedMod/scripts/cool_scripts.script`),
        path.join(`myRedMod/scripts/woah/`),
        path.join(`myRedMod/scripts/woah/deepScripts.script`),
        path.join(`myRedMod/tweaks/`),
        path.join(`myRedMod/tweaks/tweak_tweak_baby.tweak`),
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
          path.join(`myRedMod/customSounds/cool_sound.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.archive`),
        ),
        movedFromTo(
          path.join(`myRedMod/scripts/cool_scripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/cool_scripts.script`),
        ),
        movedFromTo(
          path.join(`myRedMod/scripts/woah/deepScripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/deepScripts.script`),
        ),
        movedFromTo(
          path.join(`myRedMod/tweaks/tweak_tweak_baby.tweak`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/tweak_tweak_baby.tweak`),
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
          [REDMOD_INFO_FILENAME]: myRedModInfoJson,
        },
      ),
      inFiles: [
        path.join(`info.json`),
        path.join(`archives/`),
        path.join(`archives/cool_stuff.archive`),
        path.join(`customSounds/`),
        path.join(`customSounds/cool_sound.archive`),
        path.join(`scripts/`),
        path.join(`scripts/cool_scripts.script`),
        path.join(`scripts/woah/`),
        path.join(`scripts/woah/deepScripts.script`),
        path.join(`tweaks/`),
        path.join(`tweaks/tweak_tweak_baby.tweak`),
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
          path.join(`customSounds/cool_sound.archive`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/customSounds/cool_sound.archive`),
        ),
        movedFromTo(
          path.join(`scripts/cool_scripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/cool_scripts.script`),
        ),
        movedFromTo(
          path.join(`scripts/woah/deepScripts.script`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/scripts/woah/deepScripts.script`),
        ),
        movedFromTo(
          path.join(`tweaks/tweak_tweak_baby.tweak`),
          path.join(`${REDMOD_BASEDIR}/myRedMod/tweaks/tweak_tweak_baby.tweak`),
        ),
      ],
    },
  ],
]);

const REDmodDirectFailures = new Map<string, ExampleFailingMod>([
  [
    `Canonical REDmod with one or more of the moddirs missing a required file`,
    {
      expectedInstallerType: InstallerType.REDmod,
      inFiles: [
        path.join(`${REDMOD_BASEDIR}/`),
        path.join(`${REDMOD_BASEDIR}/myRedModGood/`),
        path.join(`${REDMOD_BASEDIR}/myRedModGood/info.json`),
        path.join(`${REDMOD_BASEDIR}/myRedModGood/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedModGood/archives/cool_stuff.archive`),
        path.join(`${REDMOD_BASEDIR}/myRedModBad/`),
        path.join(`${REDMOD_BASEDIR}/myRedModBad/archives/`),
        path.join(`${REDMOD_BASEDIR}/myRedModBad/archives/wouldbesupercool.archive`),
      ],
      failure: `Didn't Find Expected REDmod Installation!`,
      errorDialogTitle: `Didn't Find Expected REDmod Installation!`,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: REDmodSucceeds,
  AllExpectedDirectFailures: REDmodDirectFailures,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

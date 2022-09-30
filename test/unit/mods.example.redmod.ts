import path from "path";
import { REDMOD_BASEDIR } from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  movedFromTo,
  copiedToSamePath,
} from "./utils.helper";

const REDmodSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `redmodBasicCanonical`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
    `redmodBasicCanonicalWithMultipleMods`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
    `redmodBasicBasedir`,
    {
      expectedInstallerType: InstallerType.REDmod,
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
    `redmodBasicBasedir with multiple mods`,
    {
      expectedInstallerType: InstallerType.REDmod,
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

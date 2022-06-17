import path from "path";
import {
  PresetModCyberCatJson,
  PRESET_MOD_CYBERCAT_BASEDIR,
  PRESET_MOD_UNLOCKER_BASEDIR,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExamplePromptInstallableMod,
  copiedToSamePath,
  ExampleSucceedingMod,
  ExampleFailingMod,
  mergeOrFailOnConflict,
  ExamplesForType,
  mockedFsLayout,
  movedFromTo,
} from "./utils.helper";

const minimalPresetForCyberCat = JSON.stringify({
  DataExists: true,
  Unknown1: 0,
  UnknownFirstBytes: "FUBARO",
  FirstSection: {
    AppearanceSections: [] as string[],
  },
  SecondSection: {
    AppearanceSections: [] as string[],
  },
  ThirdSection: {
    AppearanceSections: [] as string[],
  },
  StringTriples: [
    {
      FirstString: "",
      SecondString: "",
      ThirdString: "",
    },
  ],
} as PresetModCyberCatJson);

const minimalPresetForUnlocker = `LocKey#898870017445300632:1\n`;

//
// Examples
//

const PresetModSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `cybercat preset in canonical basedir will install`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [
        path.normalize(`${PRESET_MOD_CYBERCAT_BASEDIR}\\yay.preset`),
        path.normalize(`${PRESET_MOD_CYBERCAT_BASEDIR}\\yay2.preset`),
      ],
      fsMocked: mockedFsLayout(
        {
          "yay.preset": minimalPresetForCyberCat,
          "yay2.preset": minimalPresetForCyberCat,
        },
        PRESET_MOD_CYBERCAT_BASEDIR.split(path.sep),
      ),
      outInstructions: [
        copiedToSamePath(`${PRESET_MOD_CYBERCAT_BASEDIR}\\yay.preset`),
        copiedToSamePath(`${PRESET_MOD_CYBERCAT_BASEDIR}\\yay2.preset`),
      ],
    },
  ],
  [
    `unlocker preset in canonical basedir will install`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [
        path.normalize(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay.preset`),
        path.normalize(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay2.preset`),
      ],
      fsMocked: mockedFsLayout(
        {
          "yay.preset": minimalPresetForUnlocker,
          "yay2.preset": minimalPresetForUnlocker,
        },
        PRESET_MOD_UNLOCKER_BASEDIR.split(path.sep),
      ),
      outInstructions: [
        copiedToSamePath(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay.preset`),
        copiedToSamePath(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay2.preset`),
      ],
    },
  ],
  [
    `cybercat preset in toplevel will install`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [path.normalize(`yay.preset`), path.normalize(`yay2.preset`)],
      fsMocked: mockedFsLayout({
        "yay.preset": minimalPresetForCyberCat,
        "yay2.preset": minimalPresetForCyberCat,
      }),
      outInstructions: [
        movedFromTo(
          path.normalize(`yay.preset`),
          path.normalize(`${PRESET_MOD_CYBERCAT_BASEDIR}\\yay.preset`),
        ),
        movedFromTo(
          path.normalize(`yay2.preset`),
          path.normalize(`${PRESET_MOD_CYBERCAT_BASEDIR}\\yay2.preset`),
        ),
      ],
    },
  ],
  [
    `unlocker preset in toplevel will install`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [path.normalize(`yay.preset`), path.normalize(`yay2.preset`)],
      fsMocked: mockedFsLayout({
        "yay.preset": minimalPresetForUnlocker,
        "yay2.preset": minimalPresetForUnlocker,
      }),
      outInstructions: [
        movedFromTo(
          path.normalize(`yay.preset`),
          path.normalize(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay.preset`),
        ),
        movedFromTo(
          path.normalize(`yay2.preset`),
          path.normalize(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay2.preset`),
        ),
      ],
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(PresetModSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

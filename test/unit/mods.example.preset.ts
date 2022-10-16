import path from "path";
import {
  PresetModCyberCatJson,
  PRESET_MOD_CYBERCAT_BASEDIR,
  PRESET_MOD_UNLOCKER_BASEDIR,
  PRESET_MOD_UNLOCKER_FEMDIR,
  PRESET_MOD_UNLOCKER_MASCDIR,
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
  UnknownFirstBytes: `FUBARO`,
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
      FirstString: ``,
      SecondString: ``,
      ThirdString: ``,
    },
  ],
} as PresetModCyberCatJson);

// Preset examples stolen from ACU itself,
// these are default Corpo presets.
const minimalPresetForUnlockerFem = `
LocKey#898870017445300632:10
LocKey#3358415767503712013:4
LocKey#9502141975964618858:26
LocKey#6273276747880532262:16
LocKey#17262437424467603883:14
LocKey#12711989018532128707:18
LocKey#7691166931990474829:1
LocKey#2149255562299693265:0
LocKey#7291006053821317046:0
LocKey#4316695547651688874:16
LocKey#966737433676891676:6
LocKey#5009244242618885753:16
LocKey#14034341346390445651:11
LocKey#6426888875968525879:7
LocKey#7665632322726285485:0
LocKey#7057535516503771275:0
LocKey#9633374630979636519:11
LocKey#1742638242436574334:1
LocKey#16056554541361838785:0
LocKey#2482157010324784664:1
LocKey#14413106849035572218:2
LocKey#9213787832085884965:1
LocKey#16755396525998114880:4
LocKey#9222375131461895478:0
LocKey#4717882986422351521:0
LocKey#5901794538846227818:0
LocKey#12418766767975042856:0
LocKey#11868212418525297981:0
LocKey#2154265467077242561:1
LocKey#6131936511989184869:31
LocKey#14444638123505366956:2
LocKey#7001506230645100200:0
LocKey#1579145253609442971:0
LocKey#15039822261823040660:0
LocKey#7775711960886528826:0
LocKey#11716572946352461499:0
LocKey#2480942087249619917:0
LocKey#6445917731400909894:0
`;

const minimalPresetForUnlockerMasc = `
LocKey#898870017445300632:1
LocKey#3358415767503712013:3
LocKey#9502141975964618858:10
LocKey#6270481789322187575:0
LocKey#17262437424467603883:1
LocKey#12711989018532128707:18
LocKey#7691166931990474829:6
LocKey#2149258860834577898:0
LocKey#7291006053821317046:0
LocKey#4316695547651688874:6
LocKey#966737433676891676:13
LocKey#5009244242618885753:11
LocKey#14034341346390445651:0
LocKey#7487713073032863221:0
LocKey#13707143312198505919:0
LocKey#5229311434501341836:0
LocKey#6426888875968525879:7
LocKey#7665632322726285485:0
LocKey#7057535516503771275:0
LocKey#9633374630979636519:13
LocKey#1742636043413317912:0
LocKey#16056554541361838785:0
LocKey#2482157010324784664:6
LocKey#14413101351477431163:0
LocKey#9213787832085884965:0
LocKey#6023230796470623251:0
LocKey#1500857893903977124:0
LocKey#4717882986422351521:0
LocKey#5901794538846227818:0
LocKey#12418766767975042856:2
LocKey#11868211319013669770:0
LocKey#2154265467077242561:0
LocKey#16223900489692860646:0
LocKey#7001506230645100200:0
LocKey#1579145253609442971:0
LocKey#15039822261823040660:0
LocKey#7775711960886528826:0
LocKey#11716572946352461499:0
LocKey#2480942087249619917:0
LocKey#6445917731400909894:0
`;

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
    `unlocker preset in canonical fem/masc subdir will install`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [
        path.normalize(`${PRESET_MOD_UNLOCKER_FEMDIR}\\yay.preset`),
        path.normalize(`${PRESET_MOD_UNLOCKER_MASCDIR}\\yay2.preset`),
      ],
      fsMocked: mockedFsLayout(
        {
          "yay.preset": minimalPresetForUnlockerFem,
          "yay2.preset": minimalPresetForUnlockerMasc,
        },
        PRESET_MOD_UNLOCKER_BASEDIR.split(path.sep),
      ),
      outInstructions: [
        copiedToSamePath(`${PRESET_MOD_UNLOCKER_FEMDIR}\\yay.preset`),
        copiedToSamePath(`${PRESET_MOD_UNLOCKER_MASCDIR}\\yay2.preset`),
      ],
    },
  ],
  [
    `unlocker preset in legacy basedir will install to correct subdir`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [
        path.normalize(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay.preset`),
        path.normalize(`${PRESET_MOD_UNLOCKER_BASEDIR}\\yay2.preset`),
      ],
      fsMocked: mockedFsLayout(
        {
          "yay.preset": minimalPresetForUnlockerFem,
          "yay2.preset": minimalPresetForUnlockerMasc,
        },
        PRESET_MOD_UNLOCKER_BASEDIR.split(path.sep),
      ),
      outInstructions: [
        movedFromTo(
          `${PRESET_MOD_UNLOCKER_BASEDIR}\\yay.preset`,
          `${PRESET_MOD_UNLOCKER_FEMDIR}\\yay.preset`,
        ),
        movedFromTo(
          `${PRESET_MOD_UNLOCKER_BASEDIR}\\yay2.preset`,
          `${PRESET_MOD_UNLOCKER_MASCDIR}\\yay2.preset`,
        ),
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
    `unlocker preset in toplevel will install to correct subdir`,
    {
      expectedInstallerType: InstallerType.Preset,
      inFiles: [path.normalize(`yay.preset`), path.normalize(`yay2.preset`)],
      fsMocked: mockedFsLayout({
        "yay.preset": minimalPresetForUnlockerFem,
        "yay2.preset": minimalPresetForUnlockerMasc,
      }),
      outInstructions: [
        movedFromTo(
          path.normalize(`yay.preset`),
          path.normalize(`${PRESET_MOD_UNLOCKER_FEMDIR}\\yay.preset`),
        ),
        movedFromTo(
          path.normalize(`yay2.preset`),
          path.normalize(`${PRESET_MOD_UNLOCKER_MASCDIR}\\yay2.preset`),
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

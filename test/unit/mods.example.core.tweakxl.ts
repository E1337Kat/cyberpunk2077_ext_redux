import path from "path";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  createdDirectory,
  copiedToSamePath,
  ExampleFailingMod,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const CoreTweakXLInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreTweakXLInstallCanon: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
        path.join(`red4ext\\plugins\\TweakXL\\Data\\`),
        path.join(`red4ext\\plugins\\TweakXL\\Data\\ExtraFlats.dat`),
        path.join(`red4ext\\plugins\\TweakXL\\Data\\InheritanceMap.dat`),
        path.join(`red4ext\\plugins\\TweakXL\\LICENSE`),
        path.join(`red4ext\\plugins\\TweakXL\\THIRD_PARTY_LICENSES`),
      ],
      outInstructions: [
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Data\\ExtraFlats.dat`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Data\\InheritanceMap.dat`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\LICENSE`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\THIRD_PARTY_LICENSES`),
      ],
    },
    coreTweakXLInstallCanonWithRandomStuff: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\iguesswhatever.archive`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\shruggies.reds`),
      ],
      outInstructions: [
        createdDirectory(`r6\\tweaks\\`), // This is a special case
        copiedToSamePath(`red4ext\\plugins\\iguesswhatever.archive`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\shruggies.reds`),
      ],
    },
  }),
);

const CoreTweakXLShouldFailOnInstallIfNotExactLayout = new Map<string, ExampleFailingMod>(
  Object.entries({
    coreTweakXLOutdated: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`r6\\`),
        path.join(`red4ext\\`),
        path.join(`r6\\scripts\\`),
        path.join(`r6\\scripts\\TweakXL\\`),
        path.join(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        path.join(`r6\\tweaks\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
      ],
      failure: `Didn't Find Expected TweakXL Installation!`,
      errorDialogTitle: `Didn't Find Expected TweakXL Installation!`,
    },
    coreTweakXLOutdatedAgain: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
      ],
      failure: `Didn't Find Expected TweakXL Installation!`,
      errorDialogTitle: `Didn't Find Expected TweakXL Installation!`,
    },
    coreTweakXLWithMissing: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
      ],
      failure: `Didn't Find Expected TweakXL Installation!`,
      errorDialogTitle: `Didn't Find Expected TweakXL Installation!`,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(CoreTweakXLInstallSucceeds),
  AllExpectedDirectFailures: mergeOrFailOnConflict(CoreTweakXLShouldFailOnInstallIfNotExactLayout),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

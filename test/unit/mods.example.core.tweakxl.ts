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
        createdDirectory(`r6\\tweaks\\`), // This is a special case
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
        createdDirectory(`r6\\tweaks\\`), // This is a special case
        copiedToSamePath(`red4ext\\plugins\\iguesswhatever.archive`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Data\\ExtraFlats.dat`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Data\\InheritanceMap.dat`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\LICENSE`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\THIRD_PARTY_LICENSES`),
      ],
    },
  }),
);

// TweakXL varies what it ships between releases; each of these is a
// real shape and all of them install as-is.
const CoreTweakXLInstallsWhateverTheReleaseShips = new Map<string, ExampleSucceedingMod>(
  Object.entries({
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
      outInstructions: [
        createdDirectory(`r6\\tweaks\\`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.Global.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\Scripts\\TweakXL.reds`),
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    CoreTweakXLInstallSucceeds,
    CoreTweakXLInstallsWhateverTheReleaseShips,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

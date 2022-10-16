import path from "path";
import { InstallerType } from "../../src/installers.types";
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
        path.join(`r6\\`),
        path.join(`red4ext\\`),
        path.join(`r6\\scripts\\`),
        path.join(`r6\\scripts\\TweakXL\\`),
        path.join(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        path.join(`r6\\tweaks\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
      ],
      outInstructions: [
        createdDirectory(`r6\\tweaks\\`), // This is a special case
        copiedToSamePath(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
      ],
    },
  }),
);

const CoreTweakXLShouldFailOnInstallIfNotExactLayout = new Map<string, ExampleFailingMod>(
  Object.entries({
    coreTweakXLWithExtraFiles: {
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
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        path.join(`archive\\pc\\mod\\tweakarchive.archive`),
      ],
      failure: `Didn't Find Expected TweakXL Installation!`,
      errorDialogTitle: `Didn't Find Expected TweakXL Installation!`,
    },
    coreTweakXLWithMissingFiles: {
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

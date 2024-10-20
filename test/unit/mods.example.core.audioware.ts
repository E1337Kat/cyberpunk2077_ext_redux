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

const CoreAudiowareInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreAudiowareInstallCanon: {
      expectedInstallerType: InstallerType.CoreAudioware,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\Audioware\\`),
        path.join(`red4ext\\plugins\\Audioware\\audioware.dll`),
        path.join(`r6\\scripts\\Audioware\\Codeware.reds`),
        path.join(`r6\\scripts\\Audioware\\Config.reds`),
        path.join(`r6\\scripts\\Audioware\\Ext.reds`),
        path.join(`r6\\scripts\\Audioware\\Hooks.reds`),
        path.join(`r6\\scripts\\Audioware\\Natives.reds`),
        path.join(`r6\\scripts\\Audioware\\Preset.reds`),
        path.join(`r6\\scripts\\Audioware\\Service.reds`),
        path.join(`r6\\scripts\\Audioware\\Settings.reds`),
        path.join(`r6\\scripts\\Audioware\\System.reds`),
        path.join(`r6\\scripts\\Audioware\\Tween.reds`),
        path.join(`r6\\scripts\\Audioware\\Utils.reds`),
      ],
      outInstructions: [
        createdDirectory(`r6\\audioware\\`), // This is a special case
        copiedToSamePath(`red4ext\\plugins\\Audioware\\audioware.dll`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Codeware.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Config.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Ext.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Hooks.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Natives.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Preset.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Service.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Settings.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\System.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Tween.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Utils.reds`),

      ],
    },
    coreAudiowareInstallCanonWithRandomStuff: {
      expectedInstallerType: InstallerType.CoreAudioware,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\iguesswhatever.archive`),
        path.join(`red4ext\\plugins\\Audioware\\`),
        path.join(`red4ext\\plugins\\Audioware\\audioware.dll`),
        path.join(`r6\\scripts\\Audioware\\Codeware.reds`),
        path.join(`r6\\scripts\\Audioware\\Config.reds`),
        path.join(`r6\\scripts\\Audioware\\Ext.reds`),
        path.join(`r6\\scripts\\Audioware\\Hooks.reds`),
        path.join(`r6\\scripts\\Audioware\\Natives.reds`),
        path.join(`r6\\scripts\\Audioware\\Preset.reds`),
        path.join(`r6\\scripts\\Audioware\\Service.reds`),
        path.join(`r6\\scripts\\Audioware\\Settings.reds`),
        path.join(`r6\\scripts\\Audioware\\System.reds`),
        path.join(`r6\\scripts\\Audioware\\Tween.reds`),
        path.join(`r6\\scripts\\Audioware\\Utils.reds`),
      ],
      outInstructions: [
        createdDirectory(`r6\\tweaks\\`), // This is a special case
        copiedToSamePath(`red4ext\\plugins\\iguesswhatever.archive`),
        copiedToSamePath(`red4ext\\plugins\\Audioware\\audioware.dll`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Codeware.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Config.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Ext.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Hooks.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Natives.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Preset.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Service.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Settings.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\System.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Tween.reds`),
        copiedToSamePath(`r6\\scripts\\Audioware\\Utils.reds`),
      ],
    },
  }),
);

const CoreAudiowareShouldFailOnInstallIfNotExactLayout = new Map<string, ExampleFailingMod>(
  Object.entries({
    coreAudiowareOutdated: {
      expectedInstallerType: InstallerType.CoreAudioware,
      inFiles: [
        path.join(`r6\\`),
        path.join(`red4ext\\`),
        path.join(`r6\\scripts\\Audioware\\Codeware.reds`),
        path.join(`r6\\scripts\\Audioware\\Config.reds`),
        path.join(`r6\\scripts\\Audioware\\Ext.reds`),
        path.join(`r6\\scripts\\Audioware\\Hooks.reds`),
        path.join(`r6\\scripts\\Audioware\\Natives.reds`),
        path.join(`r6\\scripts\\Audioware\\Preset.reds`),
        path.join(`r6\\scripts\\Audioware\\Service.reds`),
        path.join(`r6\\scripts\\Audioware\\Settings.reds`),
        path.join(`r6\\scripts\\Audioware\\System.reds`),
        path.join(`r6\\scripts\\Audioware\\Tween.reds`),
        path.join(`r6\\scripts\\Audioware\\Utils.reds`),
        path.join(`r6\\audioware\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\Audioware\\`),
      ],
      failure: `Didn't Find Expected Audioware Installation!`,
      errorDialogTitle: `Didn't Find Expected Audioware Installation!`,
    },
    coreAudiowareWithMissing: {
      expectedInstallerType: InstallerType.CoreAudioware,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\Audioware\\`),
      ],
      failure: `Didn't Find Expected Audioware Installation!`,
      errorDialogTitle: `Didn't Find Expected Audioware Installation!`,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(CoreAudiowareInstallSucceeds),
  AllExpectedDirectFailures: mergeOrFailOnConflict(CoreAudiowareShouldFailOnInstallIfNotExactLayout),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

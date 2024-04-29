import path from "path";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  copiedToSamePath,
  ExampleFailingMod,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExamplePromptInstallableMod,
  RED4EXT_PREFIX,
} from "./utils.helper";

const CoreArchiveXLInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreArchiveXLInstallCanon: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`r6\\`),
        path.join(`r6\\config\\`),
        path.join(`r6\\config\\ArchiveXL.toml`),
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
        path.join(`red4ext\\plugins\\ArchiveXL\\Scripts\\ArchiveXL.Global.reds`),
        path.join(`red4ext\\plugins\\ArchiveXL\\Scripts\\ArchiveXL.reds`),
      ],
      outInstructions: [
        copiedToSamePath(`r6\\config\\ArchiveXL.toml`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\ArchiveXL.dll`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\Scripts\\ArchiveXL.Global.reds`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\Scripts\\ArchiveXL.reds`),
      ],
    },
    coreArchiveXLInstallCanonWithRandomStuff: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`r6\\`),
        path.join(`r6\\config\\`),
        path.join(`r6\\config\\ArchiveXL.toml`),
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
        path.join(`red4ext\\plugins\\ArchiveXL\\archive.dll.xl.archive`),
        path.join(`red4ext\\plugins\\ArchiveXL\\Scripts\\ArchiveXL.Global.reds`),
        path.join(`red4ext\\plugins\\ArchiveXL\\Scripts\\ArchiveXL.reds`),
      ],
      outInstructions: [
        copiedToSamePath(`r6\\config\\ArchiveXL.toml`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\ArchiveXL.dll`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\archive.dll.xl.archive`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\Scripts\\ArchiveXL.Global.reds`),
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\Scripts\\ArchiveXL.reds`),
      ],
    },
  }),
);

const CoreArchiveXLShouldFailOnInstallIfNotExactLayout = new Map<
string,
ExampleFailingMod
>(
  Object.entries({
    outdatedcoreArchiveXLInstallCanon: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
        path.join(`r6\\`),
        path.join(`r6\\scripts\\`),
        path.join(`r6\\scripts\\ArchiveXL\\`),
        path.join(`r6\\scripts\\ArchiveXL\\ArchiveXL.reds`),
      ],
      failure: `Didn't Find Expected ArchiveXL Installation!`,
      errorDialogTitle: `Didn't Find Expected ArchiveXL Installation!`,
    },
    coreArchiveXLWithExtraFiles: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
      ],
      failure: `Didn't Find Expected ArchiveXL Installation!`,
      errorDialogTitle: `Didn't Find Expected ArchiveXL Installation!`,
    },
  }),
);
const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(CoreArchiveXLInstallSucceeds),
  AllExpectedDirectFailures: mergeOrFailOnConflict(CoreArchiveXLShouldFailOnInstallIfNotExactLayout),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

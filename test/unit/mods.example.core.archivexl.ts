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
  REDS_PREFIX,
} from "./utils.helper";

const CoreArchiveXLInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreArchiveXLInstallCanon: {
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
      outInstructions: [
        copiedToSamePath(`${RED4EXT_PREFIX}\\ArchiveXL\\ArchiveXL.dll`),
        copiedToSamePath(`${REDS_PREFIX}\\ArchiveXL\\ArchiveXL.reds`),
      ],
    },
  }),
);

const CoreArchiveXLShouldFailOnInstallIfNotExactLayout = new Map<
string,
ExampleFailingMod
>(
  Object.entries({
    coreArchiveXLWithExtraFiles: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
        path.join(`archive\\pc\\mod\\tweakarchive.archive`),
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

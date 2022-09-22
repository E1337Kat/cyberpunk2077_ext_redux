import path from "path";
import { InstallerType } from "../../src/installers.types";
import { InstallChoices } from "../../src/ui.dialogs";
import {
  ExampleSucceedingMod,
  pathHierarchyFor,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  copiedToSamePath,
  createdDirectory,
} from "./utils.helper";

const CoreRed4ExtInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    Red4ExtCoreOneSevenInstallTest: {
      expectedInstallerType: InstallerType.CoreRed4ext,
      inFiles: [
        ...pathHierarchyFor(path.normalize(`bin/x64`)),
        path.normalize(`bin/x64/d3d11.dll`),
        ...pathHierarchyFor(path.normalize(`red4ext/plugins`)),
        path.normalize(`red4ext/LICENSE.txt`),
        path.normalize(`red4ext/THIRD_PARTY_LICENSES.txt`),
        path.normalize(`red4ext/RED4ext.dll`),
      ].map(path.normalize),
      outInstructions: [
        copiedToSamePath(path.normalize(`bin/x64/d3d11.dll`)),
        copiedToSamePath(path.normalize(`red4ext/LICENSE.txt`)),
        copiedToSamePath(path.normalize(`red4ext/THIRD_PARTY_LICENSES.txt`)),
        copiedToSamePath(path.normalize(`red4ext/RED4ext.dll`)),
        createdDirectory(path.normalize(`red4ext/plugins`)),
      ],
    },
    Red4ExtCoreOneNineInstallTest: {
      expectedInstallerType: InstallerType.CoreRed4ext,
      inFiles: [
        ...pathHierarchyFor(path.normalize(`bin/x64`)),
        path.normalize(`bin/x64/winmm.dll`),
        ...pathHierarchyFor(path.normalize(`red4ext/plugins`)),
        path.normalize(`red4ext/LICENSE.txt`),
        path.normalize(`red4ext/THIRD_PARTY_LICENSES.txt`),
        path.normalize(`red4ext/RED4ext.dll`),
      ].map(path.normalize),
      outInstructions: [
        copiedToSamePath(path.normalize(`bin/x64/winmm.dll`)),
        copiedToSamePath(path.normalize(`red4ext/LICENSE.txt`)),
        copiedToSamePath(path.normalize(`red4ext/THIRD_PARTY_LICENSES.txt`)),
        copiedToSamePath(path.normalize(`red4ext/RED4ext.dll`)),
        createdDirectory(path.normalize(`red4ext/plugins`)),
      ],
    },
  }),
);

const CoreRed4ExtShouldWarnOnDeprecatedInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    Red4ExtDeprecatedCoreInstallTest: {
      expectedInstallerType: InstallerType.CoreRed4ext,
      inFiles: [
        ...pathHierarchyFor(path.normalize(`bin/x64`)),
        path.normalize(`bin/x64/powrprof.dll`),
        ...pathHierarchyFor(path.normalize(`red4ext/plugins`)),
        path.normalize(`red4ext/LICENSE.txt`),
        path.normalize(`red4ext/RED4ext.dll`),
      ].map(path.normalize),
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(path.normalize(`bin/x64/powrprof.dll`)),
        copiedToSamePath(path.normalize(`red4ext/LICENSE.txt`)),
        copiedToSamePath(path.normalize(`red4ext/RED4ext.dll`)),
        createdDirectory(path.normalize(`red4ext/plugins`)),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: `${InstallerType.CoreRed4ext}: user chose to cancel installing deprecated version`,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreRed4ExtInstall,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: CoreRed4ExtShouldWarnOnDeprecatedInstall,
};

export default examples;

import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  pathHierarchyFor,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  mergeOrFailOnConflict,
  copiedToSamePath,
} from "./utils.helper";

const CoreRed4ExtInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    Red4ExtCoreInstallTest: {
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
        {
          type: `mkdir`,
          destination: path.normalize(`red4ext/plugins`),
        },
      ],
    },
  }),
);

const DeprecatedCoreRed4ExtInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    DeprecatedRed4ExtCoreInstallTest: {
      expectedInstallerType: InstallerType.CoreRed4ext,
      inFiles: [
        ...pathHierarchyFor(path.normalize(`bin/x64`)),
        path.normalize(`bin/x64/powrprof.dll`),
        ...pathHierarchyFor(path.normalize(`red4ext/plugins`)),
        path.normalize(`red4ext/LICENSE.txt`),
        path.normalize(`red4ext/RED4ext.dll`),
      ].map(path.normalize),
      outInstructions: [
        copiedToSamePath(path.normalize(`bin/x64/powrprof.dll`)),
        copiedToSamePath(path.normalize(`red4ext/LICENSE.txt`)),
        copiedToSamePath(path.normalize(`red4ext/RED4ext.dll`)),
        {
          type: `mkdir`,
          destination: path.normalize(`red4ext/plugins`),
        },
      ],
      infoDialogTitle: `Old RED4Ext version!`,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    CoreRed4ExtInstall,
    DeprecatedCoreRed4ExtInstall,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

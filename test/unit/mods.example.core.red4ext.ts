import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  pathHierarchyFor,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const CoreRed4ExtInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    Red4ExtCoreInstallTest: {
      expectedInstallerType: InstallerType.CoreRed4ext,
      inFiles: [
        ...pathHierarchyFor(path.normalize(`bin/x64`)),
        path.normalize(`bin/x64/powrprof.dll`),
        ...pathHierarchyFor(path.normalize(`red4ext/plugins`)),
        path.normalize(`red4ext/LICENSE.txt`),
        path.normalize(`red4ext/RED4ext.dll`),
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`bin/x64/powrprof.dll`),
          destination: path.normalize(`bin/x64/powrprof.dll`),
        },
        {
          type: `copy`,
          source: path.normalize(`red4ext/LICENSE.txt`),
          destination: path.normalize(`red4ext/LICENSE.txt`),
        },
        {
          type: `copy`,
          source: path.normalize(`red4ext/RED4ext.dll`),
          destination: path.normalize(`red4ext/RED4ext.dll`),
        },
        {
          type: `mkdir`,
          destination: path.normalize(`red4ext/plugins`),
        },
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreRed4ExtInstall,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

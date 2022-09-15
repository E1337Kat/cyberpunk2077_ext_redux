import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const CoreRedscriptInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreRedscriptInstall: {
      expectedInstallerType: InstallerType.CoreRedscript,
      inFiles: [
        path.join(`engine/`),
        path.join(`engine/config/`),
        path.join(`engine/config/base/`),
        path.join(`engine/config/base/scripts.ini`),
        path.join(`engine/tools/`),
        path.join(`engine/tools/scc.exe`),
        path.join(`r6/`),
        path.join(`r6/scripts/`),
        path.join(`r6/scripts/redscript.toml`),
      ].map(path.normalize),
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`engine/config/base/scripts.ini`),
          destination: path.join(`engine/config/base/scripts.ini`),
        },
        {
          type: `copy`,
          source: path.join(`engine/tools/scc.exe`),
          destination: path.join(`engine/tools/scc.exe`),
        },
        {
          type: `copy`,
          source: path.join(`r6/scripts/redscript.toml`),
          destination: path.join(`r6/scripts/redscript.toml`),
        },
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreRedscriptInstall,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

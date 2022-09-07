import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  REDMOD_PREFIXES,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
} from "./utils.helper";

const REDmodSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    redmodBasicCanonical: {
      expectedInstallerType: InstallerType.REDmod,
      inFiles: [
        ...REDMOD_PREFIXES,
        path.join(`myRedMod/`),
        path.join(`/myRedMod/info.json`),
        path.join(`/myRedMod/archives/`),
        path.join(`/myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`/myRedMod/info.json`),
          destination: path.join(`mods/myRedMod/info.json`),
        },
        {
          type: `copy`,
          source: path.join(`/myRedMod/archives/cool_stuff.archive`),
          destination: path.join(`mods/myRedMod/archives/cool_stuff.archive`),
        },
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: REDmodSucceeds,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

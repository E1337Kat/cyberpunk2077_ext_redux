import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  REDMOD_PREFIXES,
  REDMOD_PREFIX,
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
        path.join(`${REDMOD_PREFIX}/myRedMod/`),
        path.join(`${REDMOD_PREFIX}/myRedMod/info.json`),
        path.join(`${REDMOD_PREFIX}/myRedMod/archives/`),
        path.join(`${REDMOD_PREFIX}/myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${REDMOD_PREFIX}/myRedMod/info.json`),
          destination: path.join(`mods/${REDMOD_PREFIX}/myRedMod/info.json`),
        },
        {
          type: `copy`,
          source: path.join(`${REDMOD_PREFIX}/myRedMod/archives/cool_stuff.archive`),
          destination: path.join(`mods/${REDMOD_PREFIX}/myRedMod/archives/cool_stuff.archive`),
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

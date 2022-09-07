import path from "path";
import { REDMOD_CANONICAL_BASEDIR } from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  movedFromTo,
} from "./utils.helper";

const REDmodSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    redmodBasicCanonical: {
      expectedInstallerType: InstallerType.REDmod,
      inFiles: [
        path.join(`myRedMod/`),
        path.join(`myRedMod/info.json`),
        path.join(`myRedMod/archives/`),
        path.join(`myRedMod/archives/cool_stuff.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.normalize(`myRedMod/info.json`),
          path.normalize(`${REDMOD_CANONICAL_BASEDIR}/myRedMod/info.json`),
        ),
        movedFromTo(
          path.normalize(`myRedMod/archives/cool_stuff.archive`),
          path.normalize(`${REDMOD_CANONICAL_BASEDIR}/myRedMod/archives/cool_stuff.archive`),
        ),
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

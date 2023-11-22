import path from "path";
import {
  map,
} from "fp-ts/lib/ReadonlyArray";
import {
  pipe,
} from "fp-ts/lib/function";
import {
  InstallerType,
} from "../../src/installers.types";
import {
  copiedToSamePath,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  ExampleSucceedingMod,
  RED4EXT_PREFIXES,
  RED4EXT_PREFIX,
} from "./utils.helper";


const CoreInputLoaderInstallSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    red4extWithRedScriptEmbeddedCanonical: {
      expectedInstallerType: InstallerType.CoreModSettings,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/mod_settings/`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/ModSettings.archive`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/ModSettings.archive.xl`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/license.md`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/mod_settings.dll`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/module.reds`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/packed.reds`),
        path.join(`${RED4EXT_PREFIX}/mod_settings/readme.md`),
      ],
      outInstructions: [
        ...pipe(
          [
            path.join(`${RED4EXT_PREFIX}/mod_settings/ModSettings.archive`),
            path.join(`${RED4EXT_PREFIX}/mod_settings/ModSettings.archive.xl`),
            path.join(`${RED4EXT_PREFIX}/mod_settings/license.md`),
            path.join(`${RED4EXT_PREFIX}/mod_settings/mod_settings.dll`),
            path.join(`${RED4EXT_PREFIX}/mod_settings/module.reds`),
            path.join(`${RED4EXT_PREFIX}/mod_settings/packed.reds`),
            path.join(`${RED4EXT_PREFIX}/mod_settings/readme.md`),
          ],
          map(copiedToSamePath),
        ),
      ],
    },
  }),
);


const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreInputLoaderInstallSucceeds,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

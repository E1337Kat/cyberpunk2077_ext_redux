import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  CET_GIFTWRAPS,
  GIFTWRAP_PREFIX,
  CET_PREFIX,
  CET_INIT,
  REDS_GIFTWRAPS,
  REDS_PREFIX,
  RED4EXT_GIFTWRAPS,
  RED4EXT_PREFIX,
  ARCHIVE_GIFTWRAPS,
  ARCHIVE_PREFIX,
  FAKE_MOD_NAME,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const GiftwrappedModsFixable = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    multipleModtypesWrappedAreUnwrappedFixable: {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${REDS_PREFIX}/rexmod/script.reds`),
        ...RED4EXT_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${RED4EXT_PREFIX}/script.dll`),
        ...ARCHIVE_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        },
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(GiftwrappedModsFixable),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

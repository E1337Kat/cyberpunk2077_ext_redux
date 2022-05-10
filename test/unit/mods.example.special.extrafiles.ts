import path from "path";
import {
  MODS_EXTRA_BASEDIR,
  MODS_EXTRA_FILETYPES_ALLOWED_IN_ANY_MOD,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExamplesForType,
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  mergeOrFailOnConflict,
  CET_PREFIXES,
  FAKE_MOD_NAME,
  movedFromTo,
  CET_PREFIX,
  copiedToSamePath,
} from "./utils.helper";

const ModWithAllowedExtraFileTypes = new Map<string, ExampleSucceedingMod>(
  MODS_EXTRA_FILETYPES_ALLOWED_IN_ANY_MOD.map((extension) => [
    `Extra files with allowed type ${extension} at toplevel are copied to .\\${MODS_EXTRA_BASEDIR}\\<modname>\\`,
    {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}\\${FAKE_MOD_NAME}\\init.lua`),
        path.join(`somefile${extension}`),
        path.join(`someotherfile${extension}`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}\\${FAKE_MOD_NAME}\\init.lua`),
        movedFromTo(
          `somefile${extension}`,
          `${MODS_EXTRA_BASEDIR}\\${FAKE_MOD_NAME}\\somefile${extension}`,
        ),
        movedFromTo(
          `someotherfile${extension}`,
          `${MODS_EXTRA_BASEDIR}\\${FAKE_MOD_NAME}\\someotherfile${extension}`,
        ),
      ],
    },
  ]),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(ModWithAllowedExtraFileTypes),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

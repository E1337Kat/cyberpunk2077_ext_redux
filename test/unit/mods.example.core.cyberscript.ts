import path from "path";
import {
  CET_MOD_CANONICAL_PATH_PREFIX,
  CYBERSCRIPT_CORE_CETBASEDIR,
  CYBERSCRIPT_CORE_REQUIRED_FILES,
  REDMOD_BASEDIR,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExamplesForType,
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  pathHierarchyFor,
  copiedToSamePath,
} from "./utils.helper";

const CYBERSCRIPT_PREFIXES = [
  ...pathHierarchyFor(REDMOD_BASEDIR),
  ...pathHierarchyFor(CYBERSCRIPT_CORE_CETBASEDIR),
  ...pathHierarchyFor(`${CYBERSCRIPT_CORE_CETBASEDIR}\\datapack\\`),
];

// This isn’t quite exhaustive, but covers all existing dirs at least.
const CYBERSCRIPT_EXAMPLE_CONTENTS_WITHOUT_REQUIRED = [
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\changelog.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\db.sqlite3`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\desc.json`),

  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\assets\\fixer\\fixer_rogue.json`),

  
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\datapack\\placeholder`),


  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\editor\\editor.lua`),

  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\data\\appearances.csv`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\data\\CharacterTable.xlsx`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\data\\districts.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\data\\attitudegroup\\Group_6thStreet.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\data\\anims\\CharacterEntryLibrary.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\data\\anims\\workspot\\cyberscript_workspot_base.json`),

  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\external\\AIControl.lua`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\external\\Cron.lua`),

  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\lang\\default.json`),

  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\modules\\av.lua`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\mod\\modules\\observers\\gamecontroller.lua`),

  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\user\\cache\\placeholder`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\user\\editor_output\\placeholder`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\user\\sessions\\placeholder`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\user\\settings\\placeholder`),

 
];

const CYBERSCRIPT_EXAMPLE_CONTENTS_WITHOUT_ALL_REQUIRED = [
  ...CYBERSCRIPT_EXAMPLE_CONTENTS_WITHOUT_REQUIRED,
  CYBERSCRIPT_CORE_REQUIRED_FILES[0],
];

const CYBERSCRIPT_EXAMPLE_CONTENTS_WITH_REQUIRED = [
  ...CYBERSCRIPT_EXAMPLE_CONTENTS_WITHOUT_REQUIRED,
  ...CYBERSCRIPT_CORE_REQUIRED_FILES,
];

const CyberScriptCoreInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Core CyberScript installs without prompting when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreCyberScript,
      inFiles: [...CYBERSCRIPT_PREFIXES, ...CYBERSCRIPT_EXAMPLE_CONTENTS_WITH_REQUIRED],
      outInstructions: [
        ...CYBERSCRIPT_EXAMPLE_CONTENTS_WITH_REQUIRED.map((p) => copiedToSamePath(p)),
      ],
    },
  ],
]);

const CyberScriptCoreFailsDirectly = new Map<string, ExampleFailingMod>([
  [
    `Core CyberScript cancels installation without prompting when all required paths are not present`,
    {
      expectedInstallerType: InstallerType.CoreCyberScript,
      inFiles: [
        ...CYBERSCRIPT_PREFIXES,
        ...CYBERSCRIPT_EXAMPLE_CONTENTS_WITHOUT_ALL_REQUIRED,
      ],
      failure: `Didn't find all required CyberScript files!`,
      errorDialogTitle: `Didn't find all required CyberScript files!`,
    },
  ],
  [
    `Core CyberScript cancels installation without prompting when extra files in unknown paths`,
    {
      expectedInstallerType: InstallerType.CoreCyberScript,
      inFiles: [
        ...CYBERSCRIPT_PREFIXES,
        ...CYBERSCRIPT_EXAMPLE_CONTENTS_WITH_REQUIRED,
        `${CET_MOD_CANONICAL_PATH_PREFIX}\\someothermod\\init.lua`,
      ],
      failure: `Found files outside known CyberScript directories!`,
      errorDialogTitle: `Found files outside known CyberScript directories!`,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CyberScriptCoreInstallSucceeds,
  AllExpectedDirectFailures: CyberScriptCoreFailsDirectly,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

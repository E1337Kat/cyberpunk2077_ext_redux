import path from "path";
import {
  CET_MOD_CANONICAL_PATH_PREFIX,
  CYBERSCRIPT_CORE_CETBASEDIR,
  CYBERSCRIPT_CORE_CPSTYLING_PLUGINDIR,
  CYBERSCRIPT_CORE_REQUIRED_FILES,
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
  ...pathHierarchyFor(CYBERSCRIPT_CORE_CETBASEDIR),
  ...pathHierarchyFor(`${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\event`),
];

// This isn’t quite exhaustive, but covers all existing dirs at least.
const CYBERSCRIPT_EXAMPLE_CONTENTS_WITHOUT_REQUIRED = [
  path.normalize(`${CYBERSCRIPT_CORE_CPSTYLING_PLUGINDIR}\\whatevs.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\changelog.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\db.sqlite3`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\desc.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\env.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\inputUserMappings.xml`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\multi.txt`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\music.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\sound.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\db\\actiontemplate.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\db\\appearances.csv`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\db\\CharacterTable.xlsx`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\db\\districts.json`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\db\\attitudegroup\\Group_6thStreet.json`,
  ),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\img\\cyberpunk.png`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\img\\phonelog.png`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\lang\\default.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\data\\sessions\\placeholder`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\external\\AIControl.lua`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\external\\Cron.lua`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\desc.json`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\dialog\\nash_special01.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\event\\tutorial_help.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\faction\\faction_afterlife.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\fixer\\fixer_captain.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\function\\current_star_follower.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\function\\del_av_service.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\help\\credit.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\interact\\open_datapack_group_ui.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\interfaces\\delamain_services.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\lang\\lang_1.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\phone_dialog\\del_taxi_service.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\place\\place_1.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\place\\vapart.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\poi\\Ambush_ARR_1.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\sound\\ono.mp3`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\datapack\\default\\sound\\test.mp3`,
  ),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\mydatapack\\desc.json`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\json\\mydatapack\\circuit\\placeholder`,
  ),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\modules\\av.lua`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\action.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\mymissions.json`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\res.txt`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\userInput.txt`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\missions\\placeholder`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\modpack\\placeholder`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\net\\multi\\player\\faction.txt`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\DotNetZip.dll`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\Frameworklog.txt`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\framework_setting.json`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.deps.json`,
  ),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.dll`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.exe`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.pdb`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.runtimeconfig.dev.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.runtimeconfig.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\Microsoft.EntityFrameworkCore.Abstractions.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\Microsoft.EntityFrameworkCore.dll`,
  ),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\NAudio.Asio.dll`),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\Newtonsoft.Json.dll`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\System.Collections.Immutable.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\runtimes\\win\\lib\\netcoreapp2.0`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\tools\\runtimes\\win\\lib\\netcoreapp2.0\\System.Text.Encoding.CodePages.dll`,
  ),
  path.normalize(`${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\DotNetZip.dll`),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.deps.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.exe`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.pdb`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.runtimeconfig.dev.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.runtimeconfig.json`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\System.Security.Permissions.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\System.Windows.Extensions.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\ref\\ImmersiveRoleplayFrameworkUpdater.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\runtimes\\unix\\lib\\netcoreapp3.0\\System.Drawing.Common.dll`,
  ),
  path.normalize(
    `${CYBERSCRIPT_CORE_CETBASEDIR}\\updater\\runtimes\\win\\lib\\netcoreapp3.0\\Microsoft.Win32.SystemEvents.dll`,
  ),
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

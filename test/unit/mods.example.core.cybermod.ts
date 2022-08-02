import path from "path";
import {
  CET_MOD_CANONICAL_PATH_PREFIX,
  CYBERMOD_CORE_CETBASEDIR,
  CYBERMOD_CORE_CPSTYLING_PLUGINDIR,
  CYBERMOD_CORE_REQUIRED_FILES,
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

const CYBERMOD_PREFIXES = [
  ...pathHierarchyFor(CYBERMOD_CORE_CETBASEDIR),
  ...pathHierarchyFor(`${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\event`),
];

// This isn’t quite exhaustive, but covers all existing dirs at least.
const CYBERMOD_EXAMPLE_CONTENTS_WITHOUT_REQUIRED = [
  path.normalize(`${CYBERMOD_CORE_CPSTYLING_PLUGINDIR}\\whatevs.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\changelog.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\db.sqlite3`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\desc.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\env.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\inputUserMappings.xml`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\multi.txt`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\music.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\sound.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\db\\actiontemplate.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\db\\appearances.csv`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\db\\CharacterTable.xlsx`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\db\\districts.json`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\data\\db\\attitudegroup\\Group_6thStreet.json`,
  ),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\img\\cyberpunk.png`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\img\\phonelog.png`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\lang\\default.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\data\\sessions\\placeholder`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\external\\AIControl.lua`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\external\\Cron.lua`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\desc.json`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\dialog\\nash_special01.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\event\\tutorial_help.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\faction\\faction_afterlife.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\fixer\\fixer_captain.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\function\\current_star_follower.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\function\\del_av_service.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\help\\credit.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\interact\\open_datapack_group_ui.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\interfaces\\delamain_services.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\lang\\lang_1.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\phone_dialog\\del_taxi_service.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\place\\place_1.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\place\\vapart.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\poi\\Ambush_ARR_1.json`,
  ),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\sound\\ono.mp3`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\json\\datapack\\default\\sound\\test.mp3`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\json\\mydatapack\\desc.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\json\\mydatapack\\circuit\\placeholder`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\modules\\av.lua`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\action.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\mymissions.json`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\res.txt`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\userInput.txt`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\missions\\placeholder`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\modpack\\placeholder`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\net\\multi\\player\\faction.txt`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\DotNetZip.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\Frameworklog.txt`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\framework_setting.json`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.deps.json`,
  ),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.exe`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.pdb`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.runtimeconfig.dev.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\tools\\ImmersiveRoleplayFramework.runtimeconfig.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\tools\\Microsoft.EntityFrameworkCore.Abstractions.dll`,
  ),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\Microsoft.EntityFrameworkCore.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\NAudio.Asio.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\Newtonsoft.Json.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\System.Collections.Immutable.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\tools\\runtimes\\win\\lib\\netcoreapp2.0`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\tools\\runtimes\\win\\lib\\netcoreapp2.0\\System.Text.Encoding.CodePages.dll`,
  ),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\updater\\DotNetZip.dll`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.deps.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.dll`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.exe`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.pdb`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.runtimeconfig.dev.json`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ImmersiveRoleplayFrameworkUpdater.runtimeconfig.json`,
  ),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\updater\\System.Security.Permissions.dll`),
  path.normalize(`${CYBERMOD_CORE_CETBASEDIR}\\updater\\System.Windows.Extensions.dll`),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\ref\\ImmersiveRoleplayFrameworkUpdater.dll`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\runtimes\\unix\\lib\\netcoreapp3.0\\System.Drawing.Common.dll`,
  ),
  path.normalize(
    `${CYBERMOD_CORE_CETBASEDIR}\\updater\\runtimes\\win\\lib\\netcoreapp3.0\\Microsoft.Win32.SystemEvents.dll`,
  ),
];

const CYBERMOD_EXAMPLE_CONTENTS_WITHOUT_ALL_REQUIRED = [
  ...CYBERMOD_EXAMPLE_CONTENTS_WITHOUT_REQUIRED,
  CYBERMOD_CORE_REQUIRED_FILES[0],
];

const CYBERMOD_EXAMPLE_CONTENTS_WITH_REQUIRED = [
  ...CYBERMOD_EXAMPLE_CONTENTS_WITHOUT_REQUIRED,
  ...CYBERMOD_CORE_REQUIRED_FILES,
];

const CyberModCoreInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Core CyberMod installs without prompting when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreCyberMod,
      inFiles: [...CYBERMOD_PREFIXES, ...CYBERMOD_EXAMPLE_CONTENTS_WITH_REQUIRED],
      outInstructions: [
        ...CYBERMOD_EXAMPLE_CONTENTS_WITH_REQUIRED.map((p) => copiedToSamePath(p)),
      ],
    },
  ],
]);

const CyberModCoreFailsDirectly = new Map<string, ExampleFailingMod>([
  [
    `Core CyberMod cancels installation without prompting when all required paths are not present`,
    {
      expectedInstallerType: InstallerType.CoreCyberMod,
      inFiles: [...CYBERMOD_PREFIXES, ...CYBERMOD_EXAMPLE_CONTENTS_WITHOUT_ALL_REQUIRED],
      failure: `Didn't find all required CyberScript files!`,
      errorDialogTitle: `Didn't find all required CyberScript files!`,
    },
  ],
  [
    `Core CyberMod cancels installation without prompting when extra files in unknown paths`,
    {
      expectedInstallerType: InstallerType.CoreCyberMod,
      inFiles: [
        ...CYBERMOD_PREFIXES,
        ...CYBERMOD_EXAMPLE_CONTENTS_WITH_REQUIRED,
        `${CET_MOD_CANONICAL_PATH_PREFIX}\\someothermod\\init.lua`,
      ],
      failure: `Found files outside known CyberScript directories!`,
      errorDialogTitle: `Found files outside known CyberScript directories!`,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CyberModCoreInstallSucceeds,
  AllExpectedDirectFailures: CyberModCoreFailsDirectly,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

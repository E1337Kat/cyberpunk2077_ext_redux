import path from "path";
import { CET_MOD_CANONICAL_PATH_PREFIX } from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  ExamplesForType,
  ExampleSucceedingMod,
  pathHierarchyFor,
} from "./utils.helper";

export const DeprecatedInstallShouldFailInTest = new Map<string, ExampleFailingMod>(
  Object.entries({
    CoreCsvMergeCoreFailTest: {
      expectedInstallerType: InstallerType.CoreCSVMerge,
      inFiles: [
        ...pathHierarchyFor(`${CET_MOD_CANONICAL_PATH_PREFIX}/CSVMerge_Code/`),
        `${CET_MOD_CANONICAL_PATH_PREFIX}/CSVMerge_Code/Cron.lua`,
        ...pathHierarchyFor("csvmerge/mods/Example_Mod_Folder"),
        ...pathHierarchyFor(
          path.normalize(
            "csvmerge/wolvenkitcli/mod/CSVMerge/base/gameplay/factories/mods",
          ),
        ),
        "csvmerge/CSVMerge.cmd",
        "csvmerge/CSVMerge_Tutorial_&_Readme.txt",
        "csvmerge/mods/prefix.txt",
        "csvmerge/mods/prefix_lua.txt",
        "csvmerge/mods/suffix.txt",
        "csvmerge/mods/suffix_lua.txt",
        "csvmerge/mods/Example_Mod_Folder/your .code file goes here",
        "csvmerge/mods/Example_Mod_Folder/your .item files go here",
        "csvmerge/wolvenkitcli/install wkit console here",
        "csvmerge/wolvenkitcli/mod/CSVMerge/base/gameplay/factories.csv",
        "csvmerge/wolvenkitcli/mod/CSVMerge/base/gameplay/factories/mods/mods.csv",
      ].map(path.normalize),
      failure: "CSVMerge has been deprecated.",
      errorDialogTitle: "CSVMerge has been deprecated.",
    },
    CoreWolvenKitDetectedDesktop: {
      expectedInstallerType: InstallerType.NotSupported,
      inFiles: ["WolvenKit Desktop/", "WolvenKit Desktop/WolvenKit.exe"].map(
        path.normalize,
      ),
      failure: "WolvenKit Desktop is not able to be installed with Vortex.",
      errorDialogTitle: `WolvenKit Desktop is not able to be installed with Vortex.`,
    },
    CoreWolvenKitCliCoreInstallTest: {
      expectedInstallerType: InstallerType.CoreWolvenKit,
      inFiles: [
        "WolvenKit CLI/AsyncEnumerable.dll",
        "WolvenKit CLI/Microsoft.Data.Sqlite.dll",
        "WolvenKit CLI/WolvenKit.CLI.exe",
      ].map(path.normalize),
      failure: "WolvenKit installation has been deprecated.",
      errorDialogTitle: `WolvenKit installation has been deprecated.`,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: new Map<string, ExampleSucceedingMod>(),
  AllExpectedDirectFailures: DeprecatedInstallShouldFailInTest,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
} from "./utils.helper";
import { CYBERCAT_CORE_BASEDIR } from "../../src/installers.layouts";

const CoreCyberCatInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreCyberCatInstall: {
      expectedInstallerType: InstallerType.CoreCyberCat,
      inFiles: [
        path.join("CP2077SaveEditor.exe"),
        path.join("config.json"),
        path.join("D3DCompiler_47_cor3.dll"),
        path.join("e_sqlite3.dll"),
        path.join("kraken.dll"),
        path.join("PenImc_cor3.dll"),
        path.join("PresentationNative_cor3.dll"),
        path.join("vcruntime140_cor3.dll"),
        path.join("wpfgfx_cor3.dll"),
        path.join("licenses/"),
        path.join("licenses/CyberCAT.Core.LICENSE.txt"),
        path.join("previews/"),
        path.join("previews/BodyGender/"),
        path.join("previews/BodyGender/00.jpg"),
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.join("CP2077SaveEditor.exe"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "CP2077SaveEditor.exe"),
        },
        {
          type: "copy",
          source: path.join("config.json"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "config.json"),
        },
        {
          type: "copy",
          source: path.join("D3DCompiler_47_cor3.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "D3DCompiler_47_cor3.dll"),
        },
        {
          type: "copy",
          source: path.join("e_sqlite3.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "e_sqlite3.dll"),
        },
        {
          type: "copy",
          source: path.join("kraken.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "kraken.dll"),
        },
        {
          type: "copy",
          source: path.join("PenImc_cor3.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "PenImc_cor3.dll"),
        },
        {
          type: "copy",
          source: path.join("PresentationNative_cor3.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "PresentationNative_cor3.dll"),
        },
        {
          type: "copy",
          source: path.join("vcruntime140_cor3.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "vcruntime140_cor3.dll"),
        },
        {
          type: "copy",
          source: path.join("wpfgfx_cor3.dll"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "wpfgfx_cor3.dll"),
        },
        {
          type: "copy",
          source: path.join("licenses/CyberCAT.Core.LICENSE.txt"),
          destination: path.join(
            CYBERCAT_CORE_BASEDIR,
            "licenses/CyberCAT.Core.LICENSE.txt",
          ),
        },
        {
          type: "copy",
          source: path.join("previews/BodyGender/00.jpg"),
          destination: path.join(CYBERCAT_CORE_BASEDIR, "previews/BodyGender/00.jpg"),
        },
      ],
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreCyberCatInstall,
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

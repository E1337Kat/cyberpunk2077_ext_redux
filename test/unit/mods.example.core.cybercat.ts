import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  movedFromTo,
} from "./utils.helper";
import {
  CYBERCAT_CORE_BASEDIR,
  CYBERCAT_CORE_REQUIRED_FILES,
} from "../../src/installers.layouts";

const CoreCyberCatInstall = new Map<string, ExampleSucceedingMod>([
  [
    `Core CyberCAT installs without prompting when all required DLLs present`,
    {
      expectedInstallerType: InstallerType.CoreCyberCat,
      inFiles: [
        ...CYBERCAT_CORE_REQUIRED_FILES,
        path.join(`config.json`),
        path.join(`licenses/`),
        path.join(`licenses/CyberCAT.Core.LICENSE.txt`),
        path.join(`previews/`),
        path.join(`previews/BodyGender/`),
        path.join(`previews/BodyGender/00.jpg`),
      ].map(path.normalize),
      outInstructions: [
        movedFromTo(`CP2077SaveEditor.exe`, path.join(CYBERCAT_CORE_BASEDIR, `CP2077SaveEditor.exe`)),
        movedFromTo(`config.json`, path.join(CYBERCAT_CORE_BASEDIR, `config.json`)),
        movedFromTo(`D3DCompiler_47_cor3.dll`, path.join(CYBERCAT_CORE_BASEDIR, `D3DCompiler_47_cor3.dll`)),
        movedFromTo(`e_sqlite3.dll`, path.join(CYBERCAT_CORE_BASEDIR, `e_sqlite3.dll`)),
        movedFromTo(`kraken.dll`, path.join(CYBERCAT_CORE_BASEDIR, `kraken.dll`)),
        movedFromTo(`PenImc_cor3.dll`, path.join(CYBERCAT_CORE_BASEDIR, `PenImc_cor3.dll`)),
        movedFromTo(`PresentationNative_cor3.dll`, path.join(CYBERCAT_CORE_BASEDIR, `PresentationNative_cor3.dll`)),
        movedFromTo(`vcruntime140_cor3.dll`, path.join(CYBERCAT_CORE_BASEDIR, `vcruntime140_cor3.dll`)),
        movedFromTo(`wpfgfx_cor3.dll`, path.join(CYBERCAT_CORE_BASEDIR, `wpfgfx_cor3.dll`)),
        movedFromTo(`licenses/CyberCAT.Core.LICENSE.txt`, path.join(CYBERCAT_CORE_BASEDIR, `licenses/CyberCAT.Core.LICENSE.txt`)),
        movedFromTo(`previews/BodyGender/00.jpg`, path.join(CYBERCAT_CORE_BASEDIR, `previews/BodyGender/00.jpg`)),
      ],
    },
  ],
]);


const CoreCyberCatFailsDirectly = new Map<string, ExampleFailingMod>([
  [
    `Core CyberCAT Fails to install if missing required DLLs`,
    {
      expectedInstallerType: InstallerType.CoreCyberCat,
      inFiles: [
        CYBERCAT_CORE_REQUIRED_FILES[0],
        path.join(`licenses/`),
        path.join(`licenses/CyberCAT.Core.LICENSE.txt`),
        path.join(`previews/`),
        path.join(`previews/BodyGender/`),
        path.join(`previews/BodyGender/00.jpg`),
      ].map(path.normalize),
      failure: `CyberCAT archive seems to be missing required files!`,
      errorDialogTitle: `CyberCAT archive seems to be missing required files!`,
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: CoreCyberCatInstall,
  AllExpectedDirectFailures: CoreCyberCatFailsDirectly,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

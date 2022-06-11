import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExamplesForType,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const CoreCyberCatInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreCyberCatInstall: {
      expectedInstallerType: InstallerType.CoreCyberCat,
      inFiles: [
        path.join("CP2077SaveEditor.exe"),
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
          destination: path.join("CyberCAT", "CP2077SaveEditor.exe"),
        },
        {
          type: "copy",
          source: path.join("licenses/CyberCAT.Core.LICENSE.txt"),
          destination: path.join("CyberCAT", "licenses/CyberCAT.Core.LICENSE.txt"),
        },
        {
          type: "copy",
          source: path.join("previews/BodyGender/00.jpg"),
          destination: path.join("CyberCAT", "previews/BodyGender/00.jpg"),
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

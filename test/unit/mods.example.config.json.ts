import path from "path";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplesForType,
  ExamplePromptInstallableMod,
} from "./utils.helper";

const JsonMod = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    jsonWithValidFileInRoot: {
      expectedInstallerType: InstallerType.Json,
      inFiles: ["giweights.json"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("giweights.json"),
          destination: path.normalize("engine/config/giweights.json"),
        },
      ],
    },
    jsonInRandomFolder: {
      expectedInstallerType: InstallerType.Json,
      inFiles: ["fold1/", "fold1/giweights.json", "fold1/bumpersSettings.json"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/giweights.json"),
          destination: path.normalize("engine/config/giweights.json"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/bumpersSettings.json"),
          destination: path.normalize("r6/config/bumpersSettings.json"),
        },
      ],
    },
    jsonWithFilesInCorrectFolder: {
      expectedInstallerType: InstallerType.Json,
      inFiles: [
        "engine/",
        "engine/config/",
        "engine/config/giweights.json",
        "r6/",
        "r6/config",
        "r6/config/bumpersSettings.json",
        "r6/config/settings/",
        "r6/config/settings/options.json",
        "r6/config/settings/platform/",
        "r6/config/settings/platform/pc/",
        "r6/config/settings/platform/pc/options.json",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("engine/config/giweights.json"),
          destination: path.normalize("engine/config/giweights.json"),
        },
        {
          type: "copy",
          source: path.normalize("r6/config/bumpersSettings.json"),
          destination: path.normalize("r6/config/bumpersSettings.json"),
        },
        {
          type: "copy",
          source: path.normalize("r6/config/settings/options.json"),
          destination: path.normalize("r6/config/settings/options.json"),
        },
        {
          type: "copy",
          source: path.normalize("r6/config/settings/platform/pc/options.json"),
          destination: path.normalize("r6/config/settings/platform/pc/options.json"),
        },
      ],
    },
  }), // object
);

// These errordialogs should be fixed as part o https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/113
const JsonModShouldFailInTest = new Map<string, ExampleFailingMod>(
  Object.entries({
    jsonWithInvalidFileInRootFailsInTest: {
      expectedInstallerType: InstallerType.NotSupported,
      inFiles: ["giweights.json", "options.json"].map(path.normalize),
      failure:
        "Improperly located options.json file found.  We don't know where it belongs.",
      errorDialogTitle: undefined,
    },
    jsonWithUnknownFileFailsInTest: {
      expectedInstallerType: InstallerType.NotSupported,
      inFiles: ["My app", "My app/Cool.exe", "My app/config.json"].map(path.normalize),
      failure: "Found JSON files that aren't part of the game.",
      errorDialogTitle: undefined,
    },
  }),
);

const examples: ExamplesForType = {
  AllExpectedSuccesses: JsonMod,
  AllExpectedDirectFailures: JsonModShouldFailInTest,
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

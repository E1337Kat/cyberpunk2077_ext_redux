import path from "path";
import {
  CONFIG_INI_MOD_BASEDIR,
  CONFIG_RESHADE_MOD_BASEDIR,
  CONFIG_RESHADE_MOD_SHADER_BASEDIR,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExampleSucceedingMod,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  mockedFsLayout,
  MockFsDirItems,
} from "./utils.helper";

const iniFsMock: MockFsDirItems = mockedFsLayout({
  "myawesomeconfig.ini": `[Secret setting]\nFrogs=Purple`,
  "serious.ini": `[super serious]\nWings=false`,
  "superreshade.ini":
    `KeyPCGI_One@RadiantGI.fx=46,0,0,0\nPreprocessorDefinitions=SMOOTHNORMALS=1`,
  fold1: {
    "myawesomeconfig.ini": `[Secret setting]\nFrogs=Purple`,
    "serious.ini": `[super serious]\nWings=false`,
    "superreshade.ini":
      `KeyPCGI_One@RadiantGI.fx=46,0,0,0\nPreprocessorDefinitions=SMOOTHNORMALS=1`,
    "reshade-shaders": {
      Shaders: { "fancy.fx": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
      Textures: { "lut.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
    },
  },
  "reshade-shaders": {
    Shaders: { "fancy.fx": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
    Textures: { "lut.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
  },
});

const IniModSucceeds = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    iniWithSingleIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [`myawesomeconfig.ini`].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`myawesomeconfig.ini`),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/myawesomeconfig.ini`),
        },
      ],
    },
    iniWithMultipleIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [`myawesomeconfig.ini`, `serious.ini`].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`myawesomeconfig.ini`),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/myawesomeconfig.ini`),
        },
        {
          type: `copy`,
          source: path.normalize(`serious.ini`),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/serious.ini`),
        },
      ],
    },
    iniWithReshadeIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [`superreshade.ini`].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: `copy`,
          source: `superreshade.ini`,
          destination: path.normalize(`${CONFIG_RESHADE_MOD_BASEDIR}/superreshade.ini`),
        },
      ],
    },
    iniWithSingleIniInRandomFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [`fold1/`, `fold1/myawesomeconfig.ini`].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`fold1/myawesomeconfig.ini`),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/myawesomeconfig.ini`),
        },
      ],
    },
    iniWithReshadeIniAndShadersFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [
        `superreshade.ini`,
        `reshade-shaders/`,
        `reshade-shaders/Shaders/`,
        `reshade-shaders/Shaders/fancy.fx`,
        `reshade-shaders/Textures/`,
        `reshade-shaders/Textures/lut.png`,
      ].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: `copy`,
          source: `superreshade.ini`,
          destination: path.normalize(`${CONFIG_RESHADE_MOD_BASEDIR}/superreshade.ini`),
        },
        {
          type: `copy`,
          source: path.normalize(`reshade-shaders/Shaders/fancy.fx`),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Shaders/fancy.fx`,
          ),
        },
        {
          type: `copy`,
          source: path.normalize(`reshade-shaders/Textures/lut.png`),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Textures/lut.png`,
          ),
        },
      ],
    },
    iniWithReshadeIniAndShadersInAFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [
        `fold1/superreshade.ini`,
        `fold1/reshade-shaders/`,
        `fold1/reshade-shaders/Shaders/`,
        `fold1/reshade-shaders/Shaders/fancy.fx`,
        `fold1/reshade-shaders/Textures/`,
        `fold1/reshade-shaders/Textures/lut.png`,
      ].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: `copy`,
          source: path.normalize(`fold1/superreshade.ini`),
          destination: path.normalize(`${CONFIG_RESHADE_MOD_BASEDIR}/superreshade.ini`),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/reshade-shaders/Shaders/fancy.fx`),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Shaders/fancy.fx`,
          ),
        },
        {
          type: `copy`,
          source: path.normalize(`fold1/reshade-shaders/Textures/lut.png`),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Textures/lut.png`,
          ),
        },
      ],
    },
  }), // object
);
const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(IniModSucceeds),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

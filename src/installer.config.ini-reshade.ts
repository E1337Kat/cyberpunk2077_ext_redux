import path from "path";
import fs from "fs";
import {
  FileTree,
  sourcePaths,
} from "./filetree";
import {
  CONFIG_INI_MOD_EXTENSION,
  CET_MOD_CANONICAL_INIT_FILE,
  REDS_MOD_CANONICAL_EXTENSION,
  CET_GLOBAL_INI,
  CONFIG_RESHADE_MOD_BASEDIR,
  CONFIG_INI_MOD_BASEDIR,
  CONFIG_RESHADE_MOD_SHADER_DIRNAME,
} from "./installers.layouts";
import {
  VortexLogFunc,
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
} from "./vortex-wrapper";
import {
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import { Features } from "./features";

const testForReshadeFile = (
  log: VortexLogFunc,
  files: string[],
  installingDir: string,
): boolean => {
  // We're going to make a reasonable assumption here that reshades will
  // only have reshade ini's, so we only need to check the first one

  const fileToExamine = path.join(
    installingDir,
    files.find((file: string) => path.extname(file) === CONFIG_INI_MOD_EXTENSION),
  );

  const data = fs.readFileSync(fileToExamine, { encoding: `utf8` });

  if (data === undefined) {
    log(`error`, `unable to read contents of `, fileToExamine);
    return false;
  }
  data.slice(0, 80);
  // eslint-disable-next-line no-useless-escape
  const regex = /^[\[#].+/;
  const testString = data.replace(regex, ``);
  if (testString === data) {
    log(`info`, `Reshade file located.`);
    return true;
  }

  return false;
};

// INI (includes Reshade?)
export const testForIniMod: V2077TestFunc = (
  api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => {
  const files =
    sourcePaths(fileTree);

  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === CONFIG_INI_MOD_EXTENSION,
  );

  if (filtered.length === 0) {
    api.log(`info`, `No INI files.`);
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  if (
    files.some(
      (file: string) =>
        path.basename(file).includes(CET_MOD_CANONICAL_INIT_FILE) ||
        path.extname(file) === REDS_MOD_CANONICAL_EXTENSION,
    )
  ) {
    // These should  actually error out, we should not get here
    api.log(`error`, `INI file detected within a CET or Redscript mod, aborting`);
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  if (files.includes(CET_GLOBAL_INI)) {
    api.log(`error`, `CET Installer detected, not processing as INI`);
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installIniMod: V2077InstallFunc = (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: Features,
): Promise<VortexInstallResult> => {
  // This installer gets called for both reshade and "normal" ini mods
  const files =
    sourcePaths(fileTree);

  const allIniModFiles = files.filter(
    (file: string) => path.extname(file) === CONFIG_INI_MOD_EXTENSION,
  );

  const reshade = testForReshadeFile(api.log, allIniModFiles, modInfo.installingDir.pathOnDisk);

  // Set destination depending on file type

  api.log(`info`, `Installing ini files: `, allIniModFiles);
  const iniFileInstructions = allIniModFiles.map((file: string) => {
    const fileName = path.basename(file);
    const dest = reshade
      ? path.join(CONFIG_RESHADE_MOD_BASEDIR, path.basename(file))
      : path.join(CONFIG_INI_MOD_BASEDIR, fileName);

    return {
      type: `copy`,
      source: file,
      destination: dest,
    };
  });

  const shaderFiles = files.filter(
    (file: string) =>
      file.includes(CONFIG_RESHADE_MOD_SHADER_DIRNAME) && !file.endsWith(path.sep),
  );

  let shaderInstructions = [];

  if (reshade && shaderFiles.length !== 0) {
    api.log(`info`, `Installing shader files: `, shaderFiles);
    shaderInstructions = shaderFiles.map((file: string) => {
      const regex = /.*reshade-shaders/;
      const fileName = file.replace(regex, CONFIG_RESHADE_MOD_SHADER_DIRNAME);
      // log("info", "Shader dir Found. Processing: ", fileName);
      const dest = path.join(CONFIG_RESHADE_MOD_BASEDIR, fileName);
      // log("debug", "Shader file: ", dest);
      return {
        type: `copy`,
        source: file,
        destination: dest,
      };
    });
  }

  const instructions = [].concat(iniFileInstructions, shaderInstructions);

  api.log(`debug`, `Installing ini files with instructions: `, instructions);

  return Promise.resolve({ instructions });
};

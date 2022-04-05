import path from "path";
import fs from "fs";
import { FileTree } from "./filetree";
import {
  INI_MOD_EXT,
  CET_MOD_CANONICAL_INIT_FILE,
  REDS_MOD_CANONICAL_EXTENSION,
  CET_GLOBAL_INI,
  RESHADE_MOD_PATH,
  INI_MOD_PATH,
  RESHADE_SHADERS_DIR,
} from "./installers.layouts";
import {
  VortexLogFunc,
  VortexWrappedTestSupportedFunc,
  VortexApi,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexInstallResult,
} from "./vortex-wrapper";

const testForReshadeFile = (
  log: VortexLogFunc,
  files: string[],
  folder: string,
): boolean => {
  // We're going to make a reasonable assumption here that reshades will
  // only have reshade ini's, so we only need to check the first one

  const fileToExamine = path.join(
    folder,
    files.find((file: string) => path.extname(file) === INI_MOD_EXT),
  );

  const data = fs.readFileSync(fileToExamine, { encoding: "utf8" });

  if (data === undefined) {
    log("error", "unable to read contents of ", fileToExamine);
    return false;
  }
  data.slice(0, 80);
  // eslint-disable-next-line no-useless-escape
  const regex = /^[\[#].+/;
  const testString = data.replace(regex, "");
  if (testString === data) {
    log("info", "Reshade file located.");
    return true;
  }

  return false;
};

// INI (includes Reshade?)
export const testForIniMod: VortexWrappedTestSupportedFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === INI_MOD_EXT,
  );

  if (filtered.length === 0) {
    log("info", "No INI files.");
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
    log(`error`, `INI file detected within a CET or Redscript mod, aborting`);
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }
  if (files.includes(CET_GLOBAL_INI)) {
    log(`error`, `CET Installer detected, not processing as INI`);
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

export const installIniMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  // This installer gets called for both reshade and "normal" ini mods

  const allIniModFiles = files.filter(
    (file: string) => path.extname(file) === INI_MOD_EXT,
  );

  const reshade = testForReshadeFile(log, allIniModFiles, _destinationPath);

  // Set destination depending on file type

  log("info", "Installing ini files: ", allIniModFiles);
  const iniFileInstructions = allIniModFiles.map((file: string) => {
    const fileName = path.basename(file);
    const dest = reshade
      ? path.join(RESHADE_MOD_PATH, path.basename(file))
      : path.join(INI_MOD_PATH, fileName);

    return {
      type: "copy",
      source: file,
      destination: dest,
    };
  });

  const shaderFiles = files.filter(
    (file: string) => file.includes(RESHADE_SHADERS_DIR) && !file.endsWith(path.sep),
  );

  let shaderInstructions = [];

  if (reshade && shaderFiles.length !== 0) {
    log("info", "Installing shader files: ", shaderFiles);
    shaderInstructions = shaderFiles.map((file: string) => {
      const regex = /.*reshade-shaders/;
      const fileName = file.replace(regex, RESHADE_SHADERS_DIR);
      // log("info", "Shader dir Found. Processing: ", fileName);
      const dest = path.join(RESHADE_MOD_PATH, fileName);
      // log("debug", "Shader file: ", dest);
      return {
        type: "copy",
        source: file,
        destination: dest,
      };
    });
  }
  const instructions = [].concat(iniFileInstructions, shaderInstructions);
  log("debug", "Installing ini files with instructions: ", instructions);

  return Promise.resolve({ instructions });
};

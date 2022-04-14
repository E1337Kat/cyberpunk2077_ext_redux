import path from "path";
import { FileTree } from "./filetree";
import {
  CONFIG_JSON_MOD_EXTENSION,
  CET_MOD_CANONICAL_PATH_PREFIX,
  CONFIG_JSON_MOD_KNOWN_FILES,
} from "./installers.layouts";
import {
  VortexWrappedTestSupportedFunc,
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexInstallResult,
} from "./vortex-wrapper";

export const testForJsonMod: VortexWrappedTestSupportedFunc = (
  _api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
): Promise<VortexTestResult> => {
  const filtered = files.filter(
    (file: string) => path.extname(file).toLowerCase() === CONFIG_JSON_MOD_EXTENSION,
  );
  if (filtered.length === 0) {
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  // This little change should allow properly constructed AMM addons to install in the fallback
  const cetModJson = files.filter((file: string) =>
    path.normalize(file).toLowerCase().startsWith(CET_MOD_CANONICAL_PATH_PREFIX),
  );
  if (cetModJson.length !== 0) {
    log("error", "We somehow got a CET mod in the JSON check");
    return Promise.resolve({
      supported: false,
      requiredFiles: [],
    });
  }

  // This should probably be moved or made prompting:
  // https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/113

  let proper = true;
  // check for options.json in the file list
  const options = filtered.some((file: string) => path.basename(file) === "options.json");
  if (options) {
    log("debug", "Options.json files found: ", options);
    proper = filtered.some((f: string) =>
      path.dirname(f).toLowerCase().startsWith(path.normalize("r6/config/settings")),
    );

    if (!proper) {
      const message =
        "Improperly located options.json file found.  We don't know where it belongs.";

      log("info", message);
      return Promise.reject(new Error(message));
    }
  } else if (
    filtered.some(
      (file: string) => CONFIG_JSON_MOD_KNOWN_FILES[path.basename(file)] === undefined,
    )
  ) {
    log("error", "Found JSON files that aren't part of the game.");
    return Promise.reject(new Error("Found JSON files that aren't part of the game."));
  }

  log("debug", "We got through it all and it is a JSON mod");
  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
};

export const installJsonMod: VortexWrappedInstallFunc = (
  api: VortexApi,
  log: VortexLogFunc,
  files: string[],
  _fileTree: FileTree,
  _destinationPath: string,
): Promise<VortexInstallResult> => {
  const jsonFiles: string[] = files.filter(
    (file: string) => path.extname(file) === ".json",
  );
  const otherAllowedFiles = files.filter(
    (file: string) => path.extname(file) === ".txt" || path.extname(file) === ".md",
  );

  const filtered = jsonFiles.concat(otherAllowedFiles);

  let movedJson = false;

  const jsonFileInstructions = filtered.map((file: string) => {
    const fileName = path.basename(file);

    let instPath = file;

    if (CONFIG_JSON_MOD_KNOWN_FILES[fileName] !== undefined) {
      instPath = CONFIG_JSON_MOD_KNOWN_FILES[fileName];

      log("debug", "instPath set as ", instPath);
      movedJson = movedJson || file !== instPath;
    }

    return {
      type: "copy",
      source: file,
      destination: instPath,
    };
  });

  if (movedJson) {
    log("info", "JSON files were found outside their canonical locations: Fixed");
  }

  log("debug", "Installing JSON files with: ", jsonFileInstructions);

  const instructions = [].concat(jsonFileInstructions);

  return Promise.resolve({ instructions });
};

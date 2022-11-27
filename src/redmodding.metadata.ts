import path from "path";
import {
  V2077_DIR,
} from "./index.metadata";

export const REDMODDING_REQUIRED_DIR_FOR_MODS = `mods`;
export const REDMODDING_REQUIRED_DIR_FOR_GENERATED_FILES = path.join(`r6\\cache\\modded`);

export const REDMODDING_RTTI_METADATA_FILE_PATH = path.join(`tools\\redmod\\metadata.json`);

export const V2077_LOAD_ORDER_DIR = path.join(`${V2077_DIR}\\Load Order`);

export const REDlauncherExeRelativePath = path.join(`REDprelauncher.exe`);
export const REDdeployExeRelativePath = path.join(`tools\\redmod\\bin\\redMod.exe`);


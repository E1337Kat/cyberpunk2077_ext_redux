import path from "path/win32";
import {
  ToolSpec,
} from "./tools.types";
import {
  VortexToolShim,
} from "./vortex-wrapper";

// These tools are provided by mods, not by the extension,
// and we just make using them a little more convenient.

export const CyberCatTool: VortexToolShim = {
  id: `CyberCat`,
  name: `CyberCAT Save Editor`,
  shortName: `CyberCAT`,
  logo: `SaveEditor.png`,
  requiredFiles: [
    path.join(`CyberCAT`, `CP2077SaveEditor.exe`),
    path.join(`CyberCAT`, `licenses`, `CyberCAT.Core.LICENSE.txt`),
  ],
  executable: (): string => path.join(`CyberCAT`, `CP2077SaveEditor.exe`),
  defaultPrimary: false,
  shell: false,
  relative: true,
};

export const available: ToolSpec = {
  tools: [
    CyberCatTool,
  ],
  startHooks: [],
};

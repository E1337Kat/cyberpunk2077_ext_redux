import path from "path";
import {
  EXTENSION_NAME_INTERNAL,
} from "./index.metadata";
import {
  ToolSpec,
} from "./tools.types";
import {
  VortexToolShim,
} from "./vortex-wrapper";

export const REDlauncherToolId = `${EXTENSION_NAME_INTERNAL}-tools-REDLauncher`;

export const REDdeployManualToolId = `${EXTENSION_NAME_INTERNAL}-tools-redMod`;
export const REDdeployManualToolNeedsLOGenerated = `${REDdeployManualToolId}-will-generate-params-later`;

export const REDlauncherExeRelativePath = path.join(`REDprelauncher.exe`);
export const REDdeployExeRelativePath = path.join(`tools\\redmod\\bin\\redMod.exe`);


export const REDlauncher: VortexToolShim = {
  id: REDlauncherExeRelativePath,
  name: `REDLauncher (GOG/Steam/Epic)`,
  shortName: `REDLauncher`,
  logo: `REDLauncher.png`,
  requiredFiles: [REDlauncherExeRelativePath],
  executable: (): string => REDlauncherExeRelativePath,
  relative: true,
  parameters: [`-modded`],
  environment: {},
};

export const REDdeployManual: VortexToolShim = {
  id: REDdeployManualToolId,
  name: `REDmod Deploy Latest Load Order`,
  shortName: `REDdeploy`,
  logo: `REDdeploy.png`,
  requiredFiles: [REDdeployExeRelativePath],
  executable: (): string => REDdeployExeRelativePath,
  relative: true,
  parameters: [REDdeployManualToolNeedsLOGenerated],
  shell: true,
  exclusive: true,
};

export const REDmoddingTools = [
  REDlauncher,
  REDdeployManual,
];

export const REDmoddingStartHooks = [];

export const available: ToolSpec = {
  tools: REDmoddingTools,
  startHooks: REDmoddingStartHooks,
};

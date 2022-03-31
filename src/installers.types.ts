import {
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";

export enum InstallerType {
  // Meta-installer, won't be in the pipeline itself
  Pipeline = `V2077 Installer Pipeline`,
  //
  CoreCET = `Core/CET Installer`,
  CoreRedscript = `Core/Redscript Installer`,
  CoreRed4ext = `Core/Red4ext Installer`,
  CoreCSVMerge = `Core/CSVMerge Installer`,
  CoreWolvenKit = `Core/WolvenKitCLI Installer`,
  ASI = `ASI Installer`,
  MultiType = `MultiType Installer`,
  CET = `CET Installer`,
  Redscript = `Redscript Installer`,
  Red4Ext = `Red4ext Installer`,
  TweakDB = `TweakDB Installer`,
  AXL = `AXL Installer`,
  INI = `INI Installer`,
  Config = `Config Installer`,
  Reshade = `Reshade Installer`,
  LUT = `LUT Installer`,
  Json = `JSON Installer`,
  ArchiveOnly = `ArchiveOnly Installer`,
  Fallback = `Fallback Installer`,
  NotSupported = `<NONEXISTING INSTALLER - THIS SHOULD NOT BE GETTING USED>`,
}

export interface Installer {
  type: InstallerType;
  id: string;
  testSupported: VortexWrappedTestSupportedFunc;
  install: VortexWrappedInstallFunc;
}

export interface InstallerWithPriority extends Installer {
  priority: number;
}

export const enum InstallDecision {
  UserWantsToProceed = "User explicitly wants to proceed with the installation",

  UserWantsToCancel = "User explicitly wants to cancel the installation",
}

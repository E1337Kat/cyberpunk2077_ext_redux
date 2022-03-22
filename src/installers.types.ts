import {
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";

export enum InstallerType {
  MultiType = "Multiple Types Combined", // #79
  CoreCET = "Core/CET", // #32
  CoreRedscript = "Core/Redscript", // #32
  CoreRed4ext = "Core/Red4ext", // #32
  CoreCSVMerge = "Core/CSVMerge", // #32
  CoreWolvenKit = "Core/WolvenKitCLI", // #32
  RedCetMix = "RedCetMix",
  CET = "CET",
  Redscript = "Redscript",
  Red4Ext = "Red4ext", // #5
  TweakDB = "TweakDB", // #6
  AXL = "AXL", // #28
  INI = "INI", // #29
  Config = "Config", // #30
  Reshade = "Reshade", // #8
  LUT = "LUT", // #31
  ArchiveOnly = "ArchiveOnly",
  Json = "JSON",
  FallbackForOther = "FallbackForOther",
  NotSupported = "[Trying to install something not supported]",
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

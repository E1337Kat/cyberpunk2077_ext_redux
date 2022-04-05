import {
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
} from "./vortex-wrapper";

export enum InstallerType {
  // Meta-installer, won't be in the pipeline itself
  Pipeline = `V2077 Installer Pipeline`,
  // 'Core' installers for the mod type enablers themselves
  CoreCET = `Core/CET Installer`,
  CoreRedscript = `Core/Redscript Installer`,
  CoreRed4ext = `Core/Red4ext Installer`,
  CoreCSVMerge = `Core/CSVMerge Installer`,
  CoreTweakXL = `Core TweakXL Installer`,
  CoreArchiveXL = `Core ArchiveXL Installer`,
  CoreWolvenKit = `Core/WolvenKitCLI Installer`,
  // Mods
  ASI = `ASI Mod Installer`,
  MultiType = `MultiType Mod Installer`,
  CET = `CET Mod Installer`,
  Redscript = `Redscript Mod Installer`,
  Red4Ext = `Red4ext Mod Installer`,
  TweakDB = `(DEPRECATED - USE TweakXL) TweakDB Mod Installer`,
  TweakXL = `TweakXL Mod Installer`,
  INI = `INI Mod Installer`,
  Config = `Config Mod Installer`,
  Reshade = `Reshade Mod Installer`,
  LUT = `LUT Mod Installer`,
  Json = `JSON Mod Installer`,
  Archive = `Archive-only and ArchiveXL Mod Installer`,
  // Fallback that installs everything, last in the pipeline
  Fallback = `Fallback Installer`,
  // Used as a marker
  NotSupported = `<NONEXISTING INSTALLER - THIS SHOULD NOT BE SEEN OUTSIDE TESTS>`,
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

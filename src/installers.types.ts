import { Features } from "./features";
import { FileTree } from "./filetree";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexProgressDelegate,
  VortexInstallResult,
} from "./vortex-wrapper";

export enum InstallerType {
  // Meta-installer, won't be in the pipeline itself
  Pipeline = `V2077 Installer Pipeline`,
  // Some special handling cases, not in the pipeline
  SpecialExtraFiles = `(Special) Extra Files Installer`,
  // 'Core' installers for the mod type enablers themselves
  CoreCET = `Core CET Installer`,
  CoreAmm = `Core Appearance Menu Mod Installer (special case of CET)`,
  CoreCyberScript = `Core CyberScript Installer`,
  CoreRedscript = `Core Redscript Installer`,
  CoreRed4ext = `Core RED4ext Installer`,
  CoreInputLoader = `Core Input Loader Installer (special case of Red4Ext)`,
  CoreCSVMerge = `(DEPRECATED - use TweakXL/ArchiveXL) Core CSVMerge Installer`,
  CoreCyberCat = `CyberCAT Save Editor Installer`,
  CoreTweakXL = `Core TweakXL Installer`,
  CoreArchiveXL = `Core ArchiveXL Installer`,
  CoreWolvenKit = `Core WolvenKitCLI Installer`,
  // MultiType
  MultiType = `MultiType Mod Installer`,
  // Mods
  ConfigJson = `JSON Config Mod Installer`,
  ConfigXml = `XML Config Mod Installer`,
  ASI = `ASI Mod Installer`,
  AMM = `AMM Mod Installer`,
  CET = `CET Mod Installer`,
  Redscript = `Redscript Mod Installer`,
  Red4Ext = `RED4ext Mod Installer`,
  REDmod = `REDmod Installer`,
  TweakDB = `(DEPRECATED - USE TweakXL) TweakDB Mod Installer`,
  TweakXL = `TweakXL Mod Installer`,
  INI = `INI Mod Installer`,
  Reshade = `Reshade Mod Installer`,
  LUT = `LUT Mod Installer`,
  Preset = `Character Preset Installer`,
  Archive = `Archive + ArchiveXL Mod Installer`,
  // Fallback that installs everything, last in the pipeline
  Fallback = `Fallback Installer`,
  // Used as a marker
  NotSupported = `<NONEXISTING INSTALLER - THIS SHOULD NOT BE SEEN OUTSIDE TESTS>`,
}

//
// Mod Info and Name And Stuff
//
export interface SemanticVersion {
  v: string;
  major: string;
  minor?: string;
  patch?: string;
  prerelease?: string;
  build?: string;
}

export interface ModInfo {
  name: string;
  id: string;
  version: SemanticVersion;
  createTime: Date;
  copy?: string;
  variant?: string;
}

//
// Installer API functions
//

// Vortex.TestSupported
export type V2077TestFunc = (
  vortexApi: VortexApi,
  vortexLog: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath?: string,
  sourceDirPathForMod?: string,
  stagingDirPathForMod?: string,
  modName?: string,
  modInfo?: ModInfo,
  features?: Features,
) => Promise<VortexTestResult>;

// Vortex.InstallFunc
export type V2077InstallFunc = (
  vortexApi: VortexApi,
  vortexLog: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
  progressDelegate: VortexProgressDelegate,
  sourceDirPathForMod: string,
  stagingDirPathForMod: string,
  modName: string,
  modInfo: ModInfo,
  features: Features,
) => Promise<VortexInstallResult>;

//
// Installers
//
export interface Installer {
  type: InstallerType;
  id: string;
  testSupported: V2077TestFunc;
  install: V2077InstallFunc;
}

export interface InstallerWithPriority extends Installer {
  priority: number;
}

export const enum InstallDecision {
  UserWantsToProceed = `User explicitly wants to proceed with the installation`,

  UserWantsToCancel = `User explicitly wants to cancel the installation`,
}

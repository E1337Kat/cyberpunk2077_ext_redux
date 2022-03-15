import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies
import { FileTree } from "./filetree";

// Plain renames

export type VortexExtensionContext = Vortex.IExtensionContext;
export type VortexGameStoreEntry = Vortex.IGameStoreEntry;
export type VortexProgressDelegate = Vortex.ProgressDelegate;

export type VortexLogLevel = "debug" | "info" | "warn" | "error";
export type VortexLogFunc = (
  level: VortexLogLevel,
  message: string,
  metadata?: unknown,
) => void;

export interface VortexApi extends Vortex.IExtensionApi {
  log: VortexLogFunc;
}

export type VortexTestResult = Vortex.ISupportedResult;
export type VortexTestSupportedFunc = Vortex.TestSupported;

// Vortex.TestSupported
export type VortexWrappedTestSupportedFunc = (
  vortexApi: VortexApi,
  vortexLog: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  gameID: string,
) => Promise<VortexTestResult>;

export type VortexInstallFunc = Vortex.InstallFunc;
export type VortexInstallResult = Vortex.IInstallResult;
export type VortexInstruction = Vortex.IInstruction;

// Vortex.InstallFunc
export type VortexWrappedInstallFunc = (
  vortexApi: VortexApi,
  vortexLog: VortexLogFunc,
  files: string[],
  fileTree: FileTree,
  destinationPath: string,
  gameId: string,
  progressDelegate: VortexProgressDelegate,
  choices?: unknown,
  unattended?: boolean,
) => Promise<VortexInstallResult>;

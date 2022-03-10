import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies

// Plain renames
export type VortexAPI = Vortex.IExtensionApi;

export type VortexExtensionContext = Vortex.IExtensionContext;
export type VortexGameStoreEntry = Vortex.IGameStoreEntry;
export type VortexProgressDelegate = Vortex.ProgressDelegate;

export type VortexLogLevel = "debug" | "info" | "warn" | "error";
export type VortexLogFunc = (
  level: VortexLogLevel,
  message: string,
  metadata?: unknown,
) => void;

export type VortexTestResult = Vortex.ISupportedResult;
export type VortexTestSupportedFunc = Vortex.TestSupported;

// Vortex.TestSupported
export type VortexWrappedTestSupportedFunc = (
  vortexApi: VortexAPI,
  vortexLog: VortexLogFunc,
  files: string[],
  gameID: string,
) => Promise<VortexTestResult>;

export type VortexInstallFunc = Vortex.InstallFunc;
export type VortexInstallResult = Vortex.IInstallResult;
export type VortexInstruction = Vortex.IInstruction;

// Vortex.InstallFunc
export type VortexWrappedInstallFunc = (
  vortexApi: VortexAPI,
  vortexLog: VortexLogFunc,
  files: string[],
  destinationPath: string,
  gameId: string,
  progressDelegate: VortexProgressDelegate,
  choices?: unknown,
  unattended?: boolean,
) => Promise<VortexInstallResult>;

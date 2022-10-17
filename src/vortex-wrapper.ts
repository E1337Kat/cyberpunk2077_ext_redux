import { util } from "vortex-api";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies
import { Promise } from "bluebird"; // eslint-disable-line import/no-extraneous-dependencies

// Plain renames

export type SpecialPromise = Promise;

export type VortexDiscoveryState = Vortex.IDiscoveryState;
export type VortexDiscoveryResult = Vortex.IDiscoveryResult;

export type VortexExtensionContext = Vortex.IExtensionContext;
export type VortexGameStoreEntry = Vortex.IGameStoreEntry;
export type VortexProgressDelegate = Vortex.ProgressDelegate;

export type VortexNotificationType = Vortex.NotificationType;
export type VortexNotification = Vortex.INotification;
export type VortexNotificationAction = Vortex.INotificationAction;
export type VortexNotificationState = Vortex.INotificationState;

export type VortexDialogResult = Vortex.IDialogResult;

export type VortexLoadOrder = Vortex.LoadOrder;
export type VortexLoadOrderEntry = Vortex.ILoadOrderEntry;
export type VortexLoadOrderGameInfo = Vortex.ILoadOrderGameInfo;
export type VortexValidationResult = Vortex.IValidationResult;

export const vortexUtil = util;

export type VortexValidateFunc =
   (prev: VortexLoadOrder, current: VortexLoadOrder) => Promise<VortexValidationResult>;
export type VortexWrappedValidateFunc = (
  vortexApi: VortexApi,
  prev: VortexLoadOrder,
  current: VortexLoadOrder
) => Promise<VortexValidationResult>;

export type VortexDeserializeFunc = () => Promise<VortexLoadOrder>;
export type VortexWrappedDeserializeFunc = (
  vortexApi: VortexApi,
) => Promise<VortexLoadOrder>;

export type VortexSerializeFunc =
  (loadOrder: VortexLoadOrder) => Promise<void>;
export type VortexWrappedSerializeFunc = (
  vortexApi: VortexApi,
  loadOrder: VortexLoadOrder,
) => Promise<void>;

export type VortexLogLevel = "debug" | "info" | "warn" | "error";
export type VortexLogFunc = (
  level: VortexLogLevel,
  message: string,
  metadata?: unknown,
) => void;

export type VortexInitContext = Vortex.IExtensionContext;
export interface VortexApi extends Vortex.IExtensionApi {
  log: VortexLogFunc;
}

export type VortexTestResult = Vortex.ISupportedResult;
export type VortexTestSupportedFunc = Vortex.TestSupported;

export type VortexInstallFunc = Vortex.InstallFunc;
export type VortexInstallResult = Vortex.IInstallResult;
export type VortexInstruction = Vortex.IInstruction;
export type VortexInstructionType = Vortex.InstructionType;

export type VortexMod = Vortex.IMod;
// Should really make this typesafe
export type VortexModWithEnabledStatus = VortexMod & { enabled: boolean, enabledTime: number };

export type VortexModState = { [modId: string]: VortexMod };

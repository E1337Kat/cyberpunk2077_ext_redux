import { util } from "vortex-api";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies
import { Promise } from "bluebird"; // eslint-disable-line import/no-extraneous-dependencies
import { ComponentType } from "react"; // eslint-disable-line import/no-extraneous-dependencies


export interface IREDmodProps {
  gameMode: string;
  enabled: boolean;
}

// Plain renames
export type VortexActionResult = boolean | void;
export type VortexActionConditionResult = string | boolean;

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

export type VortexCheckResult = Vortex.ITestResult;
export type VortexCheckFunc = () => Promise<VortexCheckResult>;

export type VortexViewPropsFunc = (state: VortexState) => IREDmodProps;
export type VortexViewPropsActionsFunc = (props: IREDmodProps) => void;
export type VortexToDoPropsConditionFunc = (props: IREDmodProps) => boolean;
export type VortexToDoValuesFunc = string | ((t: Vortex.TFunction, props: IREDmodProps) => JSX.Element);

// export type VortexToDoFunc =
//   (
//     id: string,
//     type: Vortex.ToDoType,
//     props: VortexViewPropsFunc,
//     icon: string,
//     text: string,
//     action: VortexViewPropsActionsFunc,
//     condition: VortexViewPropsConditionFunc,
//     value: VortexViewFunc,
//     priority: number
//   ) => void;

export type VortexActionRegisterFunc =
  (
    group: string,
    position: number,
    iconOrComponent: string | ComponentType<any>,
    options: Vortex.IActionOptions,
    titleOrProps?: string | Vortex.PropsCallback,
    actionOrCondition?: VortexActionConditionFunc,
    condition?: VortexActionConditionFunc
  ) => void;
export type VortexActionFunc = (instanceIds?: string[]) => boolean | void;
export type VortexActionConditionFunc = (instanceIds?: string[]) => string | boolean;

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
export type VortexExtensionApi = Vortex.IExtensionApi;
export interface VortexApi extends VortexExtensionApi {
  log: VortexLogFunc;
}

export type VortexTestResult = Vortex.ISupportedResult;
export type VortexTestSupportedFunc = Vortex.TestSupported;

export type VortexInstallFunc = Vortex.InstallFunc;
export type VortexInstallResult = Vortex.IInstallResult;
export type VortexInstruction = Vortex.IInstruction;
export type VortexInstructionType = Vortex.InstructionType;

export type VortexProfile = Vortex.IProfile;
export type VortexState = Vortex.IState;
export type VortexGame = Vortex.IGame;
export type VortexGameStored = Vortex.IGameStored;
export type VortexToolStored = Vortex.IToolStored;
export type VortexToolDiscovered = Vortex.IDiscoveredTool;

export type VortexMod = Vortex.IMod;
export type VortexProfileMod = Vortex.IProfileMod;
// Should really make this typesafe
export type VortexModWithEnabledStatus = VortexMod & VortexProfileMod;

export type VortexModIndex = { [modId: string]: VortexMod };
export type VortexProfileModIndex = { [modId: string]: VortexProfileMod };


import { Features } from "./features";
import {
  IREDmodProps,
  VortexActionConditionResult,
  VortexActionResult,
  VortexApi,
  VortexCheckResult,
  VortexState,
} from "./vortex-wrapper";

export enum ActionType {
  AutoRunDeploy = `Auto Run REDmod Deploy on deploy`,
}

// Vortex ActionFunc
export type V2077ActionFunc = (
  vortexApi: VortexApi,
  features?: Features,
  instanceIds?: string[],
) => VortexActionResult;

// Vortex ActionConditionFunc
export type V2077ActionConditionFunc = (
  vortexApi: VortexApi,
  features: Features,
  instanceIds?: string[],
) => VortexActionConditionResult;

// Vortex TestFunc
export type V2077CheckFunc = (
  vortexApi: VortexApi,
  features: Features,
) => Promise<VortexCheckResult>;

// Vortex TestFunc
export type V2077ToDoPropsFunc = (
  vortexApi: VortexApi,
  state: VortexState,
) => IREDmodProps;

// Vortex TestFunc
export type V2077ToDoPropsActionFunc = (
  vortexApi: VortexApi,
  props: IREDmodProps,
) => void;

//
// Actions
//
export interface V2077SettingsView {
  type: ActionType;
  id: string;
  actionOrCondition: V2077ActionFunc;
  condition: V2077ActionConditionFunc;
  // test: V2077CheckFunc;
}

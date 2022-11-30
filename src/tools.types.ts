import {
  FeatureSet,
} from "./features";
import {
  VortexExtensionContext,
  VortexRunParameters,
  VortexToolShim,
} from "./vortex-wrapper";

export type ToolRunParamTransformStartHookFunc =
  (currentRunParams: VortexRunParameters) => Promise<VortexRunParameters>;

export interface ToolStartHook {
  readonly hookId: string;
  readonly doActualWorkInTheHookAndReturnDummyParams: ToolRunParamTransformStartHookFunc;
}

export type MakeToolStartHookWithStateFunc =
  (vortexExt: VortexExtensionContext, vortexApiLib: any, featureSet: FeatureSet) => ToolStartHook;

// TODO https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/282
export interface ToolSpec {
  readonly tools: readonly VortexToolShim[];
  readonly startHooks: readonly MakeToolStartHookWithStateFunc[];
}

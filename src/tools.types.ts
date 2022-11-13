import {
  VortexRunParameters,
  VortexToolShim,
} from "./vortex-wrapper";

export type ToolRunParamTransformFunc =
  (currentRunParams: VortexRunParameters) => Promise<VortexRunParameters>;

export interface ToolStartHook {
  readonly hookId: string;
  readonly transformRunParams: ToolRunParamTransformFunc;
}

export interface ToolSpec {
  readonly tools: readonly VortexToolShim[];
  readonly startHooks: readonly ToolStartHook[];
}

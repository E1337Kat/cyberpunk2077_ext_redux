// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Promise as Bluebird,
} from "bluebird";
import {
  ToolRunParamTransformStartHookFunc,
} from "./tools.types";
import {
  VortexRunParameters,
} from "./vortex-wrapper";

// Vortex only cancels a start quietly when the hook returns a Bluebird promise
export const asVortexStartHook =
  (hook: ToolRunParamTransformStartHookFunc) =>
    (runParameters: VortexRunParameters): Bluebird<VortexRunParameters> =>
      Bluebird.resolve(hook(runParameters));

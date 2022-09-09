import {
  VortexWrappedDeserializeFunc, VortexWrappedSerializeFunc, VortexWrappedValidateFunc,
} from "./vortex-wrapper";

export interface LoadOrderer {
  validate: VortexWrappedValidateFunc;
  deserializeLoadOrder: VortexWrappedDeserializeFunc;
  serializeLoadOrder: VortexWrappedSerializeFunc;
}

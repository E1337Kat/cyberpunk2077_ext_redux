import { REDmodCustomSound } from "./installers.types";
import {
  VortexWrappedDeserializeFunc,
  VortexWrappedSerializeFunc,
  VortexWrappedValidateFunc,
} from "./vortex-wrapper";

export interface LoadOrderer {
  validate: VortexWrappedValidateFunc;
  deserializeLoadOrder: VortexWrappedDeserializeFunc;
  serializeLoadOrder: VortexWrappedSerializeFunc;
}

export interface LoadOrderEntryREDmod {
  folder: string;
  enabled: boolean;
  deployed: boolean;
  deployedVersion: string;
  customSounds: REDmodCustomSound[];
}

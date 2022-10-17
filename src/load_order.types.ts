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

export interface REDmodEntry {
  folder: string;
  enabled: boolean;
  deployed: boolean;
  deployedVersion: string;
  customSounds?: Array<REDSound>;
}

export interface REDSound {
  name: string,
  type: string,
  file: string,
  gain: number,
  pitch: number
}

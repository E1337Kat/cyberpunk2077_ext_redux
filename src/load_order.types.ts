import * as t from "io-ts";
import {
  decodeWith,
  REDmodCustomSound,
} from "./installers.types";
import { jsonpp } from "./installers.utils";
import {
  VortexWrappedDeserializeFunc,
  VortexWrappedSerializeFunc,
  VortexWrappedValidateFunc,
} from "./vortex-wrapper";

export const LOAD_ORDER_TYPE_VERSION = `1.0.0`;

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

// We still probably want stuff like submod versions and
// paths but have to store that stuff in attributes unless
// we want to iterate all that stuff up every time (it doesn't
// really belong here anyway).
export const LoadOrderEntryType =
  t.intersection([
    t.type(
      {
        id: t.string,
        version: t.string,
        displayName: t.string,
        enabledInVortex: t.boolean,
      },
    ),
    t.partial({
      modId: t.string,
    }),
  ], `LoadOrderEntryType`);
export type LoadOrderEntry = t.TypeOf<typeof LoadOrderEntryType>;

export const LoadOrderType =
  t.type(
    {
      typeVersion: t.literal(LOAD_ORDER_TYPE_VERSION),
      generatedAt: t.string,
      entriesInOrderWithEarlierWinning: t.array(LoadOrderEntryType),
    },
    `LoadOrderVortexType`,
  );
export type LoadOrder = t.TypeOf<typeof LoadOrderType>;


export const encodeLoadOrder = (loadOrder: LoadOrder): string =>
  jsonpp(loadOrder);


export const decodeLoadOrder = decodeWith(LoadOrderType.decode);

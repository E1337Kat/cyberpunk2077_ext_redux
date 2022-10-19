import { pipe } from "fp-ts/lib/function";
import { Ord as NumericOrd } from "fp-ts/lib/number";
import { contramap } from "fp-ts/lib/Ord";
import * as t from "io-ts";
import {
  decodeWith,
  REDmodCustomSound,
  REDmodInfoForVortex,
} from "./installers.types";
import { jsonpp } from "./installers.utils";
import {
  VortexModWithEnabledStatus,
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

export interface LoadOrderEntryDataForVortex {
  ownerVortexProfileId: string;
  vortexId: string;
  vortexModId: string;
  vortexModVersion: string;
  vortexEnabled: boolean;
  redmodInfo: REDmodInfoForVortex;
}

export const LoadOrderEntryType =
  t.intersection([
    t.partial({
      vortexModId: t.string,
    }),
    t.type({
      vortexId: t.string,
      vortexModVersion: t.string,
      redmodName: t.string,
      redmodVersion: t.string,
      redmodPath: t.string,
      enabled: t.boolean,
    }),
  ], `LoadOrderEntryType`);
export type LoadOrderEntry = t.TypeOf<typeof LoadOrderEntryType>;

export const LoadOrderType =
  t.type(
    {
      loadOrderFormatVersion: t.literal(LOAD_ORDER_TYPE_VERSION),
      generatedAt: t.string,
      ownerVortexProfileId: t.string,
      entriesInOrderWithEarlierWinning: t.array(LoadOrderEntryType),
    },
    `LoadOrderVortexType`,
  );
export type LoadOrder = t.TypeOf<typeof LoadOrderType>;


export const encodeLoadOrder = (loadOrder: LoadOrder): string =>
  jsonpp(loadOrder);


export const decodeLoadOrder = decodeWith(LoadOrderType.decode);


export type IndexableOrderableMod = VortexModWithEnabledStatus & { index: number };
export type IdToIndex = { [id: string]: number };

export const DEFAULT_INDEX_SO_NEW_MODS_SORTED_TO_TOP = -1;

export const byIndexAndNewAtTheTop = pipe(
  NumericOrd,
  contramap((mod: IndexableOrderableMod) =>
    ((mod.index || DEFAULT_INDEX_SO_NEW_MODS_SORTED_TO_TOP) + 1)),
);

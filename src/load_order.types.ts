import { pipe } from "fp-ts/lib/function";
import { Ord as NumericOrd } from "fp-ts/lib/number";
import { Ord as StringOrd } from "fp-ts/lib/string";
import {
  contramap,
  Ord,
} from "fp-ts/lib/Ord";
import {
  getOrElse,
  Option,
} from "fp-ts/lib/Option";
import * as t from "io-ts";
import path from "path";
import {
  decodeWith,
  REDmodInfoForVortex,
} from "./installers.types";
import { jsonpp } from "./installers.utils";
import {
  VortexLoadOrderEntry,
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

export interface LoadOrderEntryDataForVortex {
  ownerVortexProfileId: string;
  vortexId: string;
  vortexModId: string;
  vortexModVersion: string;
  vortexEnabled: boolean;
  redmodInfo: REDmodInfoForVortex;
}

export interface OrderableLoadOrderEntryForVortex extends LoadOrderEntryDataForVortex {
  indexForSorting: Option<number>;
}

export interface TypedVortexLoadOrderEntry extends Omit<VortexLoadOrderEntry, `data`> {
  data: LoadOrderEntryDataForVortex;
}

export interface TypedOrderableVortexLoadOrderEntry extends Omit<VortexLoadOrderEntry, `data`> {
  data: OrderableLoadOrderEntryForVortex;
}

// We're not explicitly storing the index for now,
// but it might not be a bad idea in the long run.
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


export type IndexableMaybeEnabledMod = VortexModWithEnabledStatus & { index: Option<number> };
export type IdToIndex = { [id: string]: number };

export const DEFAULT_INDEX_SO_NEW_MODS_SORTED_TO_TOP = -1;

export const byIndexWithNewAtTheBack =
  (backIndex: number): Ord<VortexLoadOrderEntry> =>
    pipe(
      NumericOrd,
      contramap((mod: VortexLoadOrderEntry) =>
        pipe(mod.data.indexForSorting, getOrElse(() => backIndex))),
    );

export const thenByDirnameAscending = pipe(
  StringOrd,
  contramap((mod: VortexLoadOrderEntry) =>
    path.basename(mod.data.redmodInfo.relativePath)),
);

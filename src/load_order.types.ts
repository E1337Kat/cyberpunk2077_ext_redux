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
  REDmodCustomSoundType,
  REDmodInfoForVortex,
} from "./installers.types";
import { jsonpp } from "./util.functions";
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

export const ModsDotJsonCustomSoundEntryType =
    t.type(
      {
        name: t.string,
        type: t.string,
        file: t.string,
        gain: t.number,
        pitch: t.number,
      },
      `ModsDotJsonCustomSoundEntryType`,
    );
export type ModsDotJsonCustomSoundEntry = t.TypeOf<typeof ModsDotJsonCustomSoundEntryType>;

export const ModsDotJsonEntryType =
    t.type(
      {
        folder: t.string,
        enabled: t.boolean,
        deployed: t.boolean,
        deployedVersion: t.string,
        customSounds: t.array(REDmodCustomSoundType),
      },
      `ModsDotJsonEntryType`,
    );
export type ModsDotJsonEntry = t.TypeOf<typeof ModsDotJsonEntryType>;

export const ModsDotJsonType =
    t.type(
      {
        mods: t.array(ModsDotJsonEntryType),
      },
      `ModsDotJsonType`,
    );
export type ModsDotJson = t.TypeOf<typeof ModsDotJsonType>;


export const encodeModsDotJsonLoadOrder = (loadOrder: ModsDotJson): string =>
  jsonpp(loadOrder);


export const decodeModsDotJsonLoadOrder = decodeWith(ModsDotJsonType.decode);

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
      modsDotJsonEntry: ModsDotJsonEntryType, // We want to also know this to use it later.
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

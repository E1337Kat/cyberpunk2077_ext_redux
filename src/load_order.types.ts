import {
  Either,
  left,
  match,
  right,
} from "fp-ts/lib/Either";
import * as J from "fp-ts/lib/Json";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { REDmodCustomSound } from "./installers.types";
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

export const LoadOrderEntryType =
  t.type(
    {
      id: t.string,
      modId: t.string,
      displayName: t.string,
      version: t.string,
      dirPath: t.string,
      enabledInVortex: t.boolean,
    },
    `LoadOrderEntryVortexType`,
  );
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


export const decodeLoadOrder = (json: J.Json): Either<Error, LoadOrder> => pipe(
  json,
  LoadOrderType.decode,
  match(
    (errors) => left(new Error(`Failed to decode load order: ${errors}`)),
    (info) => right(info),
  ),
);

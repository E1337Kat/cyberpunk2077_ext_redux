import {
  Option,
  fromNullable,
} from "fp-ts/lib/Option";
import {
  VortexLoadOrder,
  VortexProfile,
  VortexState,
} from "./vortex-wrapper";

export const loadOrderFromVortexState =
  (vortexState: VortexState, ownerProfile: VortexProfile): Option<VortexLoadOrder> =>
    fromNullable((vortexState.persistent as any)?.loadOrder?.[ownerProfile.id]);

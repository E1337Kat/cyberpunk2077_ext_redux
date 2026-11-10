import {
  Option,
  fromNullable,
} from "fp-ts/lib/Option";
import {
  REDMOD_LOAD_ORDER_ID,
} from "./load_order.types";
import {
  VortexLoadOrder,
  VortexProfile,
  VortexState,
} from "./vortex-wrapper";

interface PersistedLoadOrders {
  // keyed by profile id
  loadOrder?: Record<string, VortexLoadOrder>;
  // keyed by profile id, then load order id
  loadOrders?: Record<string, Record<string, VortexLoadOrder>>;
}

// The named REDmod order once Vortex keeps one, else the profile's single load order.
export const loadOrderFromVortexState =
  (vortexState: VortexState, ownerProfile: VortexProfile): Option<VortexLoadOrder> => {
    const persisted = vortexState.persistent as unknown as PersistedLoadOrders;
    return fromNullable(
      persisted?.loadOrders?.[ownerProfile.id]?.[REDMOD_LOAD_ORDER_ID] ??
      persisted?.loadOrder?.[ownerProfile.id],
    );
  };

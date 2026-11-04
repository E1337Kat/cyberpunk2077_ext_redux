import {
  REDMOD_LOAD_ORDER_ID,
} from "./load_order.types";
import {
  VortexLoadOrderGameInfo,
} from "./vortex-wrapper";

// Dev builds report this placeholder instead of a release version.
const DEV_BUILD_VERSION = `1.0.0`;

// Vortex 2.10.0 is the first release that keeps more than one load order per game.
export const supportsNamedLoadOrders = (appVersion: string): boolean => {
  const [major, minor] = appVersion.split(`.`).map(Number);
  return appVersion === DEV_BUILD_VERSION || major > 2 || (major === 2 && minor >= 10);
};

// The REDmod order alone, or with named load orders, the REDmod order adopting it beside the archives.
export const loadOrderRegistrations = (
  appVersion: string,
  redmod: VortexLoadOrderGameInfo | undefined,
  archive: VortexLoadOrderGameInfo,
): VortexLoadOrderGameInfo[] => {
  const redmods = redmod === undefined ? [] : [redmod];
  if (!supportsNamedLoadOrders(appVersion)) {
    return redmods;
  }
  const namedRedmods = redmods.map((registration): VortexLoadOrderGameInfo => ({
    ...registration,
    loadOrderId: REDMOD_LOAD_ORDER_ID,
    displayName: `REDmods`,
    priority: 2,
    adoptsLegacyOrder: true,
    conflictWinner: `first`,
  }));
  return [...namedRedmods, archive];
};

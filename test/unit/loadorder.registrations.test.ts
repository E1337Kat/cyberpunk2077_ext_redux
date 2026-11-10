import {
  loadOrderRegistrations,
  supportsNamedLoadOrders,
} from "../../src/load_order.registrations";
import {
  ARCHIVE_LOAD_ORDER_ID,
  REDMOD_LOAD_ORDER_ID,
} from "../../src/load_order.types";
import {
  VortexLoadOrderGameInfo,
} from "../../src/vortex-wrapper";

const fakeRegistration = (overrides: Partial<VortexLoadOrderGameInfo>): VortexLoadOrderGameInfo => ({
  gameId: `cyberpunk2077`,
  validate: jest.fn(),
  deserializeLoadOrder: jest.fn(),
  serializeLoadOrder: jest.fn(),
  ...overrides,
});

describe(`Load order registrations`, () => {

  describe(`supportsNamedLoadOrders`, () => {
    test.each([
      [`2.10.0`, true],
      [`2.10.0-beta.1`, true],
      [`2.11.3`, true],
      [`3.0.0`, true],
      [`1.0.0`, true],
      [`2.9.0`, false],
      [`2.9.0-beta.1`, false],
      [`2.8.0`, false],
      [`not a version`, false],
    ])(`is %s for Vortex %s`, (appVersion, expected) => {
      expect(supportsNamedLoadOrders(appVersion)).toBe(expected);
    });
  });

  describe(`loadOrderRegistrations`, () => {
    const redmod = fakeRegistration({ usageInstructions: `REDmods` });
    const archive = fakeRegistration({ loadOrderId: ARCHIVE_LOAD_ORDER_ID });

    test(`registers the REDmod order exactly as before on a Vortex without named load orders`, () => {
      const registrations = loadOrderRegistrations(`2.9.0`, redmod, archive);

      expect(registrations).toHaveLength(1);
      expect(registrations[0]).toBe(redmod);
    });

    test(`registers the REDmod order first, as the order that adopts the existing one`, () => {
      const registrations = loadOrderRegistrations(`2.10.0`, redmod, archive);

      expect(registrations).toEqual([
        expect.objectContaining({
          usageInstructions: `REDmods`,
          loadOrderId: REDMOD_LOAD_ORDER_ID,
          adoptsLegacyOrder: true,
        }),
        archive,
      ]);
    });

    test(`registers only the archive order when the REDmod order is turned off`, () => {
      expect(loadOrderRegistrations(`2.10.0`, undefined, archive)).toEqual([archive]);
    });

    test(`registers nothing when the REDmod order is turned off on a Vortex without named load orders`, () => {
      expect(loadOrderRegistrations(`2.9.0`, undefined, archive)).toEqual([]);
    });
  });

}); // Load order registrations

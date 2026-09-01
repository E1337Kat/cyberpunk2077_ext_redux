import {
  fs,
  selectors,
  util as VortexUtil,
} from "@vortex-api-test-shimmed";
import {
  makeAttr,
  ModAttributeKey,
  ModType,
} from "../../src/installers.types";
import {
  anyREDmodsIn,
  fetchREDmoddingDlcDetails,
  wrappedPrepareForModdingWithREDmodding,
} from "../../src/redmodding";
import {
  VortexDiscoveryResult,
  VortexExtensionContext,
  VortexMod,
  VortexNotification,
} from "../../src/vortex-wrapper";

const GAME_DIR = `D:\\Games\\Cyberpunk 2077`;

const modWithId = (
  id: string,
  state: VortexMod[`state`],
  modType?: ModType,
): VortexMod => {
  const justEnoughOfAMod: Partial<VortexMod> = {
    id,
    state,
    installationPath: id,
    attributes: modType === undefined
      ? {}
      : { [ModAttributeKey.ModType]: makeAttr(ModAttributeKey.ModType, modType).value },
  };

  return justEnoughOfAMod as VortexMod;
};

describe(`Deciding whether REDmod is needed`, () => {
  test(`says no when nothing is installed`, () => {
    expect(anyREDmodsIn([])).toBe(false);
  });

  test(`says no for a profile of plain archive mods`, () => {
    expect(anyREDmodsIn([
      modWithId(`archive-mod`, `installed`),
      modWithId(`another-archive-mod`, `installed`),
    ])).toBe(false);
  });

  test(`says no for an installed mod of some other type`, () => {
    expect(anyREDmodsIn([
      modWithId(`invalid-type`, `installed`, ModType.INVALID),
    ])).toBe(false);
  });

  test(`says yes once a REDmod is installed`, () => {
    expect(anyREDmodsIn([
      modWithId(`archive-mod`, `installed`),
      modWithId(`redmod`, `installed`, ModType.REDmod),
    ])).toBe(true);
  });

  test(`ignores a REDmod that hasn't finished installing`, () => {
    expect(anyREDmodsIn([
      modWithId(`redmod`, `downloaded`, ModType.REDmod),
    ])).toBe(false);
  });
});

describe(`Pointing the user at the REDmod DLC`, () => {
  test.each([
    [`gog`, `GOG`, `https://www.gog.com/en/game/cyberpunk_2077_redmod`],
    [`steam`, `Steam`, `https://store.steampowered.com/app/2060310/Cyberpunk_2077_REDmod/`],
    [`epic`, `the Epic Games Store`, `https://store.epicgames.com/en-US/p/cyberpunk-2077`],
  ])(`sends someone who bought on %s to that store's page`, (store, name, url) => {
    expect(fetchREDmoddingDlcDetails(store)).toEqual({ name, url });
  });

  test(`falls back to the modding help page when the store is unknown`, () => {
    expect(fetchREDmoddingDlcDetails(`itch`)).toEqual({
      url: `https://www.cyberpunk.net/en/modding-support`,
    });
  });

  test(`falls back the same way when the store couldn't be detected at all`, () => {
    expect(fetchREDmoddingDlcDetails()).toEqual({
      url: `https://www.cyberpunk.net/en/modding-support`,
    });
  });
});

//
// The whole point of the check is that it stays quiet for the many people who
// mod this game without REDmod, so the wiring is what needs pinning, not just
// the pieces it's built from.
//
describe(`Setting up a game that can't load REDmods`, () => {
  const notificationsSent: VortexNotification[] = [];

  const justEnoughOfAnApi = {
    store: { getState: (): unknown => ({}) },
    sendNotification: (notification: VortexNotification): void => {
      notificationsSent.push(notification);
    },
  };

  const fakeVortex = { api: justEnoughOfAnApi } as unknown as VortexExtensionContext;

  const justEnoughOfADiscovery: Partial<VortexDiscoveryResult> = { path: GAME_DIR };
  const discovery = justEnoughOfADiscovery as VortexDiscoveryResult;

  const setUpWith = async (
    redmodToolingPresent: boolean,
    installedMods: readonly VortexMod[],
  ): Promise<void> => {
    fs.ensureDirWritableAsync.mockResolvedValue(undefined);
    fs.statAsync.mockImplementation(() =>
      (redmodToolingPresent ? Promise.resolve({}) : Promise.reject(new Error(`ENOENT`))));
    selectors.modsForGame.mockReturnValue(
      Object.fromEntries(installedMods.map((mod) => [mod.id, mod])),
    );
    VortexUtil.GameStoreHelper.findByAppId.mockResolvedValue({ gameStoreId: `gog`, gamePath: GAME_DIR });
    VortexUtil.opn.mockResolvedValue(undefined);

    await wrappedPrepareForModdingWithREDmodding(fakeVortex, { log: () => undefined }, discovery);
  };

  beforeEach(() => {
    notificationsSent.length = 0;
    jest.clearAllMocks();
  });

  test(`says nothing when the REDmod tooling is there`, async () => {
    await setUpWith(true, [modWithId(`redmod`, `installed`, ModType.REDmod)]);

    expect(notificationsSent).toEqual([]);
  });

  test(`says nothing when the tooling is missing but no REDmods need it`, async () => {
    await setUpWith(false, [modWithId(`archive-mod`, `installed`)]);

    expect(notificationsSent).toEqual([]);
  });

  test(`warns when the tooling is missing and a REDmod needs it`, async () => {
    await setUpWith(false, [modWithId(`redmod`, `installed`, ModType.REDmod)]);

    expect(notificationsSent).toHaveLength(1);
    expect(notificationsSent[0].type).toEqual(`warning`);
    expect(notificationsSent[0].message).toContain(`GOG`);
  });

  test(`offers a web address to get it from, not a launcher deep link`, async () => {
    await setUpWith(false, [modWithId(`redmod`, `installed`, ModType.REDmod)]);

    notificationsSent[0].actions[0].action(() => undefined);

    expect(VortexUtil.opn).toHaveBeenCalledWith(`https://www.gog.com/en/game/cyberpunk_2077_redmod`);
  });
});

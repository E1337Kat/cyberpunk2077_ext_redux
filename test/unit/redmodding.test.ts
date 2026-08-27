import {
  makeAttr,
  ModAttributeKey,
  ModType,
} from "../../src/installers.types";
import {
  anyREDmodsIn,
  fetchREDmoddingDlcDetails,
} from "../../src/redmodding";
import {
  VortexMod,
} from "../../src/vortex-wrapper";

const modNamed = (
  id: string,
  state: string,
  modType?: ModType,
): VortexMod => ({
  id,
  state,
  type: ``,
  installationPath: id,
  attributes: modType === undefined
    ? {}
    : { [ModAttributeKey.ModType]: makeAttr(ModAttributeKey.ModType, modType).value },
} as unknown as VortexMod);

// The REDmod DLC is only worth mentioning to someone who has a REDmod to load,
// which is what decides whether the warning appears at all.
describe(`Deciding whether REDmod is needed`, () => {
  test(`says no when nothing is installed`, () => {
    expect(anyREDmodsIn([])).toBe(false);
  });

  test(`says no for a profile of plain archive mods`, () => {
    expect(anyREDmodsIn([
      modNamed(`archive-mod`, `installed`),
      modNamed(`another-archive-mod`, `installed`),
    ])).toBe(false);
  });

  test(`says yes once a REDmod is installed`, () => {
    expect(anyREDmodsIn([
      modNamed(`archive-mod`, `installed`),
      modNamed(`redmod`, `installed`, ModType.REDmod),
    ])).toBe(true);
  });

  test(`ignores a REDmod that hasn't finished installing`, () => {
    expect(anyREDmodsIn([
      modNamed(`redmod`, `downloaded`, ModType.REDmod),
    ])).toBe(false);
  });
});

describe(`Pointing the user at the REDmod DLC`, () => {
  test(`sends someone who bought on GOG to the GOG product page`, () => {
    expect(fetchREDmoddingDlcDetails(`gog`)).toEqual({
      name: `GOG`,
      url: `https://www.gog.com/en/game/cyberpunk_2077_redmod`,
    });
  });

  test(`sends someone who bought on Steam to the Steam product page`, () => {
    expect(fetchREDmoddingDlcDetails(`steam`).url)
      .toEqual(`https://store.steampowered.com/app/2060310/Cyberpunk_2077_REDmod/`);
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

  // A launcher deep link opens the client on an empty page and reports success,
  // so every route out of here is a plain web address.
  test.each([`gog`, `steam`, `epic`, undefined])(
    `hands back a web address for %s rather than a launcher deep link`,
    (store) => {
      expect(fetchREDmoddingDlcDetails(store).url).toMatch(/^https:\/\//);
    },
  );
});

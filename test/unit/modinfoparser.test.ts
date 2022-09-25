import { partitionMap } from 'fp-ts/ReadonlyArray';
import { pipe } from "fp-ts/lib/function";
import { match } from 'fp-ts/lib/Either';
import * as Separated from 'fp-ts/lib/Separated';
import { ModInfo, modInfoFromArchiveName } from "../../src/installers.shared";

const fakeDate = new Date(2021, 1, 1);
const fakeDateMs = fakeDate.getTime() / 1000;

describe(`Parsing mod info from archive name`, () => {
  test(`returns none when the parsing fails`, () => {
    const failingNames = [
      `hi`,
      `Some Directly Installed Mod.zip`,
      `thesecanalsohave v1.0 - things+variants`,
    ];

    const incorrectlyOk =
        pipe(
          failingNames,
          partitionMap(modInfoFromArchiveName),
          Separated.right,
        );

    expect(incorrectlyOk).toEqual([]);
  });

  test(`produces the expected info`, () => {
    const testCases: [string, ModInfo][] = [
      [
        `Limited HUD-2592-2-5-${fakeDateMs}`,
        {
          name: `Limited HUD`,
          id: `2592`,
          version: {
            v: `2.5`,
            major: `2`,
            minor: `5`,
            patch: undefined,
          },
          createTime: fakeDate,
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        `Appearance Menu Mod-790-1-14-4-${fakeDateMs}`,
        {
          name: `Appearance Menu Mod`,
          id: `790`,
          version: {
            v: `1.14.4`,
            major: `1`,
            minor: `14`,
            patch: `4`,
          },
          createTime: fakeDate,
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        `HairMaterialRetouch-2577-1-0a-${fakeDateMs}`,
        {
          name: `HairMaterialRetouch`,
          id: `2577`,
          version: {
            v: `1.0a`,
            major: `1`,
            minor: `0a`,
            patch: undefined,
          },
          createTime: fakeDate,
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        `Appearance Previews-718-v0-09a-${fakeDateMs}`,
        {
          name: `Appearance Previews`,
          id: `718`,
          version: {
            v: `v0.09a`,
            major: `v0`,
            minor: `09a`,
            patch: undefined,
          },
          createTime: fakeDate,
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        `Cap colors-4293-1-${fakeDateMs}(2)+darkpurple vanilla`,
        {
          name: `Cap colors`,
          id: `4293`,
          version: {
            v: `1`,
            major: `1`,
            minor: undefined,
            patch: undefined,
          },
          createTime: fakeDate,
          copy: `(2)`,
          variant: `darkpurple vanilla`,
        },
      ],
      [
        `Vanilla Billboard LOD Improved-3184-1-6-1-${fakeDateMs}.1`,
        {
          name: `Vanilla Billboard LOD Improved`,
          id: `3184`,
          version: {
            v: `1.6.1`,
            major: `1`,
            minor: `6`,
            patch: `1`,
          },
          createTime: fakeDate,
          copy: `.1`,
          variant: undefined,
        },
      ],
      [
        `Body_Suit_with_Gun_Harness_FemV-3041-1-3-${fakeDateMs}+medium-full1-full2`,
        {
          name: `Body_Suit_with_Gun_Harness_FemV`,
          id: `3041`,
          version: {
            v: `1.3`,
            major: `1`,
            minor: `3`,
            patch: undefined,
          },
          createTime: fakeDate,
          copy: undefined,
          variant: `medium-full1-full2`,
        },
      ],
      [
        `WLW Nails - All Colors-4733-1-1656366854+gold`,
        {
          name: `WLW Nails - All Colors`,
          id: `4733`,
          version: {
            v: `1`,
            major: `1`,
            minor: undefined,
            patch: undefined,
          },
          createTime: new Date(1656366854 * 1000),
          copy: undefined,
          variant: `gold`,
        },
      ],
      [
        `Fake (1) . - (best) Mod -4252525252-versionX-${fakeDateMs}`,
        {
          name: `Fake (1) . - (best) Mod `,
          id: `4252525252`,
          version: {
            v: `versionX`,
            major: `versionX`,
            minor: undefined,
            patch: undefined,
          },
          createTime: fakeDate,
          copy: undefined,
          variant: undefined,
        },
      ],
    ];

    testCases.forEach(([archiveName, expected]) => {
      pipe(
        modInfoFromArchiveName(archiveName),
        match(
          (failure) => fail(failure),
          (actual) => { expect(actual).toEqual(expected); },
        ),
      );
    });
  });
});

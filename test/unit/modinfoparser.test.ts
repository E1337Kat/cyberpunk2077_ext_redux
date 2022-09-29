/* eslint-disable prefer-template */
import path from 'path';
import { pipe } from "fp-ts/lib/function";
import { match } from 'fp-ts/lib/Either';
import { modInfoFromArchiveName } from "../../src/installers.shared";
import { ModInfo } from '../../src/installers.types';

const fakeDate = new Date(2021, 1, 1);
const fakeTimestamp = fakeDate.getTime() / 1000;

const INSTALLING_SUFFIX = `.installing`;
const INSTALLING_BASEDIR = path.join(`fake\\staging`);

describe(`Parsing mod info from archive name`, () => {
  beforeAll(() => {
    jest
      .useFakeTimers()
      .setSystemTime(fakeDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test(`produces synthetic mod info as error value when not parseable`, () => {
    const testCases: [string, ModInfo][] = [
      [
        path.join(INSTALLING_BASEDIR, `hi` + INSTALLING_SUFFIX),
        {
          name: `hi (V2077)`,
          id: `hi (V2077)`,
          version: {
            v: `0.0.1-V2077`,
            major: `0`,
            minor: `0`,
            patch: `1`,
            prerelease: `V2077`,
          },
          createTime: fakeDate,
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `hi` + INSTALLING_SUFFIX),
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Some Directly Installed Mod.zip` + INSTALLING_SUFFIX),
        {
          name: `Some Directly Installed Mod.zip (V2077)`,
          id: `Some Directly Installed Mod.zip (V2077)`,
          version: {
            v: `0.0.1-V2077`,
            major: `0`,
            minor: `0`,
            patch: `1`,
            prerelease: `V2077`,
          },
          createTime: fakeDate,
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Some Directly Installed Mod.zip` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `000_ this was (just) an Archive.archive` + INSTALLING_SUFFIX),
        {
          name: `000_ this was (just) an Archive.archive (V2077)`,
          id: `000_ this was (just) an Archive.archive (V2077)`,
          version: {
            v: `0.0.1-V2077`,
            major: `0`,
            minor: `0`,
            patch: `1`,
            prerelease: `V2077`,
          },
          createTime: fakeDate,
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `000_ this was (just) an Archive.archive` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `thesecanalsohave v1.0 - things+variantfakes` + INSTALLING_SUFFIX),
        {
          name: `thesecanalsohave v1.0 - things+variantfakes (V2077)`,
          id: `thesecanalsohave v1.0 - things+variantfakes (V2077)`,
          version: {
            v: `0.0.1-V2077`,
            major: `0`,
            minor: `0`,
            patch: `1`,
            prerelease: `V2077`,
          },
          createTime: fakeDate,
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `thesecanalsohave v1.0 - things+variantfakes` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
    ];

    testCases.forEach(([archiveInstallingPath, expected]) => {
      pipe(
        modInfoFromArchiveName(archiveInstallingPath),
        match(
          (syntheticOnFail) => {
            expect(syntheticOnFail).toEqual(expected);
            expect(syntheticOnFail.installingDir).toEqual(archiveInstallingPath);
          },
          (incorrectlySucceeded) => { expect(incorrectlySucceeded).toBeUndefined(); },
        ),
      );
    });
  });

  test(`produces the correctly parsed info as success value when parseable`, () => {
    const testCases: [string, ModInfo][] = [
      [
        path.join(INSTALLING_BASEDIR, `Limited HUD-2592-2-5-${fakeTimestamp}` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Limited HUD-2592-2-5-${fakeTimestamp}` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Appearance Menu Mod-790-1-14-4-${fakeTimestamp}` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Appearance Menu Mod-790-1-14-4-${fakeTimestamp}` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `HairMaterialRetouch-2577-1-0a-${fakeTimestamp}` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `HairMaterialRetouch-2577-1-0a-${fakeTimestamp}` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Appearance Previews-718-v0-09a-${fakeTimestamp}` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Appearance Previews-718-v0-09a-${fakeTimestamp}` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Cap colors-4293-1-${fakeTimestamp}(2)+darkpurple vanilla` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Cap colors-4293-1-${fakeTimestamp}(2)+darkpurple vanilla` + INSTALLING_SUFFIX),
          copy: `(2)`,
          variant: `darkpurple vanilla`,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Vanilla Billboard LOD Improved-3184-1-6-1-${fakeTimestamp}.1` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Vanilla Billboard LOD Improved-3184-1-6-1-${fakeTimestamp}.1` + INSTALLING_SUFFIX),
          copy: `.1`,
          variant: undefined,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Body_Suit_with_Gun_Harness_FemV-3041-1-3-${fakeTimestamp}+medium-full1-full2` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Body_Suit_with_Gun_Harness_FemV-3041-1-3-${fakeTimestamp}+medium-full1-full2` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: `medium-full1-full2`,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `1 - Body_Suit_with_Gun_Harness_FemV-3041-1-3-${fakeTimestamp}+medium-full1-full2` + INSTALLING_SUFFIX),
        {
          name: `1 - Body_Suit_with_Gun_Harness_FemV`,
          id: `3041`,
          version: {
            v: `1.3`,
            major: `1`,
            minor: `3`,
            patch: undefined,
          },
          createTime: fakeDate,
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `1 - Body_Suit_with_Gun_Harness_FemV-3041-1-3-${fakeTimestamp}+medium-full1-full2` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: `medium-full1-full2`,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `WLW Nails - All Colors-4733-1-1656366854+gold` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `WLW Nails - All Colors-4733-1-1656366854+gold` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: `gold`,
        },
      ],
      [
        path.join(INSTALLING_BASEDIR, `Fake (1) . - (best) Mod -4252525252-versionX-${fakeTimestamp}` + INSTALLING_SUFFIX),
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
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `Fake (1) . - (best) Mod -4252525252-versionX-${fakeTimestamp}` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
      [
        // Amazingly this is valid, too - a mod that was named '1'
        path.join(INSTALLING_BASEDIR, `1-3844-1-${fakeTimestamp}` + INSTALLING_SUFFIX),
        {
          name: `1`,
          id: `3844`,
          version: {
            v: `1`,
            major: `1`,
            minor: undefined,
            patch: undefined,
          },
          createTime: fakeDate,
          stagingDirPrefix: INSTALLING_BASEDIR,
          installingDir: path.join(INSTALLING_BASEDIR, `1-3844-1-${fakeTimestamp}` + INSTALLING_SUFFIX),
          copy: undefined,
          variant: undefined,
        },
      ],
    ];

    testCases.forEach(([archiveInstallingPath, expected]) => {
      pipe(
        modInfoFromArchiveName(archiveInstallingPath),
        match(
          (couldNotParse) => { expect(couldNotParse).toBeUndefined(); },
          (parsedModInfo) => {
            expect(parsedModInfo).toEqual(expected);
            expect(parsedModInfo.installingDir).toEqual(archiveInstallingPath);
          },
        ),
      );
    });
  });
});

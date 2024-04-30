import {
  pipe,
} from 'fp-ts/lib/function';
import {
  getOrElseW as getOrElseWTE,
} from 'fp-ts/lib/TaskEither';
import path from 'path';
import {
  constant,
} from '../../src/util.functions';
import {
  extractAssetPathHashesUsedByArchive,
} from '../../src/validation.assetconflicts';

const testArchivePath = path.join(__dirname, `..\\fixtures\\testarchive.archive`);

const expectedAssetHashes = [
  `e6112aba4dd569b`,
  `f3b68c22724d568`,
  `1192cdb2838f1a0b`,
  `1cd0c7e6f59069cb`,
  `2ff8aa43d13f10dc`,
  `36114a9d1c7529dc`,
  `3818ace8d1d3d789`,
  `434ce82d135a8d7b`,
  `583ab8a5670995a2`,
  `67c26ea21cb0f9b1`,
  `6c07c44bff7cbdc6`,
  `8e7afdc9957dce37`,
  `a55bfda25d42e6f5`,
  `af3f42cdbda5049d`,
  `b084b893f5fd56aa`,
  `b2248fd941ffc596`,
  `ba73a5c2b596ca48`,
  `bc0f21007664b1ef`,
  `c0f646a7ef26da61`,
  `d4290ccae1f5ff82`,
  `e7ed42220fd78214`,
  `f01b872e7d9a0c5c`,
  `f14cd4f6eaea939f`,
  `f6a502a9dac98a46`,
];

describe(`Archive asset paths`, () => {

  describe(`extracting asset path hashes`, () => {

    test(`Produces list of asset hashes defined in the .archive`, async () => {
      const hashes = await pipe(
        extractAssetPathHashesUsedByArchive(testArchivePath),
        getOrElseWTE((error) => constant(Promise.reject(error))),
      )();

      expect(hashes).toEqual(expectedAssetHashes);
    });
  });
});

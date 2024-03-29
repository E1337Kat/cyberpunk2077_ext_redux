import path from "path";
import { normalizeDir } from "../../src/filetree";
import {
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_BASEDIR,
  REDMOD_INFO_FILENAME,
  REDMOD_MODTYPE_ATTRIBUTE,
  REDMOD_SCRIPTS_MODDED_DIR,
} from "../../src/installers.layouts";
import {
  InstallerType,
  REDmodInfo,
  REDmodInfoForVortex,
} from "../../src/installers.types";
import { jsonpp } from "../../src/util.functions";
import {
  ExampleSucceedingMod,
  CET_GIFTWRAPS,
  GIFTWRAP_PREFIX,
  CET_PREFIX,
  CET_INIT,
  REDS_GIFTWRAPS,
  REDS_PREFIX,
  RED4EXT_GIFTWRAPS,
  RED4EXT_PREFIX,
  ARCHIVE_GIFTWRAPS,
  ARCHIVE_PREFIX,
  FAKE_MOD_NAME,
  ExamplesForType,
  mergeOrFailOnConflict,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  mockedFsLayout,
  movedFromTo,
  FAKE_STAGING_PATH,
  createdDirectory,
  addedMetadataAttribute,
  FAKE_MOD_INFO,
  addedREDmodInfoArrayAttribute,
} from "./utils.helper";


const myREDModInfo: REDmodInfo = {
  name: `myRedMod`,
  version: `1.0.0`,
};
const myREDmodInfoForVortex: REDmodInfoForVortex = {
  ...myREDModInfo,
  relativePath: normalizeDir(path.join(REDMOD_BASEDIR, myREDModInfo.name)),
  vortexModId: FAKE_MOD_INFO.id,
};
const myREDmodInfoJson = jsonpp(myREDModInfo);


const GiftwrappedModsFixable = new Map<string, ExampleSucceedingMod>([
  [
    `known subdirs inside an unknown 'giftwrap' top-level directory`,
    {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${REDS_PREFIX}/rexmod/script.reds`),
        ...RED4EXT_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${RED4EXT_PREFIX}/script.dll`),
        ...ARCHIVE_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: `copy`,
          source: path.join(`${GIFTWRAP_PREFIX}/${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        },
      ],
    },
  ],
  [
    `REDmod-looking mods inside a 'giftwrap' top-level directory`,
    {
      expectedInstallerType: InstallerType.REDmod,
      stagingPath: path.join(FAKE_STAGING_PATH, GIFTWRAP_PREFIX, path.sep),
      fsMocked: mockedFsLayout({
        [GIFTWRAP_PREFIX]: {
          [REDMOD_BASEDIR]: {
            myRedMod: {
              [REDMOD_INFO_FILENAME]: myREDmodInfoJson,
            },
          },
        },
      }),
      inFiles: [
        path.join(`${GIFTWRAP_PREFIX}`),
        path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\`),
        path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\myRedMod\\`),
        path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_INFO_FILENAME}`),
        path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_ARCHIVES_DIRNAME}\\`),
        path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
      ],
      outInstructions: [
        movedFromTo(
          path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_INFO_FILENAME}`),
          path.join(`${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_INFO_FILENAME}`),
        ),
        movedFromTo(
          path.join(`${GIFTWRAP_PREFIX}\\${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
          path.join(`${REDMOD_BASEDIR}\\myRedMod\\${REDMOD_ARCHIVES_DIRNAME}\\magicgoeshere.archive`),
        ),
        createdDirectory(REDMOD_SCRIPTS_MODDED_DIR),
        addedMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE),
        addedREDmodInfoArrayAttribute(myREDmodInfoForVortex),
      ],
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(GiftwrappedModsFixable),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

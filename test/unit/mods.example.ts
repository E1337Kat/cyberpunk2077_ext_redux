import path from "path";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies

import { pathHierarchyFor } from "./utils.helper";

import { InstallerType } from "../../src/installers";

import {
  CET_MOD_CANONICAL_INIT_FILE,
  CET_MOD_CANONICAL_PATH_PREFIX,
  REDS_MOD_CANONICAL_PATH_PREFIX,
  RED4EXT_MOD_CANONICAL_PATH_PREFIX,
  //  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS,
  //  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS,
  ARCHIVE_ONLY_CANONICAL_PREFIX,
  ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX,
  INI_MOD_PATH,
  RESHADE_MOD_PATH,
  RESHADE_SHADERS_PATH,
} from "../../src/installers.layouts";

export type InFiles = string[];

export interface ExampleMod {
  expectedInstallerType: InstallerType;
  inFiles: InFiles;
  outInstructions: Vortex.IInstruction[];
}

export type FailureMatchers = string | RegExp | Error;
export interface ExampleFailingMod {
  expectedInstallerType: InstallerType;
  inFiles: InFiles;
  failure?: FailureMatchers;
}

export type ExampleModCategory = Map<string, ExampleMod>;
export type ExampleFailingModCategory = Map<string, ExampleFailingMod>;

export const FAKE_STAGING_NAME = "mymegamod-43335455-wth-1";
export const FAKE_STAGING_PATH = path.join(
  "unno",
  "why",
  "this",
  FAKE_STAGING_NAME,
  path.sep,
);

const CORE_CET_FULL_PATH_DEPTH = path.normalize(
  "bin/x64/plugins/cyber_engine_tweaks/scripts/json",
);
const CORE_CET_PREFIXES = pathHierarchyFor(CORE_CET_FULL_PATH_DEPTH);
const GAME_DIR = path.normalize("bin/x64");

const CET_PREFIX = CET_MOD_CANONICAL_PATH_PREFIX;
const CET_PREFIXES = pathHierarchyFor(CET_PREFIX);
const CET_INIT = CET_MOD_CANONICAL_INIT_FILE;

const REDS_PREFIX = REDS_MOD_CANONICAL_PATH_PREFIX;
const REDS_PREFIXES = pathHierarchyFor(REDS_PREFIX);

const RED4EXT_PREFIX = RED4EXT_MOD_CANONICAL_PATH_PREFIX;
const RED4EXT_PREFIXES = pathHierarchyFor(RED4EXT_PREFIX);

const ARCHIVE_PREFIX = ARCHIVE_ONLY_CANONICAL_PREFIX;
const ARCHIVE_PREFIXES = pathHierarchyFor(ARCHIVE_PREFIX);

export const CoreCetInstall = new Map<string, ExampleMod>(
  Object.entries({
    coreCetInstall: {
      expectedInstallerType: InstallerType.CoreCET,
      inFiles: [
        ...CORE_CET_PREFIXES,
        path.join(`${GAME_DIR}/global.ini`),
        path.join(`${GAME_DIR}/LICENSE`),
        path.join(`${GAME_DIR}/version.dll`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
        path.join(
          `${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`,
        ),
        path.join(
          `${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`,
        ),
        path.join(`${CORE_CET_FULL_PATH_DEPTH}/json.lua`),
        path.join(`${CORE_CET_FULL_PATH_DEPTH}/LICENSE`),
        path.join(`${CORE_CET_FULL_PATH_DEPTH}/README.md`),
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${GAME_DIR}/global.ini`),
          destination: path.join(`${GAME_DIR}/global.ini`),
        },
        {
          type: "copy",
          source: path.join(`${GAME_DIR}/LICENSE`),
          destination: path.join(`${GAME_DIR}/LICENSE`),
        },
        {
          type: "copy",
          source: path.join(`${GAME_DIR}/version.dll`),
          destination: path.join(`${GAME_DIR}/version.dll`),
        },
        {
          type: "copy",
          source: path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
          destination: path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
        },
        {
          type: "copy",
          source: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`,
          ),
          destination: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`,
          ),
        },
        {
          type: "copy",
          source: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`,
          ),
          destination: path.join(
            `${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`,
          ),
        },
        {
          type: "copy",
          source: path.join(`${CORE_CET_FULL_PATH_DEPTH}/json.lua`),
          destination: path.join(`${CORE_CET_FULL_PATH_DEPTH}/json.lua`),
        },
        {
          type: "copy",
          source: path.join(`${CORE_CET_FULL_PATH_DEPTH}/LICENSE`),
          destination: path.join(`${CORE_CET_FULL_PATH_DEPTH}/LICENSE`),
        },
        {
          type: "copy",
          source: path.join(`${CORE_CET_FULL_PATH_DEPTH}/README.md`),
          destination: path.join(`${CORE_CET_FULL_PATH_DEPTH}/README.md`),
        },
      ],
    },
  }),
);

export const CoreRedscriptInstall = new Map<string, ExampleMod>(
  Object.entries({
    coreRedscriptInstall: {
      expectedInstallerType: InstallerType.CoreRedscript,
      inFiles: [
        path.join("engine/"),
        path.join("engine/config/"),
        path.join("engine/config/base/"),
        path.join("engine/config/base/scripts.ini"),
        path.join("engine/tools/"),
        path.join("engine/tools/scc.exe"),
        path.join("r6/"),
        path.join("r6/scripts/"),
        path.join("r6/scripts/redscript.toml"),
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.join("engine/config/base/scripts.ini"),
          destination: path.join("engine/config/base/scripts.ini"),
        },
        {
          type: "copy",
          source: path.join("engine/tools/scc.exe"),
          destination: path.join("engine/tools/scc.exe"),
        },
        {
          type: "copy",
          source: path.join("r6/scripts/redscript.toml"),
          destination: path.join("r6/scripts/redscript.toml"),
        },
      ],
    },
  }),
);

export const CoreRed4ExtInstall = new Map<string, ExampleMod>(
  Object.entries({
    Red4ExtCoreInstallTest: {
      expectedInstallerType: InstallerType.CoreRed4ext,
      inFiles: [
        ...pathHierarchyFor(path.normalize("bin/x64")),
        path.normalize("bin/x64/powrprof.dll"),
        ...pathHierarchyFor(path.normalize("red4ext/plugins")),
        path.normalize("red4ext/LICENSE.txt"),
        path.normalize("red4ext/RED4ext.dll"),
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("bin/x64/powrprof.dll"),
          destination: path.normalize("bin/x64/powrprof.dll"),
        },
        {
          type: "copy",
          source: path.normalize("red4ext/LICENSE.txt"),
          destination: path.normalize("red4ext/LICENSE.txt"),
        },
        {
          type: "copy",
          source: path.normalize("red4ext/RED4ext.dll"),
          destination: path.normalize("red4ext/RED4ext.dll"),
        },
        {
          type: "mkdir",
          destination: path.normalize("red4ext/plugins"),
        },
      ],
    },
  }),
);

export const CetMod = new Map<string, ExampleMod>(
  Object.entries({
    cetWithOnlyInitCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
      ],
    },
    cetWithTypicalMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/AdditionalSubFolder/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/configfile.json`),
        path.join(`${CET_PREFIX}/exmod/db.sqlite3`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/README.md`),
        path.join(`${CET_PREFIX}/exmod/AdditionalSubFolder/Whoaonemore/`),
        path.join(
          `${CET_PREFIX}/exmod/AdditionalSubFolder/Whoaonemore/init.lua`,
        ),
        path.join(`${CET_PREFIX}/exmod/AdditionalSubFolder/strangestuff.lua`),
        path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        path.join(`${CET_PREFIX}/exmod/Modules/MagicCheats.lua`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(
            `${CET_PREFIX}/exmod/AdditionalSubFolder/Whoaonemore/init.lua`,
          ),
          destination: path.join(
            `${CET_PREFIX}/exmod/AdditionalSubFolder/Whoaonemore/init.lua`,
          ),
        },
        {
          type: "copy",
          source: path.join(
            `${CET_PREFIX}/exmod/AdditionalSubFolder/strangestuff.lua`,
          ),
          destination: path.join(
            `${CET_PREFIX}/exmod/AdditionalSubFolder/strangestuff.lua`,
          ),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
          destination: path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/Modules/MagicCheats.lua`),
          destination: path.join(`${CET_PREFIX}/exmod/Modules/MagicCheats.lua`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/configfile.json`),
          destination: path.join(`${CET_PREFIX}/exmod/configfile.json`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/db.sqlite3`),
          destination: path.join(`${CET_PREFIX}/exmod/db.sqlite3`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/README.md`),
          destination: path.join(`${CET_PREFIX}/exmod/README.md`),
        },
      ],
    },
    cetWithIniFilesCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/some.ini`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/some.ini`),
          destination: path.join(`${CET_PREFIX}/exmod/some.ini`),
        },
      ],
    },
  }),
);

export const CetModShouldFail = new Map<string, ExampleFailingMod>(
  Object.entries({
    CetModWithIniShouldFail: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        path.join(`exmod/`),
        path.join(`exmod/${CET_INIT}`),
        path.join(`exmod/some.ini`),
      ],
      failure: "Improperly packaged CET mod with ini file",
    },
  }),
);

export const RedscriptMod = new Map<string, ExampleMod>(
  Object.entries({
    redsWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
      ],
    },
    redsWithMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
        },
      ],
    },
    redsIncludingNonRedsFilesCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        path.join(`${REDS_PREFIX}/rexmod/options.json`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/options.json`),
          destination: path.join(`${REDS_PREFIX}/rexmod/options.json`),
        },
      ],
    },
    redsSingleScriptTopLevel: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [path.join(`script.reds`)],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`script.reds`),
          destination: path.join(
            `${REDS_PREFIX}/${FAKE_STAGING_NAME}/script.reds`,
          ),
        },
      ],
    },
    redsWithMultipleFilesInRedsBaseDir: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/`),
        path.join(`${REDS_PREFIX}/script.reds`),
        path.join(`${REDS_PREFIX}/notascript.reds`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/script.reds`),
          destination: path.join(
            `${REDS_PREFIX}/${FAKE_STAGING_NAME}/script.reds`,
          ),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/notascript.reds`),
          destination: path.join(
            `${REDS_PREFIX}/${FAKE_STAGING_NAME}/notascript.reds`,
          ),
        },
      ],
    },
  }),
);

export const RedscriptModShouldFailInInstall = new Map<
  string,
  ExampleFailingMod
>(
  Object.entries({
    redsScriptInTopLevelDirShouldFail: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [path.join(`rexmod/script.reds`)],
      failure: "No Redscript found, should never get here.",
    },
    cetWithRedsInTopLevelShouldFail: {
      expectedInstallerType: InstallerType.RedCetMix,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`/script.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      failure: "No Redscript found, should never get here.",
    },
  }),
);

export const Red4ExtMod = new Map<string, ExampleMod>(
  Object.entries({
    red4extWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        },
      ],
    },
    red4extWithMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/notascript.dll`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/notascript.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/notascript.dll`),
        },
      ],
    },
    red4extIncludingNonRedsFilesCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/options.json`),
        path.join(`${RED4EXT_PREFIX}/r4emod/instructions.txt`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/script.dll`),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/options.json`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/options.json`),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/instructions.txt`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/instructions.txt`),
        },
      ],
    },
    red4extWithFilesInRed4ExtBasedirFixableSyntheticname: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/`),
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        path.join(`${RED4EXT_PREFIX}/notascript.dll`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(
            `${RED4EXT_PREFIX}/${FAKE_STAGING_NAME}/script.dll`,
          ),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/notascript.dll`),
          destination: path.join(
            `${RED4EXT_PREFIX}/${FAKE_STAGING_NAME}/notascript.dll`,
          ),
        },
      ],
    },
  }),
);

/*
export const Red4ExtModShouldFailInTest = new Map<string, ExampleFailingMod>([
  ...RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS.map((dir) => [
    `red4ext DLL in dangerous dir ${dir}`,
    {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [path.join(dir, "some.dll")],
      failure: "Should fail somehow",
    },
  ]),
  ...RED4EXT_KNOWN_NONOVERRIDABLE_DLLS.map((dll) => [
    `red4ext DLL with reserved name ${dll}`,
    {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [path.join(`bin/x64/scripties.dll`)],
      failure: "Should fail somehow.",
    },
  ]),
]);
*/

export const ArchiveOnly = new Map<string, ExampleMod>(
  Object.entries({
    archiveWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: [...ARCHIVE_PREFIXES, `${ARCHIVE_PREFIX}/first.archive`].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
      ],
    },
    archiveWithMultipleFilesCanonical: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_PREFIX}/first.archive`,
        `${ARCHIVE_PREFIX}/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithMultipleFilesCanonicalButInSubfolder: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_PREFIX}/fold1/first.archive`,
        `${ARCHIVE_PREFIX}/fold1/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
      ],
    },
    archiveWithMultipleFilesInHeritageFolderFixable: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX}/first.archive`,
        `${ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX}/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(
            `${ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX}/first.archive`,
          ),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize(
            `${ARCHIVE_ONLY_TRADITIONAL_WRONG_PREFIX}/second.archive`,
          ),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithSingleArchiveToplevel: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: ["first.archive"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
      ],
    },
    archiveWithMultipleArchivesTopLevel: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: ["first.archive", "second.archive"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize("second.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithArchivesInRandomFolder: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: ["fold1/", "fold1/first.archive", "fold1/second.archive"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/first.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/second.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
      ],
    },
    archiveWithArchivesTopLevelAndFolder: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: ["first.archive", "fold1/", "fold1/second.archive"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/second.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
      ],
    },
    archiveWithArchivesInRandomFolderPlusRandomFiles: {
      expectedInstallerType: InstallerType.ArchiveOnly,
      inFiles: [
        "fold1/",
        "fold1/first.archive",
        "fold1/foobar.txt",
        "fold1/more",
        "fold1/second.archive",
        "fold1/thisisenough.md",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/first.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/foobar.txt"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/foobar.txt`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/more"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/more`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/second.archive"),
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/second.archive`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/thisisenough.md"),
          destination: path.normalize(
            `${ARCHIVE_PREFIX}/fold1/thisisenough.md`,
          ),
        },
      ],
    },
  }), // object
);

export const ValidExtraArchivesWithType = new Map<string, ExampleMod>(
  Object.entries({
    cetWithExtraArchiveFilesCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/configfile.json`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/preemtextures.archive`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
          destination: path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/configfile.json`),
          destination: path.join(`${CET_PREFIX}/exmod/configfile.json`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.join(`${ARCHIVE_PREFIX}/preemtextures.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/preemtextures.archive`),
        },
      ],
    },
    redsWithExtraArchiveFilesCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        path.join(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        path.join(`${REDS_PREFIX}/rexmod/options.json`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/morescripties.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/options.json`),
          destination: path.join(`${REDS_PREFIX}/rexmod/options.json`),
        },
        {
          type: "copy",
          source: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        },
      ],
    },
  }),
);

export const ValidTypeCombinations = new Map<string, ExampleMod>(
  Object.entries({
    cetWithRedsAndArchivesCanonical: {
      expectedInstallerType: InstallerType.RedCetMix,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/notascript.reds`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          destination: path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        },
      ],
    },
    cetWithRedsAtRedsRootFixableUsesCetModName: {
      expectedInstallerType: InstallerType.RedCetMix,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/`),
        path.join(`${REDS_PREFIX}/script.reds`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${REDS_PREFIX}/script.reds`),
          destination: path.join(`${REDS_PREFIX}/exmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
          destination: path.join(`${CET_PREFIX}/exmod/Modules/morelua.lua`),
        },
        {
          type: "copy",
          source: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        },
      ],
    },
  }),
);

export const JsonMod = new Map<string, ExampleMod>(
  Object.entries({
    jsonWithValidFileInRoot: {
      expectedInstallerType: InstallerType.Json,
      inFiles: ["giweights.json"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("giweights.json"),
          destination: path.normalize("engine/config/giweights.json"),
        },
      ],
    },
    jsonInRandomFolder: {
      expectedInstallerType: InstallerType.Json,
      inFiles: [
        "fold1/",
        "fold1/giweights.json",
        "fold1/bumpersSettings.json",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/giweights.json"),
          destination: path.normalize("engine/config/giweights.json"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/bumpersSettings.json"),
          destination: path.normalize("r6/config/bumpersSettings.json"),
        },
      ],
    },
    jsonWithFilesInCorrectFolder: {
      expectedInstallerType: InstallerType.Json,
      inFiles: [
        "engine/",
        "engine/config/",
        "engine/config/giweights.json",
        "r6/",
        "r6/config",
        "r6/config/bumpersSettings.json",
        "r6/config/settings/",
        "r6/config/settings/options.json",
        "r6/config/settings/platform/",
        "r6/config/settings/platform/pc/",
        "r6/config/settings/platform/pc/options.json",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("engine/config/giweights.json"),
          destination: path.normalize("engine/config/giweights.json"),
        },
        {
          type: "copy",
          source: path.normalize("r6/config/bumpersSettings.json"),
          destination: path.normalize("r6/config/bumpersSettings.json"),
        },
        {
          type: "copy",
          source: path.normalize("r6/config/settings/options.json"),
          destination: path.normalize("r6/config/settings/options.json"),
        },
        {
          type: "copy",
          source: path.normalize("r6/config/settings/platform/pc/options.json"),
          destination: path.normalize(
            "r6/config/settings/platform/pc/options.json",
          ),
        },
      ],
    },
  }), // object
);

export const JsonModShouldFailInTest = new Map<string, ExampleFailingMod>(
  Object.entries({
    jsonWithInvalidFileInRootFailsInTest: {
      expectedInstallerType: InstallerType.NotSupported,
      inFiles: ["giweights.json", "options.json"].map(path.normalize),
      failure:
        "Improperly located options.json file found.  We don't know where it belongs.",
    },
  }),
);

export const IniMod = new Map<string, ExampleMod>(
  Object.entries({
    iniWithSingleIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["myawesomeconfig.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("myawesomeconfig.ini"),
          destination: path.normalize(`${INI_MOD_PATH}/myawesomeconfig.ini`),
        },
      ],
    },
    iniWithMultipleIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["myawesomeconfig.ini", "serious.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("myawesomeconfig.ini"),
          destination: path.normalize(`${INI_MOD_PATH}/myawesomeconfig.ini`),
        },
        {
          type: "copy",
          source: path.normalize("serious.ini"),
          destination: path.normalize(`${INI_MOD_PATH}/serious.ini`),
        },
      ],
    },
    iniWithReshadeIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["superreshade.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: "superreshade.ini",
          destination: path.normalize(`${RESHADE_MOD_PATH}/superreshade.ini`),
        },
      ],
    },
    iniWithSingleIniInRandomFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["fold1/", "fold1/myawesomeconfig.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/myawesomeconfig.ini"),
          destination: path.normalize(`${INI_MOD_PATH}/myawesomeconfig.ini`),
        },
      ],
    },
    iniWithReshadeIniAndShadersFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [
        "superreshade.ini",
        "reshade-shaders/",
        "reshade-shaders/Shaders/",
        "reshade-shaders/Shaders/fancy.fx",
        "reshade-shaders/Textures/",
        "reshade-shaders/Textures/lut.png",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: "superreshade.ini",
          destination: path.normalize(`${RESHADE_MOD_PATH}/superreshade.ini`),
        },
        {
          type: "copy",
          source: path.normalize("reshade-shaders/Shaders/fancy.fx"),
          destination: path.normalize(
            `${RESHADE_SHADERS_PATH}/Shaders/fancy.fx`,
          ),
        },
        {
          type: "copy",
          source: path.normalize("reshade-shaders/Textures/lut.png"),
          destination: path.normalize(
            `${RESHADE_SHADERS_PATH}/Textures/lut.png`,
          ),
        },
      ],
    },
    iniWithReshadeIniAndShadersInAFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [
        "fold1/superreshade.ini",
        "fold1/reshade-shaders/",
        "fold1/reshade-shaders/Shaders/",
        "fold1/reshade-shaders/Shaders/fancy.fx",
        "fold1/reshade-shaders/Textures/",
        "fold1/reshade-shaders/Textures/lut.png",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/superreshade.ini"),
          destination: path.normalize(`${RESHADE_MOD_PATH}/superreshade.ini`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/reshade-shaders/Shaders/fancy.fx"),
          destination: path.normalize(
            `${RESHADE_SHADERS_PATH}/Shaders/fancy.fx`,
          ),
        },
        {
          type: "copy",
          source: path.normalize(`fold1/reshade-shaders/Textures/lut.png`),
          destination: path.normalize(
            `${RESHADE_SHADERS_PATH}/Textures/lut.png`,
          ),
        },
      ],
    },
  }), // object
);

export const IniModShouldFail = new Map<string, ExampleFailingMod>(
  Object.entries({
    IniFileCETInstallerShouldFail: {
      expectedInstallerType: InstallerType.INI,
      inFiles: [
        ...pathHierarchyFor("bin/x64"),
        path.normalize("bin/x64/global.ini"),
      ],
      failure: "INI detects CETCore",
    },
  }),
);

export const AllModTypes = new Map<string, ExampleModCategory>(
  Object.entries({
    CoreCetInstall,
    CoreRedscriptInstall,
    CoreRed4ExtInstall,
    CetMod,
    RedscriptMod,
    Red4ExtMod,
    JsonMod,
    ArchiveOnly,
    ValidExtraArchivesWithType,
    ValidTypeCombinations,
  }),
);

export const AllExpectedTestSupportFailures = new Map<
  string,
  ExampleFailingModCategory
>(
  Object.entries({
    JsonModShouldFailInTest,
    //    Red4ExtModShouldFailInTest,
  }),
);

export const AllExpectedInstallFailures = new Map<
  string,
  ExampleFailingModCategory
>(
  Object.entries({
    RedscriptModShouldFailInInstall,
  }),
);

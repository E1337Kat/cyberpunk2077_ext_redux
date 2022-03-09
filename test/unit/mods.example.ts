import path from "path";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies

import {
  CET_MOD_CANONICAL_INIT_FILE,
  CET_MOD_CANONICAL_PATH_PREFIX,
} from "../../src/installers";

export type InFiles = string[];

export interface ExampleMod {
  inFiles: InFiles;
  outInstructions: Vortex.IInstruction[];
}

const CET_PREFIX = CET_MOD_CANONICAL_PATH_PREFIX;
const CET_INIT = CET_MOD_CANONICAL_INIT_FILE;

export const CetMod = new Map<string, ExampleMod>(
  Object.entries({
    cetWithOnlyInit: {
      inFiles: [
        path.join("bin/"),
        path.join("bin/x64/"),
        path.join("bin/x64/plugins/"),
        path.join("bin/x64/plugins/cyber_engine_tweaks/"),
        path.join("bin/x64/plugins/cyber_engine_tweaks/mods/"),
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
    cetWithTypicalValidLayout: {
      inFiles: [
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
    cetWithExtraArchiveFiles: {
      inFiles: [
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/configfile.json`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        path.join("archive/"),
        path.join("archive/pc/"),
        path.join("archive/pc/mod/"),
        path.join("archive/pc/mod/preemtextures.archive"),
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
          source: path.join(`archive/pc/mod/preemtextures.archive`),
          destination: path.join(`archive/pc/mod/preemtextures.archive`),
        },
      ],
    },
  }),
);

export const ArchiveOnly = new Map<string, ExampleMod>(
  Object.entries({
    archiveWithSingleArchiveToplevel: {
      inFiles: ["first.archive"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize("archive/pc/mod/first.archive"),
        },
      ],
    },
    archiveWithMultipleArchivesTopLevel: {
      inFiles: ["first.archive", "second.archive"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize("archive/pc/mod/first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("second.archive"),
          destination: path.normalize("archive/pc/mod/second.archive"),
        },
      ],
    },
    archiveWithArchivesInRandomFolder: {
      inFiles: ["fold1/", "fold1/first.archive", "fold1/second.archive"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/first.archive"),
          destination: path.normalize("archive/pc/mod/fold1/first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/second.archive"),
          destination: path.normalize("archive/pc/mod/fold1/second.archive"),
        },
      ],
    },
    archiveWithArchivesTopLevelAndFolder: {
      inFiles: ["first.archive", "fold1/", "fold1/second.archive"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize("archive/pc/mod/first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/second.archive"),
          destination: path.normalize("archive/pc/mod/fold1/second.archive"),
        },
      ],
    },
    archiveWithArchivesInCorrectFolder: {
      inFiles: [
        "archive/",
        "archive/pc/",
        "archive/pc/mod/",
        "archive/pc/mod/first.archive",
        "archive/pc/mod/second.archive",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("archive/pc/mod/first.archive"),
          destination: path.normalize("archive/pc/mod/fold1/first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("archive/pc/mod/second.archive"),
          destination: path.normalize("archive/pc/mod/fold1/second.archive"),
        },
      ],
    },
    archiveWithArchivesInRandomFolderPlusRandomFiles: {
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
          destination: path.normalize("archive/pc/mod/fold1/first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/foobar.txt"),
          destination: path.normalize("archive/pc/mod/fold1/foobar.txt"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/more"),
          destination: path.normalize("archive/pc/mod/fold1/more"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/second.archive"),
          destination: path.normalize("archive/pc/mod/fold1/second.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/thisisenough.md"),
          destination: path.normalize("archive/pc/mod/fold1/thisisenough.md"),
        },
      ],
    },
  }), // object
);
export const IniMod = new Map<string, ExampleMod>(
  Object.entries({
    archiveWithSingleIniAtRoot: {
      inFiles: ["myawesomeconfig.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("myawesomeconfig.ini"),
          destination: path.normalize(
            "engine/config/platform/pc/myawesomeconfig.ini",
          ),
        },
      ],
    },
    archiveWithMultipleIniAtRoot: {
      inFiles: ["myawesomeconfig.ini", "serious.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("myawesomeconfig.ini"),
          destination: path.normalize(
            "engine/config/platform/pc/myawesomeconfig.ini",
          ),
        },
        {
          type: "copy",
          source: path.normalize("serious.ini"),
          destination: path.normalize("engine/config/platform/pc/serious.ini"),
        },
      ],
    },
    archiveWithReshadeIniAtRoot: {
      inFiles: ["superreshade.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: "superreshade.ini",
          destination: path.normalize("bin/x64/superreshade.ini"),
        },
      ],
    },
    archiveWithSingleIniInRandomFolder: {
      inFiles: ["fold1/", "fold1/myawesomeconfig.ini"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/myawesomeconfig.ini"),
          destination: path.normalize(
            "engine/config/platform/pc/myawesomeconfig.ini",
          ),
        },
      ],
    },
    archiveWithReshadeIniAndShadersFolder: {
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
          destination: path.normalize("bin/x64/superreshade.ini"),
        },
        {
          type: "copy",
          source: path.normalize("reshade-shaders/Shaders/fancy.fx"),
          destination: path.normalize(
            "bin/x64/reshade-shaders/Shaders/fancy.fx",
          ),
        },
        {
          type: "copy",
          source: path.normalize("reshade-shaders/Textures/lut.png"),
          destination: path.normalize(
            "bin/x64/reshade-shaders/Textures/lut.png",
          ),
        },
      ],
    },
    archiveWithReshadeIniAndShadersInAFolder: {
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
          source: "fold1/superreshade.ini",
          destination: path.normalize("bin/x64/superreshade.ini"),
        },
        {
          type: "copy",
          source: path.normalize("fold1/reshade-shaders/Shaders/fancy.fx"),
          destination: path.normalize(
            "bin/x64/reshade-shaders/Shaders/fancy.fx",
          ),
        },
        {
          type: "copy",
          source: path.normalize("fold1/reshade-shaders/Textures/lut.png"),
          destination: path.normalize(
            "bin/x64/reshade-shaders/Textures/lut.png",
          ),
        },
      ],
    },
  }), // object
);
export const AllModTypes = [CetMod, ArchiveOnly, IniMod];

// const path = require("node:path"); // eslint-disable-line @typescript-eslint/no-var-requires
import path from "path";
import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies

export type InFiles = string[];

export interface ExampleMod {
  inFiles: InFiles;
  outInstructions: Vortex.IInstruction[];
}

export const ArchiveOnly = new Map<string, ExampleMod>(
  Object.entries({
    archiveWithSingleArchiveToplevel: {
      inFiles: ["first.archive"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize("archive\\pc\\mod\\first.archive"),
        },
      ],
    },
    archiveWithMultipleArchivesTopLevel: {
      inFiles: ["first.archive", "second.archive"].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize("archive\\pc\\mod\\first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("second.archive"),
          destination: path.normalize("archive\\pc\\mod\\second.archive"),
        },
      ],
    },
    archiveWithArchivesInRandomFolder: {
      inFiles: ["fold1\\", "fold1\\first.archive", "fold1\\second.archive"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1\\first.archive"),
          destination: path.normalize("archive\\pc\\mod\\fold1\\first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1\\second.archive"),
          destination: path.normalize(
            "archive\\pc\\mod\\fold1\\second.archive",
          ),
        },
      ],
    },
    archiveWithArchivesTopLevelAndFolder: {
      inFiles: ["first.archive", "fold1\\", "fold1\\second.archive"].map(
        path.normalize,
      ),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("first.archive"),
          destination: path.normalize("archive\\pc\\mod\\first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1\\second.archive"),
          destination: path.normalize(
            "archive\\pc\\mod\\fold1\\second.archive",
          ),
        },
      ],
    },
    archiveWithArchivesInCorrectFolder: {
      inFiles: [
        "archive\\",
        "archive\\pc\\",
        "archive\\pc\\mod\\",
        "archive\\pc\\mod\\first.archive",
        "archive\\pc\\mod\\second.archive",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("archive\\pc\\mod\\first.archive"),
          destination: path.normalize("archive\\pc\\mod\\fold1\\first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("archive\\pc\\mod\\second.archive"),
          destination: path.normalize(
            "archive\\pc\\mod\\fold1\\second.archive",
          ),
        },
      ],
    },
    archiveWithArchivesInRandomFolderPlusRandomFiles: {
      inFiles: [
        "fold1\\",
        "fold1\\first.archive",
        "fold1\\foobar.txt",
        "fold1\\more",
        "fold1\\second.archive",
        "fold1\\thisisenough.md",
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1\\first.archive"),
          destination: path.normalize("archive\\pc\\mod\\fold1\\first.archive"),
        },
        {
          type: "copy",
          source: path.normalize("fold1\\foobar.txt"),
          destination: path.normalize("archive\\pc\\mod\\fold1\\foobar.txt"),
        },
        {
          type: "copy",
          source: path.normalize("fold1\\more"),
          destination: path.normalize("archive\\pc\\mod\\fold1\\more"),
        },
        {
          type: "copy",
          source: path.normalize("fold1\\second.archive"),
          destination: path.normalize(
            "archive\\pc\\mod\\fold1\\second.archive",
          ),
        },
        {
          type: "copy",
          source: path.normalize("fold1\\thisisenough.md"),
          destination: path.normalize(
            "archive\\pc\\mod\\fold1\\thisisenough.md",
          ),
        },
      ],
    },
  }), // object
);

export const AllMods = { ...ArchiveOnly };

export const ArchiveOnly = {
  archiveWithSingleArchiveToplevel: {
    inFiles: ["first.archive"],
    outInstructions: [
      {
        type: "copy",
        source: "first.archive",
        destination: "archive\\pc\\mod\\first.archive",
      },
    ],
  },
  archiveWithMultipleArchivesTopLevel: {
    inFiles: ["first.archive", "second.archive"],
    outInstructions: [
      {
        type: "copy",
        source: "first.archive",
        destination: "archive\\pc\\mod\\first.archive",
      },
      {
        type: "copy",
        source: "second.archive",
        destination: "archive\\pc\\mod\\second.archive",
      },
    ],
  },
  archiveWithArchivesInRandomFolder: {
    inFiles: ["fold1\\", "fold1\\first.archive", "fold1\\second.archive"],
    outInstructions: [
      {
        type: "copy",
        source: "fold1\\first.archive",
        destination: "archive\\pc\\mod\\fold1\\first.archive",
      },
      {
        type: "copy",
        source: "fold1\\second.archive",
        destination: "archive\\pc\\mod\\fold1\\second.archive",
      },
    ],
  },
  archiveWithArchivesTopLevelAndFolder: {
    inFiles: ["first.archive", "fold1\\", "fold1\\second.archive"],
    outInstructions: [
      {
        type: "copy",
        source: "first.archive",
        destination: "archive\\pc\\mod\\first.archive",
      },
      {
        type: "copy",
        source: "fold1\\second.archive",
        destination: "archive\\pc\\mod\\fold1\\second.archive",
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
    ],
    outInstructions: [
      {
        type: "copy",
        source: "archive\\pc\\mod\\first.archive",
        destination: "archive\\pc\\mod\\fold1\\first.archive",
      },
      {
        type: "copy",
        source: "archive\\pc\\mod\\second.archive",
        destination: "archive\\pc\\mod\\fold1\\second.archive",
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
    ],
    outInstructions: [
      {
        type: "copy",
        source: "fold1\\first.archive",
        destination: "archive\\pc\\mod\\fold1\\first.archive",
      },
      {
        type: "copy",
        source: "fold1\\foobar.txt",
        destination: "archive\\pc\\mod\\fold1\\foobar.txt",
      },
      {
        type: "copy",
        source: "fold1\\more",
        destination: "archive\\pc\\mod\\fold1\\more",
      },
      {
        type: "copy",
        source: "fold1\\second.archive",
        destination: "archive\\pc\\mod\\fold1\\second.archive",
      },
      {
        type: "copy",
        source: "fold1\\thisisenough.md",
        destination: "archive\\pc\\mod\\fold1\\thisisenough.md",
      },
    ],
  },
};

export const AllMods = { ...ArchiveOnly };

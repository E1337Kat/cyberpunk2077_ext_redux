export const ArchiveOnlyMods = {
  archiveWithSingleArchiveToplevel: ["first.archive"],
  archiveWithMultipleArchivesTopLevel: ["first.archive", "second.archive"],
  archiveWithArchivesInRandomFolder: [
    "fold1\\",
    "fold1\\first.archive",
    "fold1\\second.archive",
  ],
  archiveWithArchivesTopLevelAndFolder: [
    "first.archive",
    "fold1\\",
    "fold1\\second.archive",
  ],
  archiveWithArchivesInCorrectFolder: [
    "archive\\",
    "archive\\pc\\",
    "archive\\pc\\mod\\",
    "archive\\pc\\mod\\first.archive",
    "archive\\pc\\mod\\second.archive",
  ],
  archiveWithArchivesInRandomFolderPlusRandomFiles: [
    "fold1\\",
    "fold1\\first.archive",
    "fold1\\foobar.txt",
    "fold1\\more",
    "fold1\\second.archive",
    "fold1\\thisisenough.md",
  ],
};

export const Mods = { ...ArchiveOnlyMods };

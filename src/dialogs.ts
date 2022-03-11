/* eslint-disable prefer-template */
import { VortexAPI, VortexLogFunc } from "./vortex-wrapper";

const heredoc = (str: string) =>
  str.replace(/^[ \t]+/gm, "").replace(/\n{3,}/g, "\n\n");

export const redCetMixedStructureErrorDialog = (
  api: VortexAPI,
  log: VortexLogFunc,
  message: string,
  files: string[],
) => {
  log("error", `Redscript Mod installer: ${message}`, files);

  // It'd be nicer to move at least the long text out, maybe constant
  // for text + function for handling the boilerplate?
  api.showDialog(
    "error",
    message,
    {
      md:
        "I found several possible Redscript layouts, but can only support " +
        "one layout per mod. This mod can't be installed! You will have to fix the " +
        "mod manually _outside_ Vortex for now.\n" +
        "\n" +
        "Supported layouts:\n" +
        " - `.\\r6\\scripts\\[modname]\\[any files and subfolders]` (canonical)\n" +
        " - `.\\r6\\scripts\\*.reds` (I can fix this to canonical)\n" +
        " - `.\\*.reds` (I can fix this to canonical)\n" +
        "\n" +
        "Got:\n" +
        `${files.join("\n")}`,
    },
    [{ label: "Ok, Mod Was Not Installed" }],
  );
};
export const redWithInvalidFilesErrorDialog = (
  api: VortexAPI,
  log: VortexLogFunc,
  message: string,
  files: string[],
  installable: string[],
) => {
  log("error", `Redscript Mod installer: ${message}`, files);

  // It'd be nicer to move at least the long text out, maybe constant
  // for text + function for handling the boilerplate?
  api.showDialog(
    "error",
    message,
    {
      md:
        "I found several possible Redscript layouts, but can only support " +
        "one layout per mod. This mod can't be installed! You will have to fix the " +
        "mod manually _outside_ Vortex for now.\n" +
        "\n" +
        "Supported layouts:\n" +
        " - `.\\r6\\scripts\\[modname]\\[any files and subfolders]` (canonical)\n" +
        " - `.\\r6\\scripts\\*.reds` (I can fix this to canonical)\n" +
        " - `.\\*.reds` (I can fix this to canonical)\n" +
        "\n" +
        "Got:\n" +
        `${installable.join("\n")}`,
    },
    [{ label: "Ok, Mod Was Not Installed" }],
  );
};

// Should maybe grab the result here when abstracting,
// so that we can wait on it if needed
export const showArchiveStructureErrorDialog = (
  api: VortexAPI,
  message: string,
  files: string[],
): void => {
  api.showDialog(
    "error",
    message,
    {
      // Extract this common layout messaging?
      // Maybe generate the supported layouts
      // from some documentation or smth.
<<<<<<< HEAD
      md: heredoc(
        `I found several possible Archive layouts, but can only support one layout per mod.
         This mod can't be installed! You will have to fix the mod manually _outside_ Vortex for now.

         Supported layouts:

        - \`.\\archive\\pc\\mod\\[*.archive + any files/subdirs]     (canonical)\`
        - \`.\\archive\\pc\\patch\\[*.archive + any files/subdirs]   (old way, I can fix this to new)\`
        - \`.\\**\\[*.archive + any files/subdirs]                   (I can fix this to canonical)\`
        - \`.\\[*.archive + any files/subdirs]                       (I can fix this to canonical)\`

         Got:

         \`\`\`
         ${files.join("\n")}
         \`\`\``,
      ),
    },
    [{ label: "Understood!" }],
=======
      md:
        "I found several possible Archive layouts, but can only support " +
        "one layout per mod. This mod can't be installed! You will have to fix the " +
        "mod manually _outside_ Vortex for now.\n" +
        "\n" +
        "Supported layouts:\n" +
        " - `.\\archive\\pc\\mod\\[*.archive + any files/subdirs]` (canonical)\n" +
        " - `.\\archive\\pc\\patch\\[*.archive + any files/subdirs]` (old way, I can fix this to new)\n" +
        " - `.\\**\\[*.archive + any files/subdirs]` (I can fix this to canonical)\n" +
        " - `.\\[*.archive + any files/subdirs]` (I can fix this to canonical)\n" +
        "\n" +
        "Got:\n" +
        `${files.join("\n")}`,
    },
    [{ label: "OK, Installation Canceled" }],
>>>>>>> 3da9439 (ArchiveOnly retains subfolders + uses filetree)
  );
};

export const showArchiveInstallWarning = (
  api: VortexAPI,
  warnAboutSubdirs: boolean,
  warnAboutToplevel: boolean,
  files: string[],
): void => {
  const subdirWarning =
    "- There are *.archive files in subdirectories (any files in them won't be loaded)";

  const toplevelWarning =
    "- There's more than one top-level *.archive (which could be unintentional)";

<<<<<<< HEAD
=======
  const heredoc = (str: string) =>
    str.replace(/^[ \t]+?/, "").replace(/\n{3,}/, "\n\n");

>>>>>>> 3da9439 (ArchiveOnly retains subfolders + uses filetree)
  api.showDialog(
    "info",
    "Mod Installed But May Need Manual Adjustment!",
    {
      md: heredoc(
        `I installed the mod, but it may need to be manually adjusted because:

<<<<<<< HEAD
        ${warnAboutSubdirs ? subdirWarning : "\n"}
        ${warnAboutToplevel ? toplevelWarning : "\n"}

        This could be unintentional, but you might also be expected to only pick some
=======
        ${warnAboutSubdirs && subdirWarning}
        ${warnAboutToplevel && toplevelWarning}

        It's possible that this is intentional, but you might also be expected to only pick some
>>>>>>> 3da9439 (ArchiveOnly retains subfolders + uses filetree)
        of the files to use, or it could be an oversight or an unstructured mod.

        Make sure to read any instructions the mod might have, and then if necessary adjust the installation manually.
        You can open and modify the mod by clicking 'Open in File Manager' in the Action Menu (dropdown next to 'Remove').

        If you want to keep multiple variants of the mod (for different colors, for example), you can click 'Reinstall'
        in the Action Menu, and select to install a variant (give it a good name!).

        These are the files I installed:

<<<<<<< HEAD
        \`\`\`
        ${files.join("\n")}
        \`\`\``,
=======
        ${files.join("\n")}`,
>>>>>>> 3da9439 (ArchiveOnly retains subfolders + uses filetree)
      ),
    },
    [{ label: "Understood!" }],
  );
};

// Example notif + dialog
/*
  api.sendNotification({
    type: "warning",
    title: message,
    message: "Check mod files in File Manager!",
    actions: [
      {
        title: "More info",
        action: (dismiss) => {
          api.showDialog(
            "info",
            "Archive Files Moved To Top Level",
            {
              text:
                "There were some archive files outside the canonical mod folder " +
                ".\\archive\\pc\\mod or inside a subdirectory. " +
                "The installer moved them all to the top level. Please check " +
                "the mod in File Manager (Down Arrow next to the Remove action " +
                "in the mod list) to verify the files are correct!",
            },
            [{ label: "Close", action: () => dismiss() }],
          );
        },
      },
    ],
  });
  */

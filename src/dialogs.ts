import { VortexAPI, VortexLogFunc } from "./vortex-wrapper";

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
        `${files.join("\n")}`,
    },
    [{ label: "Ok, Mod Was Not Installed" }],
  );
};
export const fallbackInstallerReachedErrorDialog = (
  api: VortexAPI,
  log: VortexLogFunc,
  message: string,
  files: string[],
  installable: string[],
) => {
  log("error", `Fallback installer: ${message}`, files);

  // It'd be nicer to move at least the long text out, maybe constant
  // for text + function for handling the boilerplate?
  api.showDialog(
    "info",
    message,
    {
      md:
        "All implemented installers were unable to process the mod and we have " +
        "reached the installer of last resort.  All files are being installed as " +
        "if unpackaged in the game root directory.\n" +
        "\n" +
        "It is advised that you check to see that the mod has been installed correctly " +
        "by checking the game folder.  If you need to move something, please do so in " +
        "your mod staging folder which can be reached in the above toolbar or by right " +
        "clicking the mod and selecting 'Open in File Manager'.\n\n" +
        "Got:\n" +
        `${installable.join("\n")}`,
    },
    [{ label: "Ok, Mod Was Installed" }],
  );
};

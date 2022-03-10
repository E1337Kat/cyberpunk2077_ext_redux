import * as Vortex from "vortex-api/lib/types/api"; // eslint-disable-line import/no-extraneous-dependencies
import { VortexAPI, VortexLogFunc } from "./installers";

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
  installable: any[],
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

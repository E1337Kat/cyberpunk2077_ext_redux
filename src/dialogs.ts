/* eslint-disable prefer-template */
import {
  ArchiveLayout,
  CetLayout,
  InvalidLayout,
  Red4ExtLayout,
  RedscriptLayout,
} from "./installers.layouts";
import { VortexApi, VortexLogFunc } from "./vortex-wrapper";

const heredoc = (str: string) => str.replace(/^[ \t]+/gm, "").replace(/\n{3,}/g, "\n\n");

export const redCetMixedStructureErrorDialog = (
  api: VortexApi,
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
export const showRedscriptStructureErrorDialog = (
  api: VortexApi,
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

// Should try to get this doc in a stronger format like using the layout
//
// Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/75
//
const red4extLayoutDescription = heredoc(`
  Supported layouts for Red4Ext mods:

  - \`.\\red4ext\\plugins\\[modname]\\[*.dll + any files/subdirs]   (canonical)\`
    - (if any) \`.\\archive\\pc\\mod\\*.archive\`
  - \`.\\red4ext\\plugins\\[*.dll + any files/subdirs]              (I can fix this to canonical)\`   
    - (if any) \`.\\archive\\pc\\mod\\*.archive\`
  - \`.\\[modname]\\[*.dll + any files/subdirs]                     (I can fix this to canonical)\`   
    - (if any) \`.\\*.archive\`
  - \`.\\*.dll                                                      (I can fix this to canonical)\`   
    - (if any) \`.\\**\\[any files/subdirs]
    - (if any) \`.\\*.archive\``);

export const showRed4ExtReservedDllErrorDialog = (
  api: VortexApi,
  message: string,
  dangerPaths: string[],
): void => {
  api.showDialog(
    "error",
    message,
    {
      md: heredoc(`
        Installation cancelled!

        Because this mod has DLLs, it seems like it might be a Red4Ext mod, but I can't install
        DLLs that look like they could conflict with known DLL files!

        ${red4extLayoutDescription}

        If any of the following contain DLLs that this mod _should_ install or this isn't a Red4Ext
        mod at all, please report a bug and we'll see how we can handle it better! In the meanwhile,        
        you can manually install the files (but please be careful!)

        I cancelled the installation because of these files:

        \`\`\`
        ${dangerPaths.join("\n")}
        \`\`\``),
    },
    [{ label: "Understood!" }],
  );
};

export const showRed4ExtStructureErrorDialog = (
  api: VortexApi,
  message: string,
  files: string[],
  isMultiple?: InvalidLayout,
): void => {
  const problemDescription = isMultiple
    ? `
        I found several possible Red4Ext mod layouts, but can only support one layout per mod.`
    : `
        This looks like a Red4Ext mod, but there are files outside any structure that I can handle.`;

  api.showDialog(
    "error",
    message,
    {
      // Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/76
      md: heredoc(
        `Installation cancelled!

        ${problemDescription} This mod can't be installed! You'll have to fix it
        _outside_ Vortex for now!

         Supported layouts:

         ${red4extLayoutDescription}

         These are the files I found in the mod:

         \`\`\`
         ${files.join("\n")}
         \`\`\``,
      ),
    },
    [{ label: "Understood!" }],
  );
};

// Should maybe grab the result here when abstracting,
// so that we can wait on it if needed
export const showArchiveStructureErrorDialog = (
  api: VortexApi,
  message: string,
  files: string[],
): void => {
  api.showDialog(
    "error",
    message,
    {
      // Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/76
      // Extract this common layout messaging?
      // Maybe generate the supported layouts
      // from some documentation or smth.
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
  );
};

export const showArchiveInstallWarning = (
  api: VortexApi,
  warnAboutSubdirs: boolean,
  warnAboutToplevel: boolean,
  files: string[],
): void => {
  const subdirWarning =
    "- There are *.archive files in subdirectories (any files in them won't be loaded)";

  const toplevelWarning =
    "- There's more than one top-level *.archive (which could be unintentional)";

  api.showDialog(
    "info",
    "Mod Installed But May Need Manual Adjustment!",
    {
      // Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/76
      md: heredoc(
        `I installed the mod, but it may need to be manually adjusted because:

        ${warnAboutSubdirs ? subdirWarning : "\n"}
        ${warnAboutToplevel ? toplevelWarning : "\n"}

        This could be unintentional, but you might also be expected to only pick some
        of the files to use, or it could be an oversight or an unstructured mod.

        Make sure to read any instructions the mod might have, and then if necessary adjust the installation manually.
        You can open and modify the mod by clicking 'Open in File Manager' in the Action Menu (dropdown next to 'Remove').

        If you want to keep multiple variants of the mod (for different colors, for example), you can click 'Reinstall'
        in the Action Menu, and select to install a variant (give it a good name!).

        These are the files I installed:

        \`\`\`
        ${files.join("\n")}
        \`\`\``,
      ),
    },
    [{ label: "Understood!" }],
  );
};

// Should try to carry in some more diagnostic information to the user
// Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/81
export const showMultiTypeStructureErrorDialog = (
  api: VortexApi,
  message: string,
  files: string[],
): void => {
  api.showDialog(
    "error",
    message,
    {
      // Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/76
      md: heredoc(`
        Installation cancelled!

        It looks like this mod combined multiple types of mods, but I can only
        support them if they're well structured. Each different type within the
        mod has to use the canonical layout for that type. (When it's just one
        type of mod, I can make more assumptions and can support more possible
        layouts.)

        The installation was cancelled, so you'll have to fix the mod _outside_
        Vortex for now.

        These are the layouts I can support in combinations (NOTE: there can't
        be any other kinds of files outside these.):

        - \`${CetLayout.Canon}\`
        - \`${RedscriptLayout.Canon}\`
        - \`${Red4ExtLayout.Canon}\`
        - \`${ArchiveLayout.Canon}\`
        - \`${ArchiveLayout.Heritage}\`

        These are the files I found in the mod:

        \`\`\`
        ${files.join("\n")}
        \`\`\``),
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
export const fallbackInstallerReachedErrorDialog = (
  api: VortexApi,
  log: VortexLogFunc,
  message: string,
  files: string[],
  _installable: string[],
) => {
  log("error", `Fallback installer: ${message}`, files);

  // Improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/76

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
        `${files.join("\n")}`,
    },
    [{ label: "Ok, Mod Was Installed" }],
  );
};

export const wolvenKitDesktopFoundErrorDialog = (
  api: VortexApi,
  log: VortexLogFunc,
  message: string,
  files: string[],
  _installable: string[],
) => {
  log("error", `CoreWolvenKit installer: ${message}`, files);

  // It'd be nicer to move at least the long text out, maybe constant
  // for text + function for handling the boilerplate?
  api.showDialog(
    "info",
    message,
    {
      md:
        "I think you accidentally grabbed the wrong file. This installer can " +
        "help you install WolvenKit Console which is an Optional file on the " +
        "[Nexus download page](https://www.nexusmods.com/cyberpunk2077/mods/2201?tab=files) " +
        "The file you tried to install is WolvenKit Desktop which cannot be " +
        "installed through Vortex",
    },
    [{ label: "Ok, I'll get WolvenKit.Console" }],
  );
};

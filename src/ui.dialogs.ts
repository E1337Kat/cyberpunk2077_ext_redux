/* eslint-disable prefer-template */
import path from "path";
import {
  EXTENSION_NAME_NEXUS,
  EXTENSION_URL_GITHUB,
  EXTENSION_URL_NEXUS,
} from "./index.metadata";
import {
  ARCHIVE_MOD_CANONICAL_PREFIX,
  LayoutDescriptions,
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_BASEDIR,
} from "./installers.layouts";
import {
  InstallDecision,
  InstallerType,
} from "./installers.types";
import { heredoc } from "./installers.utils";
import {
  VortexApi,
  VortexDialogResult,
} from "./vortex-wrapper";

export const enum InstallChoices {
  Proceed = `Yes, Install To Staging Anyway`,
  Cancel = `No, Cancel Installation`,
}

const INSTRUCTIONS_TO_FIX_IN_STAGING = `
    If you want to proceed, I'll install *EVERYTHING* in the mod
    into the Staging folder. You will need to check and possibly
    fix the mod manually before you enable it. (The Staging folder
    is where all installed mods live - they only go into the game
    mod folder when you \`enable\` the mod.)

    To do so, once the mod is installed, click on the File Manager
    option in the action menu (arrow down next to Remove on the right
    in the mod listing.) Make your changes and just close the Manager.
    `;

const INSTRUCTIONS_TO_REPORT_ISSUE = `
    Please let the team know if this looks like a valid mod. You can
    reach us at:

    - [${EXTENSION_URL_NEXUS}](${EXTENSION_URL_NEXUS}) (or just search for ${EXTENSION_NAME_NEXUS})
    - [${EXTENSION_URL_GITHUB}](${EXTENSION_URL_GITHUB})
    `;

// This'll be converted to a reject down the line somewhere
const getLayoutDescriptionOrThrow = (api: VortexApi, installerType: InstallerType): string => {
  const supportedLayoutsDescription = LayoutDescriptions.get(installerType);

  if (supportedLayoutsDescription === undefined) {
    const errorCausingAnExitHopefullyInTestsAndNotInProd = `No layout description found for ${installerType}, exiting`;

    api.log(`error`, errorCausingAnExitHopefullyInTestsAndNotInProd);
    throw new Error(errorCausingAnExitHopefullyInTestsAndNotInProd);
  }

  return supportedLayoutsDescription;
};

// Dialog functions

export const informUserZeroNineZeroChanges = async (
  api: VortexApi,
): Promise<void> => {
  const title = `Full REDmod Update`;
  const redmodZeroNineZeroExplanation = `
  The Vortex Cyberpunk 2077 Extension team has _finally_ gotten it together and managed to
  get full REDmod support into the extension. This update brings about better support for
  installing REDmods, managing their load order, and starting the game through vortex with
  all your mods enabled and in the order selected. There are a few things to note about this
  update though...
  
  1. Because of how load order works in Cyberpunk 2077 with REDmods, when a change is made to
  the load order, we have have to call out to the redmod dlc executable to 'Deploy' the new
  load order. This could take more than a few seconds depending on how many redmods are
  being deployed, and how many *new* redmods that have scripts or tweaks.
  
  2. We can only know about the redmods installed through Vortex, so any manually installed
  REDmods may not work unless you manually use the redmod 'deploy' command. We will try to
  add basic load order support for these "unmanaged" mods, but only as far as being in the
  load order goes. We cannot support enabling/disabling a mod which is unmanaged by Vortex
  
  3. A new (optional) feature we are trying out is "Auto-Converting Old Style Archives".
  What this means is that when you go to install a mod that is an old style archive (ie. one
  that would be installed in \`archive/pc/mods/\`), then we will attempt to build a REDmod
  for it so that it can be used as part of the load order. NOTE: If you use the feature,
  do _NOT_ bother the mod authors with any problems that might happen with it.`;

  return api.showDialog(
    `info`,
    title,
    {
      md: heredoc(redmodZeroNineZeroExplanation),
    },
    [{ label: `Understood!` }],
  );
};

export const promptUserInstallREDmoddingDlc = async (
  api: VortexApi,
  redModDetails: { name: string, url: string, openCommand: () => Promise<void> },
  fallback: () => Promise<void>,
): Promise<void> => {
  const title = `REDmod DLC missing`;
  const redmodInstallExplanation = `
  The 1.6 update for Cyberpunk 2077 included an optional DLC called REDmod. 
  This DLC allows the game to load modded content created with the REDmod toolkit.
  Vortex has detected that the REDmod DLC is not installed on your system.
  You can get the DLC for free${redModDetails.name ? ` from ${redModDetails.name}` : null} using the button below.`;

  return api.showDialog(
    `question`,
    title,
    {
      md: heredoc(redmodInstallExplanation),
    },
    [
      {
        label: `Get REDmod`,
        action: () => redModDetails.openCommand()
          .catch(() => fallback()
            .catch(() => undefined)),
      },
      {
        label: `Ignore`,
      },
    ],
  );
};

export const promptUserToInstallOrCancel = async (
  api: VortexApi,
  title: string,
  explanation: string,
): Promise<InstallDecision> => {
  const dialogResponse: VortexDialogResult = await api.showDialog(
    `question`,
    title,
    {
      md: heredoc(explanation),
    },
    [{ label: InstallChoices.Cancel }, { label: InstallChoices.Proceed }],
  );

  const installDecision =
    dialogResponse.action === InstallChoices.Proceed
      ? InstallDecision.UserWantsToProceed
      : InstallDecision.UserWantsToCancel;

  return installDecision;
};

export const promptUserOnProtectedPaths = async (
  api: VortexApi,
  installerType: InstallerType,
  protectedPaths: string[],
): Promise<InstallDecision> => {
  const explanationForUser = `
    This mod contains some paths that I consider protected! They might be
    either critical game files, or for example configuration files that
    you may have customized or that other mods might also have modified.

    **This does not mean there's a problem with the mod, just that I
    want to make sure you're ready to proceed.**

    Review the files below to make sure it's okay to install these and
    that you've backed up your config files etc. before you enable the mod :)

    (Just installing this mod won't overwrite the files yet, that's only
    when you enable the mod - if you use the auto-enable setting, you
    should make your backups before proceeding, otherwise you can do it later.)

    These are the protected paths this mod will write to:
    \`\`\`
    ${protectedPaths.join(`\n`)}
    \`\`\``;

  return promptUserToInstallOrCancel(
    api,
    `Mod Contains Protected Paths`,
    explanationForUser,
  );
};

export const promptUserOnUnresolvableLayout = async (
  api: VortexApi,
  installerType: InstallerType,
  files: string[],
): Promise<InstallDecision> => {
  api.log(
    `error`,
    `${installerType}: unresolvable layout, can't install automatically`,
    files,
  );
  api.log(`info`, `Asking user to proceed/cancel installation`);

  const supportedLayoutsDescription = getLayoutDescriptionOrThrow(api, installerType);

  const explanationForUser = `
    This looked like the ${installerType} kind of mod to me, but I can't figure
    out what the intended layout here is. It's also possible I've misidentified
    the mod, or that this is a valid layout I just don't understand (yet)!

    You need to decide if you want to proceed or not.

    ${INSTRUCTIONS_TO_FIX_IN_STAGING}

    These are the supported layouts for ${installerType} mods:

    ${supportedLayoutsDescription}

    ${INSTRUCTIONS_TO_REPORT_ISSUE}

    These are the files I found in the mod:

    \`\`\`
    ${files.join(`\n`)}
    \`\`\``;

  return promptUserToInstallOrCancel(
    api,
    `Can't Figure Out How To Install This Mod!`,
    explanationForUser,
  );
};

export const promptUserToInstallOrCancelOnDeprecatedCoreMod = async (
  api: VortexApi,
  coreModType: InstallerType,
  files: string[],
): Promise<InstallDecision> => {
  // -.-
  const coreModName = coreModType.replace(/installer.*$/i, ``);

  api.log(`info`, `Deprecated ${coreModName} found, prompting to proceed/cancel`, files);

  const deprecationTitle = `This looks like an old version of ${coreModName}!`;

  const deprecationExplanation = `
    It looks like you are attempting to install an older version of ${coreModName}.
    I can still install this version, but please check the mod
    page for the most recent version and update to that.
    `;

  return promptUserToInstallOrCancel(api, deprecationTitle, deprecationExplanation);
};

export const promptUserToInstallOrCancelOnReachingFallback = (
  api: VortexApi,
  files: string[],
): Promise<InstallDecision> => {
  api.log(`info`, `Fallback installer reached, prompting to proceed/cancel`, files);

  const fallbackTitle = `You Have Reached The Fallback Installer!`;

  const fallbackExplanation = `
    I wasn't able to figure out what kind of mod this is, so you have
    reached the fallback installer (ta-dah!)

    ${INSTRUCTIONS_TO_FIX_IN_STAGING}

    ${INSTRUCTIONS_TO_REPORT_ISSUE}

    These are the files in the mod:

    \`\`\`
    ${files.join(`\n`)}
    \`\`\`
    `;

  return promptUserToInstallOrCancel(api, fallbackTitle, fallbackExplanation);
};

export const showArchiveInstallWarning = (
  api: VortexApi,
  installer: InstallerType,
  warnAboutSubdirs: boolean,
  warnAboutToplevel: boolean,
  warnAboutXLs: boolean,
  files: string[],
): void => {
  const canonicalDirForType =
    installer === InstallerType.REDmod
      ? path.join(REDMOD_BASEDIR, `[mod name]`, REDMOD_ARCHIVES_DIRNAME)
      : ARCHIVE_MOD_CANONICAL_PREFIX;

  const subdirWarning = warnAboutSubdirs
    ? `
      - There are \`*.archive\` files in subdirectories

      The game does not read archives in subdirectories. You may be expected
      to pick some of these to place into \`${canonicalDirForType}\`.
      `
    : `\n`;

  const toplevelWarning = warnAboutToplevel
    ? `
      - There's more than one top-level \`*.archive\`

      This might be intentional, it's perfectly OK to have multiple archives if
      they do different things. However, it could also be an oversight, or you
      might be expected to pick only some of these to place into \`${canonicalDirForType}\`
      `
    : `\n`;

  if (warnAboutXLs && installer === InstallerType.REDmod) {
    api.log(`warn`, `XL archives are not supported by REDmod, we should not get here!`, files);
  }

  const xlWarning = warnAboutXLs && installer === InstallerType.Archive
    ? `
      - There are \`*.xl\` files in subdirectories

      XL files are not supported in subdirectories. They must be placed into
      the Archive mod basedir \`${ARCHIVE_MOD_CANONICAL_PREFIX}\`. It's possible
      you're intended to choose one, but either way you'll have to move the XLs
      manually if the mod otherwise looks valid.

      `
    : `\n`;


  api.showDialog(
    `info`,
    `Mod Installed But May Need Manual Adjustment!`,
    {
      md: heredoc(
        `I installed the mod, but it may need to be manually adjusted because:

        ${xlWarning}

        ${subdirWarning}

        ${toplevelWarning}

        Make sure to read any instructions the mod might have, and then if necessary
        adjust the installation manually.

        ${INSTRUCTIONS_TO_FIX_IN_STAGING}

        If you want to keep multiple variants of the mod (for different colors, for example),
        you can click 'Reinstall' in the Action Menu, and select to install a variant (give
        it a good name!).

        These are the files I installed:

        \`\`\`
        ${files.join(`\n`)}
        \`\`\``,
      ),
    },
    [{ label: `Understood!` }],
  );
};

export const wolvenKitDesktopFoundErrorDialog = (api: VortexApi, message: string): Promise<VortexDialogResult> =>
  // It'd be nicer to move at least the long text out, maybe constant
  // for text + function for handling the boilerplate?
  api.showDialog(
    `error`,
    message,
    {
      md: heredoc(`
        This is an unsupported mod tool. The file you tried to install
        is WolvenKit Desktop which cannot be installed through Vortex
      `),
    },
    [{ label: `Understood!` }],
  );
// };

export const showRed4ExtReservedDllErrorDialog = (
  api: VortexApi,
  message: string,
  dangerPaths: string[],
): void => {
  api.showDialog(
    `error`,
    message,
    {
      md: heredoc(`
        Installation cancelled!

        Because this mod has DLLs, it seems like it might be a Red4Ext mod, but I can't install
        DLLs that look like they could conflict with known DLL files!

        These are the supported layouts for Red4Ext mods:

        ${LayoutDescriptions.get(InstallerType.Red4Ext)}

        If any of the files below contain DLLs that this mod _should_ install or this isn't a Red4Ext
        mod at all, please report a bug and we'll see how we can handle it better! In the meanwhile,
        you can manually install the files (but please be careful with DLLs!)

        ${INSTRUCTIONS_TO_REPORT_ISSUE}

        I cancelled the installation because of these files:

        \`\`\`
        ${dangerPaths.join(`\n`)}
        \`\`\``),
    },
    [{ label: `Understood!` }],
  );
};

export const showWarningForUnrecoverableStructureError = (
  api: VortexApi,
  installerType: InstallerType,
  warningTitle: string,
  filesToList: string[],
): void => {
  const supportedLayoutsDescription = getLayoutDescriptionOrThrow(api, installerType);

  api.showDialog(
    `error`,
    warningTitle,
    {
      md: heredoc(`
        Installation cancelled!

        This looks like the ${installerType} kind of mod, but it doesn't fit the expected
        file layout. This one is pretty strict, so I can't install this mod because there's
        a higher risk that something's wrong with the mod.

        These are the supported layouts for ${installerType}:

        ${supportedLayoutsDescription}

        ${INSTRUCTIONS_TO_REPORT_ISSUE}

        The mod contains these files:

        \`\`\`
        ${filesToList.join(`\n`)}
        \`\`\``),
    },
    [{ label: `Understood!` }],
  );
};

export const showErrorForDeprecatedModTool = (
  api: VortexApi,
  installerType: InstallerType,
  warningTitle: string,
): void => {
  api.showDialog(
    `error`,
    warningTitle,
    {
      md: heredoc(`
        Installation cancelled!

        It looks like you were trying to install ${installerType}. 

        Unfortunately CSVMerge is deprecated and the authors no longer support it. The 
        authors encourage you to look into the new [ArchiveXL tool](https://www.nexusmods.com/cyberpunk2077/mods/4198).

        If you were attempting to install WolvenKit.Console (aka WolvenKit.CLI), this
        tool was only supported as a dependency of CSVMerge and also is no longer
        supported for installation to the game directory. Please consider installing
        this tool manually.`),
    },
    [{ label: `Understood!` }],
  );
};

export const showManualStepRequiredForToolInfo = (
  api: VortexApi,
  toolName: string,
): void => {
  api.showDialog(
    `info`,
    `Manual Step Required For ${toolName}`,
    {
      md: heredoc(`
        To finish installing ${toolName}, you need to first \`enable\` the mod,
        and then restart Vortex once the deployment is complete. Until you do this,
        the Tool will remain grayed out (which isn't a problem, you just can't use it!)

        Once you've restarted Vortex, you'll be able to use ${toolName} either directly
        through Vortex, or as you normally would.
      `),
    },
    [{ label: `Understood!` }],
  );
};

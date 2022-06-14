/* eslint-disable import/first */
import path from "path";
import {
  ARCHIVE_GIFTWRAPS,
  ARCHIVE_PREFIX,
  ARCHIVE_PREFIXES,
  ASI_PREFIX,
  ASI_PREFIXES,
  CET_GIFTWRAPS,
  CET_INIT,
  CET_PREFIX,
  CET_PREFIXES,
  copiedToSamePath,
  CORE_CET_FULL_PATH_DEPTH,
  CORE_CET_PREFIXES,
  createdDirectory,
  ExampleFailingMod,
  ExampleFailingModCategory,
  ExampleModCategory,
  ExamplePromptInstallableMod,
  ExamplePromptInstallableModCategory,
  ExampleSucceedingMod,
  expectedUserCancelMessageFor,
  expectedUserCancelMessageForHittingFallback,
  expectedUserCancelProtectedMessageFor,
  FAKE_MOD_NAME,
  FAKE_STAGING_PATH,
  mockedFsLayout,
  GAME_DIR,
  GIFTWRAP_PREFIX,
  MockFsDirItems,
  pathHierarchyFor,
  RED4EXT_GIFTWRAPS,
  RED4EXT_PREFIX,
  RED4EXT_PREFIXES,
  REDS_GIFTWRAPS,
  REDS_PREFIX,
  REDS_PREFIXES,
  TWEAK_XL_PATH,
  TWEAK_XL_PATHS,
} from "./utils.helper";

import {
  ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX,
  CONFIG_INI_MOD_BASEDIR,
  CONFIG_RESHADE_MOD_BASEDIR,
  CONFIG_RESHADE_MOD_SHADER_BASEDIR,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS,
  RED4EXT_KNOWN_NONOVERRIDABLE_DLLS,
  CONFIG_XML_MOD_PROTECTED_FILES,
  CONFIG_XML_MOD_BASEDIR,
  CONFIG_XML_MOD_PROTECTED_FILENAMES,
} from "../../src/installers.layouts";
import { InstallChoices } from "../../src/ui.dialogs";
import { InstallerType } from "../../src/installers.types";

//
// Mods
//

const CoreCetInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreCetInstall: {
      expectedInstallerType: InstallerType.CoreCET,
      inFiles: [
        ...CORE_CET_PREFIXES,
        path.join(`${GAME_DIR}/global.ini`),
        path.join(`${GAME_DIR}/LICENSE`),
        path.join(`${GAME_DIR}/version.dll`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks.asi`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks/ThirdParty_LICENSES`),
        path.join(`${GAME_DIR}/plugins/cyber_engine_tweaks/scripts/autoexec.lua`),
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

const CoreTweakXLInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreTweakXLInstallCanon: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`r6\\`),
        path.join(`red4ext\\`),
        path.join(`r6\\scripts\\`),
        path.join(`r6\\scripts\\TweakXL\\`),
        path.join(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        path.join(`r6\\tweaks\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
      ],
      outInstructions: [
        createdDirectory(`r6\\tweaks\\`), // This is a special case
        copiedToSamePath(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        copiedToSamePath(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
      ],
    },
  }),
);

const CoreTweakXLShouldFailOnInstallIfNotExactLayout = new Map<string, ExampleFailingMod>(
  Object.entries({
    coreTweakXLWithExtraFiles: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`r6\\`),
        path.join(`red4ext\\`),
        path.join(`r6\\scripts\\`),
        path.join(`r6\\scripts\\TweakXL\\`),
        path.join(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        path.join(`r6\\tweaks\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
        path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
        path.join(`archive\\pc\\mod\\tweakarchive.archive`),
      ],
      failure: `Didn't Find Expected TweakXL Installation!`,
      errorDialogTitle: `Didn't Find Expected TweakXL Installation!`,
    },
    coreTweakXLWithMissingFiles: {
      expectedInstallerType: InstallerType.CoreTweakXL,
      inFiles: [
        path.join(`r6\\`),
        path.join(`red4ext\\`),
        path.join(`r6\\scripts\\`),
        path.join(`r6\\scripts\\TweakXL\\`),
        path.join(`r6\\scripts\\TweakXL\\TweakXL.reds`),
        path.join(`r6\\tweaks\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\TweakXL\\`),
      ],
      failure: `Didn't Find Expected TweakXL Installation!`,
      errorDialogTitle: `Didn't Find Expected TweakXL Installation!`,
    },
  }),
);

const TweakXLMod = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    tweakXLWithFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        path.join(`${TWEAK_XL_PATH}\\myothertweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\myothertweak.yml`),
      ],
    },
    tweakXLWithFilesInSubdirsCanonical: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\sub1\\mytweak.yaml`),
        path.join(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
        path.join(`${TWEAK_XL_PATH}\\sub3\\sub4\\mythirdtweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub1\\mytweak.yaml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub3\\sub4\\mythirdtweak.yml`),
      ],
    },
    tweakXLWithFilesInBasedirAndSubdirsCanonical: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [
        ...TWEAK_XL_PATHS,
        path.join(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        path.join(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
      ],
      outInstructions: [
        copiedToSamePath(`${TWEAK_XL_PATH}\\mytweak.yaml`),
        copiedToSamePath(`${TWEAK_XL_PATH}\\sub2\\myothertweak.yml`),
      ],
    },
  }),
);

const TweakXLModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    tweakXLWithFileAtToplevelPromptsToInstallThroughFallback: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [path.join(`mytweak.yaml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`mytweak.yaml`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
    tweakXLWithIncorrectFileExtensionPromptsToInstallDirectly: {
      expectedInstallerType: InstallerType.TweakXL,
      inFiles: [path.join(`${TWEAK_XL_PATH}\\mytweak.xml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(`${TWEAK_XL_PATH}\\mytweak.xml`)],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.TweakXL),
    },
  }),
);

const CoreArchiveXLInstall = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    coreArchiveXLInstallCanon: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
      ],
      outInstructions: [copiedToSamePath(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`)],
    },
  }),
);

const CoreArchiveXLShouldFailOnInstallIfNotExactLayout = new Map<
  string,
  ExampleFailingMod
>(
  Object.entries({
    coreArchiveXLWithExtraFiles: {
      expectedInstallerType: InstallerType.CoreArchiveXL,
      inFiles: [
        path.join(`red4ext\\`),
        path.join(`red4ext\\plugins\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\`),
        path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
        path.join(`archive\\pc\\mod\\tweakarchive.archive`),
      ],
      failure: `Didn't Find Expected ArchiveXL Installation!`,
      errorDialogTitle: `Didn't Find Expected ArchiveXL Installation!`,
    },
  }),
);

const CoreRed4ExtInstall = new Map<string, ExampleSucceedingMod>(
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

const AsiMod = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    asiModWithCet: {
      expectedInstallerType: InstallerType.ASI,
      inFiles: [
        ...ASI_PREFIXES,
        `${ASI_PREFIX}/DiscordRPCHelper.asi`,
        `${ASI_PREFIX}/discord_game_sdk.dll`,
        ...CET_PREFIXES,
        `${CET_PREFIX}/CP77 Discord RPC/`,
        `${CET_PREFIX}/CP77 Discord RPC/${CET_INIT}`,
        `${CET_PREFIX}/CP77 Discord RPC/GameUI.lua`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(`${ASI_PREFIX}/DiscordRPCHelper.asi`),
          destination: path.normalize(`${ASI_PREFIX}/DiscordRPCHelper.asi`),
        },
        {
          type: "copy",
          source: path.normalize(`${ASI_PREFIX}/discord_game_sdk.dll`),
          destination: path.normalize(`${ASI_PREFIX}/discord_game_sdk.dll`),
        },
        {
          type: "copy",
          source: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/${CET_INIT}`),
          destination: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/GameUI.lua`),
          destination: path.normalize(`${CET_PREFIX}/CP77 Discord RPC/GameUI.lua`),
        },
      ],
    },
    standardAsiMod: {
      expectedInstallerType: InstallerType.ASI,
      inFiles: [...ASI_PREFIXES, `${ASI_PREFIX}/normal.asi`].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(`${ASI_PREFIX}/normal.asi`),
          destination: path.normalize(`${ASI_PREFIX}/normal.asi`),
        },
      ],
    },
  }),
);

const CetMod = new Map<string, ExampleSucceedingMod>(
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
        path.join(`${CET_PREFIX}/exmod/AdditionalSubFolder/Whoaonemore/init.lua`),
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
          source: path.join(`${CET_PREFIX}/exmod/AdditionalSubFolder/strangestuff.lua`),
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

const CetModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    cetModWithIniShouldPromptToInstall: {
      expectedInstallerType: InstallerType.Fallback,
      inFiles: [
        path.join(`exmod/`),
        path.join(`exmod/${CET_INIT}`),
        path.join(`exmod/some.ini`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`exmod\\${CET_INIT}`),
        copiedToSamePath(`exmod\\some.ini`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: `Fallback Installer: user chose to cancel installation`,
    },
  }),
);

const Red4ExtMod = new Map<string, ExampleSucceedingMod>(
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
    red4extIncludingNonRedsAndNonemptySubdirsCanonical: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/r4emod/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/subsies/`),
        path.join(`${RED4EXT_PREFIX}/r4emod/subsies/whoa.dll`),
        path.join(`${RED4EXT_PREFIX}/r4emod/subsies/totally.dude`),
        path.join(`${RED4EXT_PREFIX}/r4emod/emptysubs/`),
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
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/whoa.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/whoa.dll`),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/totally.dude`),
          destination: path.join(`${RED4EXT_PREFIX}/r4emod/subsies/totally.dude`),
        },
      ],
    },
    red4extWithDllsInBasedirIsFixableNameable: {
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
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/notascript.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/notascript.dll`),
        },
      ],
    },
    red4extWithFilesInBasedirANDSubdirsIeInCanonicalIsFixableNameable: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`${RED4EXT_PREFIX}/script.dll`),
        path.join(`${RED4EXT_PREFIX}/notcanonicalnow/`),
        path.join(`${RED4EXT_PREFIX}/notcanonicalnow/notascript.dll`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: "copy",
          source: path.join(`${RED4EXT_PREFIX}/notcanonicalnow/notascript.dll`),
          destination: path.join(
            `${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/notcanonicalnow/notascript.dll`,
          ),
        },
      ],
    },
    red4extWithFilesInToplevelAndMaybeSubdirsIsFixableModnamed: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`script.dll`),
        path.join(`notcanonicalnow/`),
        path.join(`notcanonicalnow/notascript.dll`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: "copy",
          source: path.join(`notcanonicalnow/notascript.dll`),
          destination: path.join(
            `${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/notcanonicalnow/notascript.dll`,
          ),
        },
      ],
    },
    red4extWithFilesInToplevelSubdirIsFixable: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        ...RED4EXT_PREFIXES,
        path.join(`notcanonicalnow/`),
        path.join(`notcanonicalnow/notascript.dll`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`notcanonicalnow/notascript.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/notcanonicalnow/notascript.dll`),
        },
      ],
    },
  }),
);

const Red4ExtModShouldFailInTest = new Map<string, ExampleFailingMod>([
  ...RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS.map(
    (dir: string): [string, ExampleFailingMod] => [
      `red4ext DLL in dangerous dir ${dir}`,
      {
        expectedInstallerType: InstallerType.Red4Ext,
        inFiles: [path.join(dir, "some.dll")],
        failure: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
        errorDialogTitle: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
      },
    ],
  ),
  ...RED4EXT_KNOWN_NONOVERRIDABLE_DLLS.map((dll: string): [string, ExampleFailingMod] => [
    `red4ext DLL with reserved name ${dll}`,
    {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [path.join(`bin/x64/scripties.dll`)],
      failure: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
      errorDialogTitle: `Red4Ext Mod Installation Canceled, Dangerous DLL paths!`,
    },
  ]),
]);

const Red4ExtModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    red4extWithMultipleSubdirsPromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        path.join(`subdir1/`),
        path.join(`subdir1/script1.dll`),
        path.join(`subdir2/`),
        path.join(`subdir2/script2.dll`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.join(`subdir1\\script1.dll`),
          destination: path.join(`subdir1\\script1.dll`),
        },
        {
          type: "copy",
          source: path.join(`subdir2\\script2.dll`),
          destination: path.join(`subdir2\\script2.dll`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Red4Ext),
    },
    red4extWithExtraArchivesInWrongPlacePromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Red4Ext,
      inFiles: [
        path.join(`subdir1/`),
        path.join(`subdir1/script1.dll`),
        path.join(`outtaplace.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.join(`subdir1\\script1.dll`),
          destination: path.join(`subdir1\\script1.dll`),
        },
        {
          type: "copy",
          source: path.join(`outtaplace.archive`),
          destination: path.join(`outtaplace.archive`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
  }),
);

const ArchiveMod = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    archiveWithSingleFileCanonical: {
      expectedInstallerType: InstallerType.Archive,
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
      expectedInstallerType: InstallerType.Archive,
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
      expectedInstallerType: InstallerType.Archive,
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
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        `${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/first.archive`,
        `${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/second.archive`,
      ].map(path.normalize),
      outInstructions: [
        {
          type: "copy",
          source: path.normalize(`${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/first.archive`),
          destination: path.normalize(`${ARCHIVE_PREFIX}/first.archive`),
        },
        {
          type: "copy",
          source: path.normalize(
            `${ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX}/second.archive`,
          ),
          destination: path.normalize(`${ARCHIVE_PREFIX}/second.archive`),
        },
      ],
    },
    archiveWithSingleArchiveToplevel: {
      expectedInstallerType: InstallerType.Archive,
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
      expectedInstallerType: InstallerType.Archive,
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
      expectedInstallerType: InstallerType.Archive,
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
      expectedInstallerType: InstallerType.Archive,
      inFiles: ["first.archive", "fold1/", "fold1/second.archive"].map(path.normalize),
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
      expectedInstallerType: InstallerType.Archive,
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
          destination: path.normalize(`${ARCHIVE_PREFIX}/fold1/thisisenough.md`),
        },
      ],
    },
    archiveXLWithFilesWithMatchingNamesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
      ],
    },
    archiveXLWithFilesWithDifferentNamesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\surprise.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
      ],
    },
    archiveXLWithMultipleFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
        path.join(`${ARCHIVE_PREFIX}\\surprise.xl`),
        path.join(`${ARCHIVE_PREFIX}\\surprise2.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise2.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
      ],
    },
    archiveXLWithMultipleArchivesOnlyInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}\\surprise.xl`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        path.join(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
      ],
      outInstructions: [
        copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchive.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\mybigarchif.archive`),
      ],
    },
    archiveXLWithoutArchiveFilesInCanonicalDir: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [...ARCHIVE_PREFIXES, path.join(`${ARCHIVE_PREFIX}\\surprise.xl`)],
      outInstructions: [copiedToSamePath(`${ARCHIVE_PREFIX}\\surprise.xl`)],
    },
  }),
);

const ArchiveOnlyModShouldPromptForInstall = new Map<string, ExamplePromptInstallableMod>(
  Object.entries({
    archiveWithToplevelAndCanonicalFilesPromptsOnConflictForFallback: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`outtaplace.archive`),
        path.join(`${ARCHIVE_PREFIX}/innaspot.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.join(`outtaplace.archive`),
          destination: path.join(`outtaplace.archive`),
        },
        {
          type: "copy",
          source: path.join(`${ARCHIVE_PREFIX}\\innaspot.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}\\innaspot.archive`),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Archive),
    },

    archiveWithCanonAndXlPromptsOnConflictForFallbackWhenExtraToplevels: {
      expectedInstallerType: InstallerType.Archive,
      inFiles: [
        ...ARCHIVE_PREFIXES,
        path.join(`outtaplace.archive`),
        path.join(`${ARCHIVE_PREFIX}/innaspot.archive.xl`),
        path.join(`${ARCHIVE_PREFIX}/innaspot.archive`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(`outtaplace.archive`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/innaspot.archive.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/innaspot.archive`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageFor(InstallerType.Archive),
    },
  }),
);

const ValidExtraArchivesWithType = new Map<string, ExampleSucceedingMod>(
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
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        copiedToSamePath(`${CET_PREFIX}/exmod/configfile.json`),
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/preemtextures.archive`),
      ],
    },
    cetWithExtraArchiveXLFilesOnlyCanonical: {
      expectedInstallerType: InstallerType.CET,
      inFiles: [
        ...CET_PREFIXES,
        path.join(`${CET_PREFIX}/exmod/`),
        path.join(`${CET_PREFIX}/exmod/Modules/`),
        path.join(`${CET_PREFIX}/exmod/configfile.json`),
        path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        path.join(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/preemtextures.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${CET_PREFIX}/exmod/Modules/UI.lua`),
        copiedToSamePath(`${CET_PREFIX}/exmod/configfile.json`),
        copiedToSamePath(`${CET_PREFIX}/exmod/${CET_INIT}`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/preemtextures.xl`),
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
        path.join(`${ARCHIVE_PREFIX}/magicgoesherebutbigger.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/options.json`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\magicgoesherebutbigger.xl`),
        copiedToSamePath(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
    },
    redsWithExtraArchiveXLFilesOnlyCanonical: {
      expectedInstallerType: InstallerType.Redscript,
      inFiles: [
        ...REDS_PREFIXES,
        path.join(`${REDS_PREFIX}/rexmod/`),
        path.join(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        path.join(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        path.join(`${REDS_PREFIX}/rexmod/options.json`),
        ...ARCHIVE_PREFIXES,
        path.join(`${ARCHIVE_PREFIX}/magicgoesherebutbigger.xl`),
      ],
      outInstructions: [
        copiedToSamePath(`${REDS_PREFIX}/rexmod/scriptiesyay.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/morescripties.reds`),
        copiedToSamePath(`${REDS_PREFIX}/rexmod/options.json`),
        copiedToSamePath(`${ARCHIVE_PREFIX}\\magicgoesherebutbigger.xl`),
      ],
    },
  }),
);

const ConfigXmlMod = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    configXmlWithRandomNameInCanonicalBasedirWillInstall: {
      expectedInstallerType: InstallerType.ConfigXml,
      inFiles: [path.join(`${CONFIG_XML_MOD_BASEDIR}\\dunnowhythisishere.xml`)],
      outInstructions: [
        copiedToSamePath(path.join(`${CONFIG_XML_MOD_BASEDIR}\\dunnowhythisishere.xml`)),
      ],
    },
  }),
);

const ConfigXmlModShouldPromptToInstall = new Map<string, ExamplePromptInstallableMod>([
  ...CONFIG_XML_MOD_PROTECTED_FILES.map(
    (xml: string): [string, ExamplePromptInstallableMod] => [
      `Protected XML file ${path.basename(xml)} in XML basedir prompts to install`,
      {
        expectedInstallerType: InstallerType.ConfigXml,
        inFiles: [path.join(xml)],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [copiedToSamePath(xml)],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageFor(
          InstallerType.ConfigXml,
        ),
      },
    ],
  ),
  ...CONFIG_XML_MOD_PROTECTED_FILENAMES.map(
    (xmlname: string): [string, ExamplePromptInstallableMod] => [
      `Protected XML file ${xmlname} in toplevel prompts to install into XML basedir`,
      {
        expectedInstallerType: InstallerType.ConfigXml,
        inFiles: [path.join(xmlname)],
        proceedLabel: InstallChoices.Proceed,
        proceedOutInstructions: [
          {
            type: `copy`,
            source: path.join(xmlname),
            destination: path.join(`${CONFIG_XML_MOD_BASEDIR}\\${xmlname}`),
          },
        ],
        cancelLabel: InstallChoices.Cancel,
        cancelErrorMessage: expectedUserCancelProtectedMessageFor(
          InstallerType.ConfigXml,
        ),
      },
    ],
  ),
  [
    `Config XML files when there's a combination of protected and non-protected canonical prompts to install`,
    {
      expectedInstallerType: InstallerType.ConfigXml,
      inFiles: [
        CONFIG_XML_MOD_PROTECTED_FILES[0],
        path.join(`${CONFIG_XML_MOD_BASEDIR}\\weeblewobble.xml`),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        copiedToSamePath(CONFIG_XML_MOD_PROTECTED_FILES[0]),
        copiedToSamePath(`${CONFIG_XML_MOD_BASEDIR}\\weeblewobble.xml`),
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelProtectedMessageFor(InstallerType.ConfigXml),
    },
  ],
  [
    `Config XML files with random XML file in toplevel prompts to install via Fallback`,
    {
      expectedInstallerType: InstallerType.ConfigXml,
      inFiles: [path.join(`myfancy.xml`)],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [copiedToSamePath(path.join(`myfancy.xml`))],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
  ],
]);

const iniFsMock: MockFsDirItems = mockedFsLayout({
  "myawesomeconfig.ini": "[Secret setting]\nFrogs=Purple",
  "serious.ini": "[super serious]\nWings=false",
  "superreshade.ini":
    "KeyPCGI_One@RadiantGI.fx=46,0,0,0\nPreprocessorDefinitions=SMOOTHNORMALS=1",
  fold1: {
    "myawesomeconfig.ini": "[Secret setting]\nFrogs=Purple",
    "serious.ini": "[super serious]\nWings=false",
    "superreshade.ini":
      "KeyPCGI_One@RadiantGI.fx=46,0,0,0\nPreprocessorDefinitions=SMOOTHNORMALS=1",
    "reshade-shaders": {
      Shaders: { "fancy.fx": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
      Textures: { "lut.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
    },
  },
  "reshade-shaders": {
    Shaders: { "fancy.fx": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
    Textures: { "lut.png": Buffer.from([8, 6, 7, 5, 3, 0, 9]) },
  },
});

const IniMod = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    iniWithSingleIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["myawesomeconfig.ini"].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("myawesomeconfig.ini"),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/myawesomeconfig.ini`),
        },
      ],
    },
    iniWithMultipleIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["myawesomeconfig.ini", "serious.ini"].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("myawesomeconfig.ini"),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/myawesomeconfig.ini`),
        },
        {
          type: "copy",
          source: path.normalize("serious.ini"),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/serious.ini`),
        },
      ],
    },
    iniWithReshadeIniAtRoot: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["superreshade.ini"].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: "copy",
          source: "superreshade.ini",
          destination: path.normalize(`${CONFIG_RESHADE_MOD_BASEDIR}/superreshade.ini`),
        },
      ],
    },
    iniWithSingleIniInRandomFolder: {
      expectedInstallerType: InstallerType.INI,
      inFiles: ["fold1/", "fold1/myawesomeconfig.ini"].map(path.normalize),
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/myawesomeconfig.ini"),
          destination: path.normalize(`${CONFIG_INI_MOD_BASEDIR}/myawesomeconfig.ini`),
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
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: "copy",
          source: "superreshade.ini",
          destination: path.normalize(`${CONFIG_RESHADE_MOD_BASEDIR}/superreshade.ini`),
        },
        {
          type: "copy",
          source: path.normalize("reshade-shaders/Shaders/fancy.fx"),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Shaders/fancy.fx`,
          ),
        },
        {
          type: "copy",
          source: path.normalize("reshade-shaders/Textures/lut.png"),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Textures/lut.png`,
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
      fsMocked: iniFsMock,
      outInstructions: [
        {
          type: "copy",
          source: path.normalize("fold1/superreshade.ini"),
          destination: path.normalize(`${CONFIG_RESHADE_MOD_BASEDIR}/superreshade.ini`),
        },
        {
          type: "copy",
          source: path.normalize("fold1/reshade-shaders/Shaders/fancy.fx"),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Shaders/fancy.fx`,
          ),
        },
        {
          type: "copy",
          source: path.normalize(`fold1/reshade-shaders/Textures/lut.png`),
          destination: path.normalize(
            `${CONFIG_RESHADE_MOD_SHADER_BASEDIR}/Textures/lut.png`,
          ),
        },
      ],
    },
  }), // object
);

const FallbackForNonMatchedAndInvalidShouldPromptForInstall = new Map<
  string,
  ExamplePromptInstallableMod
>(
  Object.entries({
    invalidModContainingJustAnExe: {
      expectedInstallerType: InstallerType.Fallback,
      inFiles: [path.normalize("bin/myProg.exe")],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.normalize("bin/myProg.exe"),
          destination: path.normalize("bin/myProg.exe"),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
    invalidModContainingRandomFiles: {
      expectedInstallerType: InstallerType.Fallback,
      inFiles: ["Categorized AIO Command List.xlsx", "readme.md"],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.normalize("Categorized AIO Command List.xlsx"),
          destination: path.normalize("Categorized AIO Command List.xlsx"),
        },
        {
          type: "copy",
          source: path.normalize("readme.md"),
          destination: path.normalize("readme.md"),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
    invalidModWithDeepInvalidPath: {
      expectedInstallerType: InstallerType.Fallback,
      inFiles: [
        ...pathHierarchyFor(FAKE_STAGING_PATH),
        path.join(FAKE_STAGING_PATH, "toodles.txt"),
      ],
      proceedLabel: InstallChoices.Proceed,
      proceedOutInstructions: [
        {
          type: "copy",
          source: path.join(FAKE_STAGING_PATH, "toodles.txt"),
          destination: path.join(FAKE_STAGING_PATH, "toodles.txt"),
        },
      ],
      cancelLabel: InstallChoices.Cancel,
      cancelErrorMessage: expectedUserCancelMessageForHittingFallback,
    },
  }), // object
);

const GiftwrappedModsFixable = new Map<string, ExampleSucceedingMod>(
  Object.entries({
    multipleModtypesWrappedAreUnwrappedFixable: {
      expectedInstallerType: InstallerType.MultiType,
      inFiles: [
        ...CET_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${CET_PREFIX}/exmod/${CET_INIT}`),
        ...REDS_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${REDS_PREFIX}/rexmod/script.reds`),
        ...RED4EXT_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${RED4EXT_PREFIX}/script.dll`),
        ...ARCHIVE_GIFTWRAPS,
        path.join(`${GIFTWRAP_PREFIX}/${ARCHIVE_PREFIX}/magicgoeshere.archive`),
      ],
      outInstructions: [
        {
          type: "copy",
          source: path.join(`${GIFTWRAP_PREFIX}/${CET_PREFIX}/exmod/${CET_INIT}`),
          destination: path.join(`${CET_PREFIX}/exmod/${CET_INIT}`),
        },
        {
          type: "copy",
          source: path.join(`${GIFTWRAP_PREFIX}/${REDS_PREFIX}/rexmod/script.reds`),
          destination: path.join(`${REDS_PREFIX}/rexmod/script.reds`),
        },
        {
          type: "copy",
          source: path.join(`${GIFTWRAP_PREFIX}/${RED4EXT_PREFIX}/script.dll`),
          destination: path.join(`${RED4EXT_PREFIX}/${FAKE_MOD_NAME}/script.dll`),
        },
        {
          type: "copy",
          source: path.join(`${GIFTWRAP_PREFIX}/${ARCHIVE_PREFIX}/magicgoeshere.archive`),
          destination: path.join(`${ARCHIVE_PREFIX}/magicgoeshere.archive`),
        },
      ],
    },
  }),
);

//
// And then the already-split-up types
//

import AmmCore from "./mods.example.core.amm";
import RedscriptCore from "./mods.example.core.redscript";
import MultiTypeMod from "./mods.example.multitype";
import JsonMod from "./mods.example.config.json";
import AmmMod from "./mods.example.amm";
import RedscriptMod from "./mods.example.redscript";
import CyberCatCore from "./mods.example.core.cybercat";
import DeprecatedTools from "./mods.example.deprecated";
import ExtraFiles from "./mods.example.special.extrafiles";

export const AllExpectedSuccesses = new Map<string, ExampleModCategory>(
  Object.entries({
    CoreAmmInstallShouldSucceed: AmmCore.AllExpectedSuccesses,
    CoreCetInstall,
    CoreRedscriptInstallShouldSucceed: RedscriptCore.AllExpectedSuccesses,
    CoreRed4ExtInstall,
    CoreCyberCatInstall: CyberCatCore.AllExpectedSuccesses,
    CoreTweakXLInstall,
    MultiTypeInstallShouldSucceed: MultiTypeMod.AllExpectedSuccesses,
    ConfigXmlMod,
    ConfigJsonModInstallShouldSucceed: JsonMod.AllExpectedSuccesses,
    TweakXLMod,
    CoreArchiveXLInstall,
    AsiMod,
    AmmModInstallShouldSucceed: AmmMod.AllExpectedSuccesses,
    CetMod,
    RedscriptModInstallShouldSucceed: RedscriptMod.AllExpectedSuccesses,
    Red4ExtMod,
    IniMod,
    ArchiveOnly: ArchiveMod,
    ValidExtraArchivesWithType,
    GiftwrappedModsFixable,
    ExtraFiles: ExtraFiles.AllExpectedSuccesses,
  }),
);

export const AllExpectedDirectFailures = new Map<string, ExampleFailingModCategory>(
  Object.entries({
    CoreAmmInstallShouldFailDirectly: AmmCore.AllExpectedDirectFailures,
    CoreCyberCatShouldFailDirectly: CyberCatCore.AllExpectedDirectFailures,
    CoreTweakXLShouldFailOnInstallIfNotExactLayout,
    CoreArchiveXLShouldFailOnInstallIfNotExactLayout,
    MultiTypeModShouldFailDirectly: MultiTypeMod.AllExpectedDirectFailures,
    ConfigJsonModShouldFailDirectly: JsonMod.AllExpectedDirectFailures,
    Red4ExtModShouldFailInTest,
    AmmModInstallShouldFailDirectly: AmmMod.AllExpectedDirectFailures,
    DeprecatedToolsShouldFailDirectly: DeprecatedTools.AllExpectedDirectFailures,
  }),
);

export const AllExpectedInstallPromptables = new Map<
  string,
  ExamplePromptInstallableModCategory
>(
  Object.entries({
    CoreAmmModShouldPromptForInstall: AmmCore.AllExpectedPromptInstalls,
    MultiTypeModShouldPromptForInstall: MultiTypeMod.AllExpectedPromptInstalls,
    ConfigXmlModShouldPromptToInstall,
    ConfigJsonModShouldPromptForInstall: JsonMod.AllExpectedPromptInstalls,
    AmmModShouldPromptForInstall: AmmMod.AllExpectedPromptInstalls,
    CetModShouldPromptForInstall,
    RedscriptModShouldPromptForInstall: RedscriptMod.AllExpectedPromptInstalls,
    Red4ExtModShouldPromptForInstall,
    TweakXLModShouldPromptForInstall,
    ArchiveOnlyModShouldPromptForInstall,
    FallbackForNonMatchedAndInvalidShouldPromptForInstall,
  }),
);

import path from "path";
import { FileTree } from "./filetree";
import { EXTENSION_NAME_INTERNAL } from "./index.metadata";
import { InstallerType } from "./installers.types";
import { VortexApi, VortexInstruction } from "./vortex-wrapper";

/** Correct Directory structure:
 * root_folder
 * |-📁 archive
 * | |-📁 pc
 * | | |-📁 mod
 * | | | |- 📄 *.archive
 * | | | |- 📄 *.xl
 * |-📁 bin
 * | |-📁 x64
 * | | |-📄 *.ini -- Reshade mods
 * | | |-📁 reshade-shaders
 * | | |-📁 plugins
 * | | | |- 📄 *.asi
 * | | | |-📁 cyber_engine_tweaks
 * | | | | |-📁 mods
 * | | | | | |-📁 SomeMod
 * | | | | | | |- 📄 init.lua
 * | | | | | | |- Whatever structure the mod wants
 * |-📁 engine
 * | |-📁 config
 * | | |-📄 giweights.json
 * | | |-📁 platform
 * | | | |-📁 pc
 * | | | | |-📄 *.ini
 * |-📁 r6
 * | |-📁 config
 * | | |-📄 bumperSettings.json
 * | | |-📄 inputContexts.xml
 * | | |-📄 inputDeadzones.xml
 * | | |-📄 inputUserMappings.xml
 * | | |-📄 uiInputActions.xml
 * | | |-📄 *.xml
 * | | |-📁 settings
 * | | | |-📄 options.json
 * | | | |-📁 platform
 * | | | | |-📁 pc
 * | | | | | |-📄 options.json
 * | |-📁 scripts
 * | | |-📁 SomeMod
 * | | | |-📄 *.reds
 * | |-📁 tweaks
 * | | |-📄 *.yaml
 * | | |-📁 SomeMod
 * | | | |-📄 *.yaml
 * |-📁 red4ext
 * | |-📁 plugins
 * | | |-📄 *.dll
 * | | |-📁 SomeMod
 * | | | |-📄 *.dll
 */

//
// Common stuff

export const KNOWN_TOPLEVEL_DIRS = [`archive`, `bin`, `engine`, `r6`, `red4ext`];

export const isKnownToplevelDir = (filePath: string): boolean =>
  KNOWN_TOPLEVEL_DIRS.includes(filePath.split(path.sep)[0]);

// The order approximates some likelihood of a match
export const MODS_EXTRA_FILETYPES_ALLOWED_IN_ANY_MOD = [
  `.md`,
  `.txt`,
  `.pdf`,
  `.png`,
  `.jpg`,
  `.webp`,
  `.gif`,
  `.svg`,
  `.odt`,
  `.rtf`,
  `.doc`,
];

const MODS_EXTRA_FILETYPES_AS_STRING = MODS_EXTRA_FILETYPES_ALLOWED_IN_ANY_MOD.map(
  (extension) => `*.${extension}`,
).join(`, `);

export const MODS_EXTRA_BASEDIR = path.join(
  `.\\${EXTENSION_NAME_INTERNAL}\\mod-extra-files\\`,
);

export const enum ExtraFilesLayout {
  Toplevel = `
              - .\\[any allowed extra filetype]
              - .\\[any non-reserved subdir]\\[any allowed extra filetype]
              `,
}

//
// Giftwrapped

export const enum GiftwrapLayout {
  ExtraToplevelDir = `.\\**\\[any dir that should be toplevel: archive, bin, engine, r6, red4ext]`,
}

//
// Fallback

export const enum FallbackLayout {
  LooksSafe = `.\\**\\* - everything in this mod, and we've checked things we know to be risky`,
  Unvalidated = `.\\**\\* - everything in this mod, but nothing has been validated`,
}

// Archives

export const enum ArchiveLayout {
  XL = `.\\archive\\pc\\mod\\*.xl, *.archive`, // Required layout per https://github.com/psiberx/cp2077-archive-xl
  Canon = `.\\archive\\pc\\mod\\*.archive`,
  Heritage = `.\\archive\\pc\\patch\\*.archive`,
  Other = `.\\**\\*.archive + [any files + subdirs] (NOTE! These may not work without manual selection)`,
}

export const enum ExtraArchiveLayout {
  Toplevel = `
    .\\*.xl, *.archive
  `,
}

//
// ArchiveXL Mods
//

export const ARCHIVE_MOD_FILE_EXTENSION = ".archive";
export const ARCHIVE_MOD_XL_EXTENSION = `.xl`;
export const ARCHIVE_MOD_EXTENSIONS = [
  ARCHIVE_MOD_FILE_EXTENSION,
  ARCHIVE_MOD_XL_EXTENSION,
];

export const ARCHIVE_MOD_CANONICAL_PREFIX = path.normalize("archive/pc/mod/");
export const ARCHIVE_MOD_TRADITIONAL_WRONG_PREFIX = path.normalize("archive/pc/patch/");

//
// Core installers
//

//
// Core TweakXL

export const enum CoreTweakXLLayout {
  OnlyValid = `
              - .\\r6\\scripts\\TweakXL\\TweakXL.reds
              - .\\r6\\tweaks\\                       (note, empty directory is an exception)
              - .\\red4ext\\plugins\\TweakXL\\TweakXL.dll
              `,
}

export const TWEAK_XL_CORE_FILES = [
  path.join(`r6\\scripts\\TweakXL\\TweakXL.reds`),
  path.join(`red4ext\\plugins\\TweakXL\\TweakXL.dll`),
];

//
// TweakXL Mods
//

// This is the required layout, so enforce it
//
// https://github.com/psiberx/cp2077-tweak-xl/wiki/YAML-Tweaks

export const enum TweakXLLayout {
  Canon = `
          - .\\r6\\tweaks\\[*.yaml, *.yml]
          - .\\r6\\tweaks\\[any subdirs]\\[*.yaml, *.yml]
          `,
}

export const TWEAK_XL_MOD_CANONICAL_PATH_PREFIX = path.join(`r6\\tweaks\\`);
export const TWEAK_XL_MOD_CANONICAL_EXTENSIONS = [`.yaml`, `.yml`];

//
// Core ArchiveXL
//

export const enum CoreArchiveXLLayout {
  OnlyValid = `
          - .\\red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll
          `,
}

export const ARCHIVE_XL_CORE_FILES = [
  path.join(`red4ext\\plugins\\ArchiveXL\\ArchiveXL.dll`),
];

//
// Config mods of all sorts
//

// XML

export const enum ConfigXmlLayout {
  Protected = `
              .\\r6\\config\\{inputContexts,inputDeadzones,inputUserMappings,uiInputActions}.xml
              | - .\\r6\\config\\*.xml
              `,
  Canon = `
          .\\r6\\config\\*.xml
          `,
  Toplevel = `
            .\\{inputContexts,inputDeadzones,inputUserMappings,uiInputActions}.xml
            | - .\\*.xml
            `,
}

export const CONFIG_XML_MOD_BASEDIR = path.join(`r6\\config\\`);

export const CONFIG_XML_MOD_EXTENSION = `.xml`;

export const CONFIG_XML_MOD_PROTECTED_FILES = [
  path.join(`${CONFIG_XML_MOD_BASEDIR}\\inputContexts.xml`),
  path.join(`${CONFIG_XML_MOD_BASEDIR}\\inputDeadzones.xml`),
  path.join(`${CONFIG_XML_MOD_BASEDIR}\\inputUserMappings.xml`),
  path.join(`${CONFIG_XML_MOD_BASEDIR}\\uiInputActions.xml`),
];

export const CONFIG_XML_MOD_PROTECTED_FILENAMES = CONFIG_XML_MOD_PROTECTED_FILES.map(
  (xml) => path.basename(xml),
);

// JSON

export const enum ConfigJsonLayout {
  Protected = `
              - .\\engine\\config\\giweights.json
              - .\\r6\\config\\bumpersSettings.json
              - .\\r6\\config\\settings\\options.json
              - .\\r6\\config\\settings\\platform\\pc\\options.json
              `,
  Toplevel = `
            - .\\[any of the protected JSON filenames] (moved to canonical path)
            `,
}

export const CONFIG_JSON_MOD_EXTENSION = ".json";

export const CONFIG_JSON_MOD_ENGINE_BASEDIR = path.join(`engine\\config\\`);
export const CONFIG_JSON_MOD_BASEDIR = path.join(`r6\\config\\`);
export const CONFIG_JSON_MOD_BASEDIR_SETTINGS = path.join(`r6\\config\\settings\\`);
export const CONFIG_JSON_MOD_BASEDIR_PLATFORM = path.join(
  `r6\\config\\settings\\platform\\pc\\`,
);

export const CONFIG_JSON_MOD_KNOWN_FILES = {
  "giweights.json": path.join(CONFIG_JSON_MOD_ENGINE_BASEDIR, `giweights.json`),
  "bumpersSettings.json": path.join(CONFIG_JSON_MOD_BASEDIR, `bumpersSettings.json`),
};

export const CONFIG_JSON_MOD_FIXABLE_FILENAMES_TO_PATHS = CONFIG_JSON_MOD_KNOWN_FILES;
export const CONFIG_JSON_MOD_UNFIXABLE_FILENAMES = [`options.json`];

export const CONFIG_JSON_MOD_PROTECTED_DIRS = [
  CONFIG_JSON_MOD_ENGINE_BASEDIR,
  CONFIG_JSON_MOD_BASEDIR,
  CONFIG_JSON_MOD_BASEDIR_SETTINGS,
  CONFIG_JSON_MOD_BASEDIR_PLATFORM,
];

export const CONFIG_JSON_MOD_PROTECTED_FILES = [
  ...Object.values(CONFIG_JSON_MOD_KNOWN_FILES),
  path.join(`${CONFIG_JSON_MOD_BASEDIR_SETTINGS}\\options.json`),
  path.join(`${CONFIG_JSON_MOD_BASEDIR_PLATFORM}\\options.json`),
];

export const CONFIG_JSON_MOD_PROTECTED_FILENAMES = CONFIG_JSON_MOD_PROTECTED_FILES.map(
  (protectedPath) => path.basename(protectedPath),
);

// INI (these are generally non-overriding)

export const CONFIG_INI_MOD_BASEDIR = path.join("engine", "config", "platform", "pc");
export const CONFIG_INI_MOD_EXTENSION = ".ini";

export const CONFIG_RESHADE_MOD_BASEDIR = path.join("bin", "x64");
export const CONFIG_RESHADE_MOD_SHADER_DIRNAME = "reshade-shaders";
export const CONFIG_RESHADE_MOD_SHADER_BASEDIR = path.join(
  CONFIG_RESHADE_MOD_BASEDIR,
  CONFIG_RESHADE_MOD_SHADER_DIRNAME,
);

// ASI

export const enum AsiLayout {
  Canon = `.\\bin\\x64\\plugins\\*.asi + [any files + subdirs]`,
}

// CET

export const enum CetLayout {
  Canon = `.\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\[modname]\\init.lua + [any files + subdirs]`,
}
export const CET_GLOBAL_INI = path.normalize("bin/x64/global.ini");
export const CET_MOD_CANONICAL_INIT_FILE = "init.lua";
export const CET_MOD_CANONICAL_PATH_PREFIX = path.normalize(
  "bin/x64/plugins/cyber_engine_tweaks/mods",
);

// AMM is a special case of CET

export const AMM_BASEDIR_PATH = path.join(
  CET_MOD_CANONICAL_PATH_PREFIX,
  `AppearanceMenuMod`,
);

export const AMM_CORE_PLACEHOLDER_FILENAME = `vortex_needs_this.txt`;

export const enum CoreAmmLayout {
  OnlyValid = `
              CET:

              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\init.lua
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\db.sqlite3
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\API.lua
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\Custom Appearances\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\Custom Entities\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\Custom Props\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Themes\\Default.json
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Decor\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Decor\\Backup\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Locations\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Scripts\\[placeholder]
              - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Themes\\[placeholder]

              Archives:

              - .\\archive\\pc\\mod\\basegame_AMM_Props.archive
              - .\\archive\\pc\\mod\\basegame_AMM_requirement.archive
              `,
}

// Let's keep this very simple? Alternative would be to require
// a specific layout including the submod dirs, but… that seems
// not super future proof. It would at least have to be versioned.
//
// The upside of speccing more tightly would be that we could
// maybe control and validate the install better. But I think
// it's probably better to just leave that to AMM itself and
// focus maybe only on protected paths etc.
//
export const AMM_CORE_REQUIRED_CET_PATHS = [
  path.join(`${AMM_BASEDIR_PATH}/init.lua`),
  path.join(`${AMM_BASEDIR_PATH}/db.sqlite3`),
  path.join(`${AMM_BASEDIR_PATH}/Collabs/API.lua`),
];

export const AMM_CORE_REQUIRED_ARCHIVE_PATHS = [
  path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\basegame_AMM_Props.archive`),
  path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\basegame_AMM_requirement.archive`),
];

export const AMM_CORE_REQUIRED_PATHS = [
  ...AMM_CORE_REQUIRED_CET_PATHS,
  ...AMM_CORE_REQUIRED_ARCHIVE_PATHS,
];

export const AMM_MOD_BASEDIR_PATH = AMM_BASEDIR_PATH;

//
// AMM Mods
//

export const enum AmmLayout {
  Canon = `
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\Custom Appearances\\*.lua + [any files or subdirs]
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\Custom Entities\\*.lua + [any files or subdirs]
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\Collabs\\Custom Props\\*.lua + [any files or subdirs]
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Decor\\*.json + [any files or subdirs]
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Locations\\*.json + [any files or subdirs]
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Scripts\\*.json + [any files or subdirs]
    - .\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\AppearanceMenuMod\\User\\Themes\\*.json + [any files or subdirs]
    `,
  ToplevelCanonSubdir = `
    - .\\Collabs\\Custom Appearances\\*.lua + [any files or subdirs]
    - .\\Collabs\\Custom Entities\\*.lua + [any files or subdirs]
    - .\\Collabs\\Custom Props\\*.lua + [any files or subdirs]
    - .\\User\\Decor\\*.json + [any files or subdirs]
    - .\\User\\Locations\\*.json + [any files or subdirs]
    - .\\User\\Scripts\\*.json + [any files or subdirs]
    - .\\User\\Themes\\*.json + [any files or subdirs]
  `,
  Toplevel = `
    - .\\[*.json or *.lua files that can be validated to be AMM format]
  `,
}

export const AMM_MOD_COLLAB_LUA_EXTENSION = `.lua`;
export const AMM_MOD_USERMOD_JSON_EXTENSION = `.json`;

export const AMM_MOD_CUSTOMS_DIRNAME = `Collabs`;
export const AMM_MOD_USERMOD_DIRNAME = `User`;

export const AMM_MOD_CUSTOMS_CANON_DIR = path.join(
  AMM_BASEDIR_PATH,
  AMM_MOD_CUSTOMS_DIRNAME,
);
export const AMM_MOD_USERMOD_CANON_DIR = path.join(
  AMM_BASEDIR_PATH,
  AMM_MOD_USERMOD_DIRNAME,
);

export const AMM_MOD_CUSTOM_APPEARANCES_CANON_DIR = path.join(
  `${AMM_MOD_CUSTOMS_CANON_DIR}\\Custom Appearances`,
);

export const AMM_MOD_APPEARANCES_REQUIRED_MATCHES = [
  /modder\s*=/,
  /unique_identifier\s*=/,
  /entity_id\s*=/,
  /appearances\s*=/,
];

export const AMM_MOD_CUSTOM_ENTITIES_CANON_DIR = path.join(
  `${AMM_MOD_CUSTOMS_CANON_DIR}\\Custom Entities`,
);

export const AMM_MOD_ENTITIES_REQUIRED_MATCHES = [
  /modder\s*=/,
  /unique_identifier\s*=/,
  /entity_info\s*=/,
];

export const AMM_MOD_CUSTOM_PROPS_CANON_DIR = path.join(
  `${AMM_MOD_CUSTOMS_CANON_DIR}\\Custom Props`,
);

export const AMM_MOD_PROPS_REQUIRED_MATCHES = [
  /modder\s*=/,
  /unique_identifier\s*=/,
  /props\s*=/,
];

export const AMM_MOD_DECOR_CANON_DIR = path.join(`${AMM_MOD_USERMOD_CANON_DIR}\\Decor`);

export const AMM_MOD_DECOR_REQUIRED_KEYS = [`name`, `props`, `lights`];

export const AMM_MOD_LOCATIONS_CANON_DIR = path.join(
  `${AMM_MOD_USERMOD_CANON_DIR}\\Locations`,
);

export const AMM_MOD_LOCATION_REQUIRED_KEYS = [`x`, `y`, `z`];

export const AMM_MOD_SCRIPTS_CANON_DIR = path.join(
  `${AMM_MOD_USERMOD_CANON_DIR}\\Scripts`,
);

export const AMM_MOD_SCRIPT_REQUIRED_KEYS = [`title`, `actors`];

export const AMM_MOD_THEMES_CANON_DIR = path.join(`${AMM_MOD_USERMOD_CANON_DIR}\\Themes`);

export const AMM_MOD_THEME_REQUIRED_KEYS = [`Text`, `Border`];

//
// Redscript
//

export const enum RedscriptLayout {
  Canon = `.\\r6\\scripts\\[modname]\\[*.reds, any files + subdirs]`,
  Basedir = `.\\r6\\scripts\\*.reds + [any files + subdirs]`,
  Toplevel = `.\\*.reds + [any files + subdirs]`,
}

export const REDS_MOD_CANONICAL_EXTENSION = ".reds";
export const REDS_MOD_CANONICAL_PATH_PREFIX = path.normalize("r6/scripts");

//
// Red4Ext
//

export const enum Red4ExtLayout {
  Canon = `.\\red4ext\\plugins\\[modname]\\[*.dll, any files or subdirs]`,
  Basedir = `.\\red4ext\\plugins\\[*.dll, any files or subdirs]`,
  Modnamed = `.\\[modname]\\[*.dll, any files or subdirs]`,
  Toplevel = `.\\[*.dll, any files or subdirs]`,
}

export const RED4EXT_MOD_CANONICAL_EXTENSION = ".dll";
export const RED4EXT_MOD_CANONICAL_BASEDIR = path.normalize("red4ext/plugins/");

export const RED4EXT_CORE_RED4EXT_DLL = path.join(`red4ext\\RED4ext.dll`);

export const RED4EXT_KNOWN_NONOVERRIDABLE_DLLS = [
  path.join(`clrcompression.dll`),
  path.join(`clrjit.dll`),
  path.join(`coreclr.dll`),
  path.join(`D3DCompiler_47_cor3.dll`),
  path.join(`mscordaccore.dll`),
  path.join(`PenImc_cor3.dll`),
  path.join(`PresentationNative_cor3.dll`),
  path.join(`vcruntime140_cor3.dll`),
  path.join(`wpfgfx_cor3.dll`),
];

export const RED4EXT_KNOWN_NONOVERRIDABLE_DLL_DIRS = [path.join(`bin\\x64\\`)];

// ASI

export const ASI_MOD_EXT = ".asi";
export const ASI_MOD_PATH = path.join("bin", "x64", "plugins");

//
//
// Full descriptions
//
//

// There's probably some way to make this type-level AND indexable
// but for now just gonna check and raise if the description is missing.
export const LayoutDescriptions = new Map<InstallerType, string>([
  [
    InstallerType.CoreTweakXL,
    `
    \`${CoreTweakXLLayout.OnlyValid}\`

    This is the only possible valid layout for ${InstallerType.CoreTweakXL} that I know of.
    `,
  ],
  [
    InstallerType.CoreArchiveXL,
    `
    \`${CoreArchiveXLLayout.OnlyValid}\`

    This is the only possible valid layout for ${InstallerType.CoreArchiveXL} that I know of.
    `,
  ],
  [
    InstallerType.CoreAmm,
    `
    ${CoreAmmLayout.OnlyValid}

    This is the only possible valid layout for ${InstallerType.CoreAmm} that I know of.
    `,
  ],
  [
    InstallerType.AMM,
    `
    Any combination of the below canonical layouts (including any canonical Archives)

    ${AmmLayout.Canon}
    ${ArchiveLayout.Canon}

    Alternatively, any combination of the below toplevel layouts (including toplevel Archives)

    ${AmmLayout.ToplevelCanonSubdir}
    ${AmmLayout.Toplevel}
    ${ArchiveLayout.Other}
    `,
  ],
  [
    InstallerType.ConfigJson,
    `
    ${ConfigJsonLayout.Protected}
    ${ConfigJsonLayout.Toplevel}

    These JSON files are the only known working and valid ones, and they are protected
    because they may contain multiple modifications. There's a prompt before installing
    any of these files.
    `,
  ],
  [
    InstallerType.ConfigXml,
    `
    - \`${ConfigXmlLayout.Protected}\` (Protected)
    - \`${ConfigXmlLayout.Canon}\` (Can be mixed with above)
    - \`${ConfigXmlLayout.Toplevel}\` (Protected, can be moved to canonical)

    Some of the XML config files are protected, because they often contain modifications
    by the user. There's a prompt before installing into those paths.
    `,
  ],
  [
    InstallerType.TweakXL,
    `
    \`${TweakXLLayout.Canon}\`
    `,
  ],
  [
    InstallerType.Redscript,
    `
    - \`${RedscriptLayout.Canon}\` (Canonical)
    | - \`${ArchiveLayout.Canon}\`
    | - \`${ArchiveLayout.Heritage}\`
    - \`${RedscriptLayout.Basedir}\`  (Can be fixed to canonical)
    | - \`${ArchiveLayout.Canon}\`
    | - \`${ArchiveLayout.Heritage}\`
    `,
  ],
  [
    InstallerType.Red4Ext,
    `
    - \`${Red4ExtLayout.Canon}\` (Canonical)
    | - \`${ArchiveLayout.Canon}\`
    | - \`${ArchiveLayout.Heritage}\`
    - \`${Red4ExtLayout.Basedir}\` (Can be fixed to canonical)
    | - \`${ArchiveLayout.Canon}\`
    | - \`${ArchiveLayout.Heritage}\`
    - \`${Red4ExtLayout.Modnamed}\` (Can be fixed to canonical)
    | - \`${ArchiveLayout.Canon}\`
    | - \`${ArchiveLayout.Heritage}\`
    - \`${Red4ExtLayout.Toplevel}\` (Can be fixed to canonical)
    | - (No other files allowed)
    `,
  ],
  [
    InstallerType.Archive,
    `
    - \`${ArchiveLayout.XL}\` (Canonical, with ArchiveXL)
    - \`${ArchiveLayout.Canon}\` (Canonical)
    - \`${ArchiveLayout.Heritage}\` (Old style, fixable to Canon)
    - \`${ArchiveLayout.Other}\`
    `,
  ],
  [
    InstallerType.MultiType,
    `
    - \`${ConfigJsonLayout.Protected}\`
    - One of
    | - \`${ConfigXmlLayout.Protected}\`
    | - \`${ConfigXmlLayout.Canon}\`
    - \`${CetLayout.Canon}\`
    - One of
    | - \`${RedscriptLayout.Canon}\`
    | - \`${RedscriptLayout.Basedir}\`
    - One of
    | - \`${Red4ExtLayout.Canon}\`
    | - \`${Red4ExtLayout.Basedir}\`
    - One of
    | - \`${ArchiveLayout.XL}\`
    | - \`${ArchiveLayout.Canon}\`
    | - \`${ArchiveLayout.Heritage}\`

    - (No files can exist outside the above locations)

    For separate mod types I can make better guesses and support
    more fixable cases than I can here.
    `,
  ],
  [
    InstallerType.SpecialExtraFiles,
    `
    - \`${ExtraFilesLayout.Toplevel}\`

    Some mods may contain extra files, usually documentation or pictures. If
    the files aren't located in a place where the appropriate mod type installer
    can handle them, I'll move them to \`.\\${MODS_EXTRA_BASEDIR}\\[mod name]\\\`
    so they're easy to find and don't clutter up the game dir.

    The allowed extra file extensions are:

    ${MODS_EXTRA_FILETYPES_AS_STRING}
    `,
  ],
  [
    InstallerType.Fallback,
    `
    - \`${FallbackLayout.Unvalidated}\`

    This is the fallback installer. That means I can install anything.
    `,
  ],
]);

// Layouts to instructions

export const enum NoLayout {
  Optional = "it's a valid result that nothing was found",
}

export type Layout =
  | CoreAmmLayout
  | ConfigJsonLayout
  | ConfigXmlLayout
  | AsiLayout
  | AmmLayout
  | CetLayout
  | RedscriptLayout
  | Red4ExtLayout
  | TweakXLLayout
  | ArchiveLayout
  | FallbackLayout
  | GiftwrapLayout
  | ExtraArchiveLayout
  | ExtraFilesLayout
  | NoLayout;

export const enum NoInstructions {
  NoMatch = "attempted layout didn't match",
}

// Should really refactor these into NoInstructions
export const enum InvalidLayout {
  Conflict = "can't determine what the intended layout is, conflicting files",
}

export const enum NotAllowed {
  CanceledByUser = `user didn't permit using these instructions when prompted`,
}

export type Instructions = {
  kind: Layout;
  instructions: VortexInstruction[];
};

export type MaybeInstructions = Instructions | NoInstructions | InvalidLayout;
export type PromptedOptionalInstructions = Instructions | NotAllowed;

export type LayoutToInstructions = (
  api: VortexApi,
  modName: string,
  fileTree: FileTree,
) => MaybeInstructions;

export type LayoutDetectFunc = (fileTree: FileTree) => boolean;
export type LayoutFindFilesFunc = (fileTree: FileTree) => string[];

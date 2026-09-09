import path from "path";
import {
  AMM_BASEDIR_PATH,
  AMM_CORE_IDENTIFIER,
  AMM_CORE_PLACEHOLDER_FILENAME,
  ARCHIVE_MOD_CANONICAL_PREFIX,
} from "../../src/installers.layouts";
import { InstallerType } from "../../src/installers.types";
import {
  ExamplesForType,
  ExampleSucceedingMod,
  ExampleFailingMod,
  ExamplePromptInstallableMod,
  pathHierarchyFor,
  copiedToSamePath,
  mergeOrFailOnConflict,
} from "./utils.helper";

const AMM_BASE_PREFIXES = pathHierarchyFor(AMM_BASEDIR_PATH);

// This isn’t quite exhaustive, but covers all existing dirs at least.
const AMM_CORE_PATHS = [
  path.join(`${AMM_BASEDIR_PATH}/credits.lua`),
  path.join(`${AMM_BASEDIR_PATH}/db.sqlite3`),
  path.join(`${AMM_BASEDIR_PATH}/init.lua`),
  path.join(`${AMM_BASEDIR_PATH}/update_notes.lua`),
  path.join(`${AMM_BASEDIR_PATH}/Collabs/API.lua`),
  path.join(
    `${AMM_BASEDIR_PATH}/Collabs/Custom Appearances/${AMM_CORE_PLACEHOLDER_FILENAME}`,
  ),
  path.join(
    `${AMM_BASEDIR_PATH}/Collabs/Custom Entities/${AMM_CORE_PLACEHOLDER_FILENAME}`,
  ),
  path.join(`${AMM_BASEDIR_PATH}/Collabs/Custom Props/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/External/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/Themes/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/User/Decor/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/User/Decor/Backup/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/User/Locations/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/User/Scripts/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  path.join(`${AMM_BASEDIR_PATH}/User/Themes/${AMM_CORE_PLACEHOLDER_FILENAME}`),
  // Also some archives, yay
  path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\basegame_AMM_Props.archive`),
  path.join(`${ARCHIVE_MOD_CANONICAL_PREFIX}\\basegame_AMM_requirement.archive`),
];

const AmmCoreInstallSucceeds = new Map<string, ExampleSucceedingMod>([
  [
    `Core AMM installs without prompting when all required paths present`,
    {
      expectedInstallerType: InstallerType.CoreAmm,
      inFiles: [...AMM_BASE_PREFIXES, ...AMM_CORE_PATHS],
      outInstructions: [...AMM_CORE_PATHS.map((p) => copiedToSamePath(p))],
    },
  ],
]);

// AMM's init.lua is what identifies it, so a release carrying that and little
// else still installs.
const AmmCoreInstallsPartialReleases = new Map<string, ExampleSucceedingMod>([
  [
    `Core AMM installs a release that ships only some of its usual files`,
    {
      expectedInstallerType: InstallerType.CoreAmm,
      inFiles: [
        ...AMM_BASE_PREFIXES,
        ...AMM_CORE_PATHS.filter((p) => p === AMM_CORE_IDENTIFIER),
      ],
      outInstructions: AMM_CORE_PATHS
        .filter((p) => p === AMM_CORE_IDENTIFIER)
        .map((p) => copiedToSamePath(p)),
    },
  ],
]);

const examples: ExamplesForType = {
  AllExpectedSuccesses: mergeOrFailOnConflict(
    AmmCoreInstallSucceeds,
    AmmCoreInstallsPartialReleases,
  ),
  AllExpectedDirectFailures: new Map<string, ExampleFailingMod>(),
  AllExpectedPromptInstalls: new Map<string, ExamplePromptInstallableMod>(),
};

export default examples;

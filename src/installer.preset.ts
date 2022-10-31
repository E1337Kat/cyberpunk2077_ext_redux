import path from "path";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as J from "fp-ts/Json";
import * as O from "fp-ts/Option";
import {
  Option,
  some,
  none,
} from "fp-ts/Option";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/function";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
  VortexInstruction,
} from "./vortex-wrapper";
import {
  File,
  FileMove,
  FileTree,
  FILETREE_ROOT,
  filesIn,
  dirWithSomeUnder,
} from "./filetree";
import {
  MaybeInstructions,
  NoInstructions,
  PresetLayout,
  InvalidLayout,
  PRESET_MOD_EXTENSION,
  PRESET_MOD_CYBERCAT_BASEDIR,
  PRESET_MOD_UNLOCKER_BASEDIR,
  PRESET_MOD_CYBERCAT_REQUIRED_KEYS,
  PRESET_MOD_UNLOCKER_REQUIRED_MATCHES_FEM_MUST_MATCH_FIRST,
  PRESET_MOD_UNLOCKER_REQUIRED_MATCHES_MASC,
  PRESET_MOD_UNLOCKER_FEMDIR,
  PRESET_MOD_UNLOCKER_MASCDIR,
} from "./installers.layouts";
import {
  fileFromDisk,
  fileMove,
  fileToInstruction,
  instructionsForSameSourceAndDestPaths,
  useFirstMatchingLayoutForInstructionsAsync,
} from "./installers.shared";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";
import { StaticFeatures } from "./features";

const matchPresetExt = (filePath: string): boolean =>
  path.extname(filePath) === PRESET_MOD_EXTENSION;

const findPresetCanonCyberCatFiles = (fileTree: FileTree): string[] =>
  filesIn(PRESET_MOD_CYBERCAT_BASEDIR, matchPresetExt, fileTree);

const findPresetCanonUnlockerFiles = (fileTree: FileTree): string[] => [
  ...filesIn(PRESET_MOD_UNLOCKER_FEMDIR, matchPresetExt, fileTree),
  ...filesIn(PRESET_MOD_UNLOCKER_MASCDIR, matchPresetExt, fileTree),
];

const findPresetFilesIn = (dir: string, fileTree: FileTree): string[] =>
  filesIn(dir, matchPresetExt, fileTree);

const detectPresetLayout = (fileTree: FileTree): boolean =>
  dirWithSomeUnder(FILETREE_ROOT, matchPresetExt, fileTree);

//
// Matcher helper
//

const canonPrefixedPathByTypeIfActualPresetMod = (file: File): Option<FileMove> => {
  const cyberCatJsonMatcher = (keysInData: string[]) =>
    (keysInData.length >= PRESET_MOD_CYBERCAT_REQUIRED_KEYS.length &&
    PRESET_MOD_CYBERCAT_REQUIRED_KEYS.every((key) => keysInData.includes(key))
      ? some(fileMove(PRESET_MOD_CYBERCAT_BASEDIR, file))
      : none);

  const unlockerStringContentMatcherFem = (): Option<FileMove> =>
    (PRESET_MOD_UNLOCKER_REQUIRED_MATCHES_FEM_MUST_MATCH_FIRST.every((required) =>
      file.content.match(required))
      ? some(fileMove(PRESET_MOD_UNLOCKER_FEMDIR, file))
      : none);

  const unlockerStringContentMatcherMasc = (): Option<FileMove> =>
    (PRESET_MOD_UNLOCKER_REQUIRED_MATCHES_MASC.every((required) =>
      file.content.match(required))
      ? some(fileMove(PRESET_MOD_UNLOCKER_MASCDIR, file))
      : none);

  const maybeRealPreset = pipe(
    J.parse(file.content),
    E.map(Object.keys),
    E.map(cyberCatJsonMatcher),
    E.getOrElse(unlockerStringContentMatcherFem),
    O.alt(unlockerStringContentMatcherMasc),
  );

  return maybeRealPreset;
};

const presetInstructionsFromDecodingUnknownPresets = async (
  layoutTypeIfMatch: PresetLayout,
  installingDir: string,
  dir: string,
  fileTree: FileTree,
): Promise<MaybeInstructions> => {
  const allCandidates: File[] = await pipe(
    findPresetFilesIn(dir, fileTree),
    A.traverse(T.ApplicativePar)((filePath) =>
      fileFromDisk({
        pathOnDisk: path.join(installingDir, filePath),
        relativePath: filePath,
      })),
  )();

  const presetInstructions: VortexInstruction[] = pipe(
    allCandidates,
    A.filterMap(canonPrefixedPathByTypeIfActualPresetMod),
    A.map(fileToInstruction),
  );

  if (presetInstructions.length < 1) {
    return NoInstructions.NoMatch;
  }

  if (presetInstructions.length !== allCandidates.length) {
    return InvalidLayout.Conflict;
  }

  return {
    kind: layoutTypeIfMatch,
    instructions: presetInstructions,
  };
};

//
// Layouts
//

const presetCanonCyberCatLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonPresetCyberCatFiles = findPresetCanonCyberCatFiles(fileTree);

  if (allCanonPresetCyberCatFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const presetCanonCyberCatInstructions = instructionsForSameSourceAndDestPaths(
    allCanonPresetCyberCatFiles,
  );

  return {
    kind: PresetLayout.CyberCAT,
    instructions: presetCanonCyberCatInstructions,
  };
};

const presetCanonUnlockerLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  const allCanonPresetUnlockerFiles = findPresetCanonUnlockerFiles(fileTree);

  if (allCanonPresetUnlockerFiles.length < 1) {
    return NoInstructions.NoMatch;
  }

  const presetCanonUnlockerInstructions = instructionsForSameSourceAndDestPaths(
    allCanonPresetUnlockerFiles,
  );

  return {
    kind: PresetLayout.Unlocker,
    instructions: presetCanonUnlockerInstructions,
  };
};

const presetLegacyUnlockerLayout = async (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
  installingDir: string,
): Promise<MaybeInstructions> =>
  presetInstructionsFromDecodingUnknownPresets(
    PresetLayout.ACLegacy,
    installingDir,
    PRESET_MOD_UNLOCKER_BASEDIR,
    fileTree,
  );

const presetToplevelLayout = async (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
  installingDir: string,
): Promise<MaybeInstructions> =>
  presetInstructionsFromDecodingUnknownPresets(
    PresetLayout.Toplevel,
    installingDir,
    FILETREE_ROOT,
    fileTree,
  );

// testSupport

export const testForPresetMod: V2077TestFunc = async (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => ({
  supported: detectPresetLayout(fileTree),
  requiredFiles: [],
});

// install

export const installPresetMod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: StaticFeatures,
): Promise<VortexInstallResult> => {
  const selectedInstructions = await useFirstMatchingLayoutForInstructionsAsync(
    api,
    undefined,
    fileTree,
    modInfo.installingDir.pathOnDisk,
    [
      presetCanonCyberCatLayout,
      presetCanonUnlockerLayout,
      presetLegacyUnlockerLayout,
      presetToplevelLayout,
    ],
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    return promptToFallbackOrFailOnUnresolvableLayout(
      api,
      InstallerType.Preset,
      fileTree,
    );
  }

  return Promise.resolve({
    instructions: selectedInstructions.instructions,
  });
};

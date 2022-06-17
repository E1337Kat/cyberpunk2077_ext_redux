import path from "path";
import * as A from "fp-ts/Array";
import * as Either from "fp-ts/Either";
import * as J from "fp-ts/Json";
import { Option, some, none } from "fp-ts/Option";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/function";
import {
  VortexApi,
  VortexLogFunc,
  VortexTestResult,
  VortexWrappedInstallFunc,
  VortexWrappedTestSupportedFunc,
  VortexProgressDelegate,
  VortexInstallResult,
  VortexInstruction,
} from "./vortex-wrapper";
import { FileTree, FILETREE_ROOT, filesIn, dirWithSomeUnder } from "./filetree";
import {
  MaybeInstructions,
  NoInstructions,
  PresetLayout,
  InvalidLayout,
  PRESET_MOD_EXTENSION,
  PRESET_MOD_CYBERCAT_BASEDIR,
  PRESET_MOD_UNLOCKER_BASEDIR,
  PRESET_MOD_CYBERCAT_REQUIRED_KEYS,
  PRESET_MOD_UNLOCKER_REQUIRED_MATCHES,
} from "./installers.layouts";
import {
  File,
  fileFromDisk,
  FileMove,
  fileMove,
  fileToInstruction,
  instructionsForSameSourceAndDestPaths,
  useFirstMatchingLayoutForInstructions,
} from "./installers.shared";
import { InstallerType } from "./installers.types";
import { promptToFallbackOrFailOnUnresolvableLayout } from "./installer.fallback";

const matchPresetExt = (filePath: string): boolean =>
  path.extname(filePath) === PRESET_MOD_EXTENSION;

const findPresetCanonCyberCatFiles = (fileTree: FileTree): string[] =>
  filesIn(PRESET_MOD_CYBERCAT_BASEDIR, matchPresetExt, fileTree);

const findPresetCanonUnlockerFiles = (fileTree: FileTree): string[] =>
  filesIn(PRESET_MOD_UNLOCKER_BASEDIR, matchPresetExt, fileTree);

const findPresetToplevelFiles = (fileTree: FileTree): string[] =>
  filesIn(FILETREE_ROOT, matchPresetExt, fileTree);

const detectPresetLayout = (fileTree: FileTree): boolean =>
  dirWithSomeUnder(FILETREE_ROOT, matchPresetExt, fileTree);

//
// Matcher helper
//

const canonPrefixedPathByTypeIfActualPresetMod = (file: File): Option<FileMove> => {
  const cyberCatJsonMatcher = (keysInData: string[]) =>
    keysInData.length >= PRESET_MOD_CYBERCAT_REQUIRED_KEYS.length &&
    PRESET_MOD_CYBERCAT_REQUIRED_KEYS.every((key) => keysInData.includes(key))
      ? some(fileMove(PRESET_MOD_CYBERCAT_BASEDIR, file))
      : none;

  const unlockerStringContentMatcher = () =>
    PRESET_MOD_UNLOCKER_REQUIRED_MATCHES.every((required) => file.content.match(required))
      ? some(fileMove(PRESET_MOD_UNLOCKER_BASEDIR, file))
      : none;

  const maybeRealPreset = pipe(
    J.parse(file.content),
    Either.map(Object.keys),
    Either.map(cyberCatJsonMatcher),
    Either.getOrElse(unlockerStringContentMatcher),
  );

  return maybeRealPreset;
};

//
// Layouts
//

const presetCanonCyberCatLayout = (
  api: VortexApi,
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
  api: VortexApi,
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

const presetToplevelLayout = async (
  api: VortexApi,
  sourceDirPathForMod: string,
  _modName: string,
  fileTree: FileTree,
): Promise<MaybeInstructions> => {
  const allToplevelCandidates: File[] = await pipe(
    findPresetToplevelFiles(fileTree),
    A.traverse(T.ApplicativePar)((filePath) =>
      fileFromDisk(path.join(sourceDirPathForMod, filePath), filePath),
    ),
  )();

  const toplevelPresetInstructions: VortexInstruction[] = pipe(
    allToplevelCandidates,
    A.filterMap(canonPrefixedPathByTypeIfActualPresetMod),
    A.map(fileToInstruction),
  );

  if (toplevelPresetInstructions.length < 1) {
    return NoInstructions.NoMatch;
  }

  if (toplevelPresetInstructions.length !== allToplevelCandidates.length) {
    return InvalidLayout.Conflict;
  }

  return {
    kind: PresetLayout.Toplevel,
    instructions: toplevelPresetInstructions,
  };
};

// testSupport

export const testForPresetMod: VortexWrappedTestSupportedFunc = async (
  _api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  _destinationPath: string,
  _sourceDirPathForMod: string,
  _stagingDirPathForMod: string,
  _modName: string,
): Promise<VortexTestResult> => ({
  supported: detectPresetLayout(fileTree),
  requiredFiles: [],
});

// install

export const installPresetMod: VortexWrappedInstallFunc = async (
  api: VortexApi,
  _log: VortexLogFunc,
  _files: string[],
  fileTree: FileTree,
  stagingDirPath: string,
  _progressDelegate: VortexProgressDelegate,
): Promise<VortexInstallResult> => {
  const pathBasedMatchInstructions = useFirstMatchingLayoutForInstructions(
    api,
    undefined,
    fileTree,
    [presetCanonCyberCatLayout, presetCanonUnlockerLayout],
  );

  const selectedInstructions =
    pathBasedMatchInstructions === NoInstructions.NoMatch ||
    pathBasedMatchInstructions === InvalidLayout.Conflict
      ? await presetToplevelLayout(api, stagingDirPath, undefined, fileTree)
      : pathBasedMatchInstructions;

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

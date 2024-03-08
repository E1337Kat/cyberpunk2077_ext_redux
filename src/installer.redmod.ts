import path from "path";
import {
  flow,
  pipe,
} from "fp-ts/lib/function";
import {
  not,
} from "fp-ts/lib/Predicate";
import {
  map,
  filter,
  flatten,
  some as any,
  toArray as toMutableArray,
  findFirstMap,
  concat,
  partition,
} from "fp-ts/ReadonlyArray";
import {
  TaskEither,
  chainEitherKW,
  map as mapTE,
  mapLeft as mapLeftTE,
  fromOption as fromOptionTE,
  chain,
  traverseArray as traverseArrayTE,
  chainEitherK,
  fromEither as TEfromEither,
} from "fp-ts/lib/TaskEither";
import * as J from "fp-ts/lib/Json";
import {
  Either,
  isLeft,
  left,
  right,
  chain as chainE,
  map as mapE,
  traverseArray as traverseArrayE,
} from "fp-ts/lib/Either";
import {
  none,
  some,
  Option,
} from "fp-ts/lib/Option";
import {
  replace as replaceIn,
} from "fp-ts/lib/string";
import {
  FileTree,
  findDirectSubdirsWithSome,
  filesUnder,
  Glob,
  FILETREE_ROOT,
  sourcePaths,
  subdirNamesIn,
  subdirsIn,
  pathEq,
  pathIn,
  dirWithSomeIn,
  dirInTree,
  filesIn,
  fileTreeFromPaths,
  normalizeDir,
} from "./filetree";
import {
  REDMOD_INFO_FILENAME,
  REDMOD_BASEDIR,
  REDMOD_SUBTYPE_DIRNAMES,
  REDMOD_ARCHIVES_DIRNAME,
  REDMOD_CUSTOMSOUNDS_DIRNAME,
  REDMOD_TWEAKS_DIRNAME,
  REDMOD_ARCHIVES_VALID_EXTENSIONS,
  REDMOD_CUSTOMSOUNDS_VALID_EXTENSIONS,
  REDMOD_SCRIPTS_VALID_EXTENSIONS,
  REDMOD_TWEAKS_VALID_EXTENSIONS,
  REDMOD_SCRIPTS_DIRNAME,
  REDMOD_SCRIPTS_VALID_SUBDIR_NAMES,
  REDMOD_SCRIPTS_MODDED_DIR,
  ARCHIVE_MOD_CANONICAL_PREFIX,
  Instructions,
  REDmodTransformedLayout,
  REDMOD_MODTYPE_ATTRIBUTE,
  ARCHIVE_MOD_XL_EXTENSION,
  REDMOD_TWEAKS_VALID_SUBDIRS,
} from "./installers.layouts";
import {
  fileFromDiskTE,
  instructionsForSourceToDestPairs,
  instructionsToGenerateDirs,
  instructionToGenerateMetadataAttribute,
  modInfoTaggedAsAutoconverted,
  moveFromTo,
} from "./installers.shared";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
  VortexInstruction,
} from "./vortex-wrapper";
import {
  decodeREDmodInfo,
  InstallerType,
  makeAttr,
  ModAttributeKey,
  ModAttributeValue,
  ModInfo,
  ModType,
  REDmodInfo,
  REDmodInfoForVortex,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import {
  showArchiveInstallWarning,
  showWarningForUnrecoverableStructureError,
} from "./ui.dialogs";
import {
  FeatureSet,
  IsDynamicFeatureEnabled,
} from "./features";
import {
  jsonp,
  jsonpp,
  S,
} from "./util.functions";
import {
  showInfoNotification,
  InfoNotification,
} from "./ui.notifications";

const me = `${InstallerType.REDmod}`;
const transMe = `${InstallerType.SpecialREDmodAutoconversion}`;


//
// Types
//


type InfoJsonReaderFunc = (m: ModInfo, relativeModDir: string) => TaskEither<Error, REDmodInfo>;

interface REDmodInfoAndPathDetes {
  redmodInfo: REDmodInfo;
  relativeSourceDir: string;
  relativeDestDir: string;
  fileTree: FileTree;
}


//
// Helpers
//

const fixAnyInfoJsonProblems = (modInfo: ModInfo) =>
  (redmodInfo: REDmodInfo): Either<Error, REDmodInfo> =>
    right({
      ...redmodInfo,
      version: redmodInfo.version && redmodInfo.version !== `` ? redmodInfo.version : modInfo.version.v,
    });

const readInfoJsonFromDisk: InfoJsonReaderFunc = (
  modInfo: ModInfo,
  relativeREDmodDir: string,
): TaskEither<Error, REDmodInfo> =>
  pipe(
    fileFromDiskTE({
      pathOnDisk: path.join(modInfo.installingDir.pathOnDisk, relativeREDmodDir, REDMOD_INFO_FILENAME),
      relativePath: path.join(relativeREDmodDir, REDMOD_INFO_FILENAME),
    }),
    chainEitherKW((file) =>
      pipe(
        file.content,
        J.parse,
        chainE(decodeREDmodInfo),
      )),
    mapLeftTE((err) => new Error(`Error decoding ${path.join(relativeREDmodDir, REDMOD_INFO_FILENAME)}: ${err}`)),
  );

const instructionsToMoveAllFromSourceToDestination = (
  sourceDirPrefix: string,
  destinationDirPrefix: string,
  files: readonly string[],
): readonly VortexInstruction[] =>
  pipe(
    files,
    map(moveFromTo(sourceDirPrefix, destinationDirPrefix)),
    instructionsForSourceToDestPairs,
  );


//
// REDmod
//

const matchREDmodInfoJson = (p: string): boolean =>
  pathEq(REDMOD_INFO_FILENAME)(path.basename(p));

const matchREDmodArchive = (p: string): boolean =>
  pathIn(REDMOD_ARCHIVES_VALID_EXTENSIONS)(path.extname(p));

const matchREDmodCustomSound = (p: string): boolean =>
  pathIn(REDMOD_CUSTOMSOUNDS_VALID_EXTENSIONS)(path.extname(p));

const matchREDmodScript = (p: string): boolean =>
  pathIn(REDMOD_SCRIPTS_VALID_EXTENSIONS)(path.extname(p));

const matchREDmodTweak = (p: string): boolean =>
  pathIn(REDMOD_TWEAKS_VALID_EXTENSIONS)(path.extname(p));


const matchAnyREDmodSubtypeDir = (fileTree: FileTree) =>
  (inDir: string): boolean =>
    pipe(
      subdirNamesIn(inDir, fileTree),
      any(pathIn(REDMOD_SUBTYPE_DIRNAMES)),
    );

const findCanonicalREDmodDirs = (fileTree: FileTree): readonly string[] =>
  findDirectSubdirsWithSome(REDMOD_BASEDIR, matchREDmodInfoJson, fileTree);

const findNamedREDmodDirs = (fileTree: FileTree): readonly string[] =>
  pipe(
    findDirectSubdirsWithSome(FILETREE_ROOT, matchREDmodInfoJson, fileTree),
    filter(matchAnyREDmodSubtypeDir(fileTree)),
  );

const detectCanonREDmodLayout = (fileTree: FileTree): boolean =>
  dirInTree(REDMOD_BASEDIR, fileTree);

const detectNamedREDmodLayout = (fileTree: FileTree): boolean =>
  findNamedREDmodDirs(fileTree).length > 0;

const detectToplevelREDmodLayout = (fileTree: FileTree): boolean =>
  dirWithSomeIn(FILETREE_ROOT, matchREDmodInfoJson, fileTree)
  && matchAnyREDmodSubtypeDir(fileTree)(FILETREE_ROOT);

export const detectREDmodLayout = (fileTree: FileTree): boolean =>
  detectCanonREDmodLayout(fileTree)
  || detectNamedREDmodLayout(fileTree)
  || detectToplevelREDmodLayout(fileTree);

//
// Layouts
//

const splitCanonREDmodsIfTheresMultiple = (fileTree: FileTree): Either<Error, readonly string[]> => {
  const allValidCanonicalREDmodDirs = findCanonicalREDmodDirs(fileTree);
  const allREDmodLookingDirs = subdirsIn(REDMOD_BASEDIR, fileTree);

  const invalidDirs = pipe(
    allREDmodLookingDirs,
    filter(not(pathIn(allValidCanonicalREDmodDirs))),
  );

  if (invalidDirs.length > 0) {
    return left(new Error(`${InstallerType.REDmod}: Canon Layout: these directories don't look like valid REDmods: ${invalidDirs.join(`, `)}`));
  }

  return right(allValidCanonicalREDmodDirs);
};

// Why is this not validating the same way??
const splitNamedREDmodsIfTheresMultiple = (fileTree: FileTree): Either<Error, readonly string[]> =>
  right(findNamedREDmodDirs(fileTree));

const collectPathDetesForInstructions = (
  relativeSourceDir: string,
  redmodInfo: REDmodInfo,
  fileTree: FileTree,
): Either<Error, REDmodInfoAndPathDetes> =>
  right({
    redmodInfo,
    relativeSourceDir,
    relativeDestDir: path.join(REDMOD_BASEDIR, redmodInfo.name),
    fileTree,
  });


const fixDotsInDirname = flow(
  // This should be safe w/o split because it's always just `mods/<dirname>` or just the mod name
  replaceIn(/\./g, `_`),
);

const sanitizePathDetesForREDmodding =
  (redmodInfoAndPathDetes: REDmodInfoAndPathDetes): Either<Error, REDmodInfoAndPathDetes> =>
    right({
      ...redmodInfoAndPathDetes,
      relativeDestDir: fixDotsInDirname(redmodInfoAndPathDetes.relativeDestDir),
    });


const returnInstructionsAndLogEtc = (
  _api: VortexApi,
  _fileTree: FileTree,
  _modInfo: ModInfo,
  _features: FeatureSet,
  instructions: readonly VortexInstruction[],
): Promise<VortexInstallResult> =>
  Promise.resolve({ instructions: toMutableArray(instructions) });


const failAfterWarningUserAndLogging = (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  features: FeatureSet,
  error: Error,
): Promise<VortexInstallResult> => {
  const errorMessage = `Didn't Find Expected REDmod Installation!`;

  api.log(
    `error`,
    `${me}: ${errorMessage} Error: ${error.message}`,
    sourcePaths(fileTree),
  );

  showWarningForUnrecoverableStructureError(
    api,
    InstallerType.REDmod,
    errorMessage,
    sourcePaths(fileTree),
  );

  return Promise.reject(new Error(errorMessage));
};


//
// Layouts for REDmod subtypes
//


const infoJsonLayoutAndValidation = (
  api: VortexApi,
  infoAndPaths: REDmodInfoAndPathDetes,
  _modInfo: ModInfo,
): Either<Error, readonly VortexInstruction[]> =>
  pipe(
    right(infoAndPaths),
    mapE(({ relativeSourceDir, relativeDestDir }) =>
      instructionsToMoveAllFromSourceToDestination(
        relativeSourceDir,
        relativeDestDir,
        [path.join(relativeSourceDir, REDMOD_INFO_FILENAME)],
      )),
  );


const archiveLayoutAndValidation = (
  api: VortexApi,
  {
    relativeSourceDir,
    relativeDestDir,
    fileTree,
  }: REDmodInfoAndPathDetes,
  _modInfo: ModInfo,
): Either<Error, readonly VortexInstruction[]> => {
  const archiveDir =
    path.join(relativeSourceDir, REDMOD_ARCHIVES_DIRNAME);

  const correctlyPlacedArchiveFiles =
    filesIn(archiveDir, matchREDmodArchive, fileTree);

  const allArchiveFilesInArchivePath =
    filesUnder(archiveDir, matchREDmodArchive, fileTree);

  const hasArchivesInSubdirs =
    allArchiveFilesInArchivePath.length !== correctlyPlacedArchiveFiles.length;

  const hasMultipleArchives =
    correctlyPlacedArchiveFiles.length > 1;

  const hasXlWhichMeansMultipleArchivesShouldntBeAProblem =
    pipe(
      correctlyPlacedArchiveFiles,
      any((archiveFile) => archiveFile.endsWith(ARCHIVE_MOD_XL_EXTENSION)),
    );

  const hasPossiblyProblematicMultipleArchives =
    hasMultipleArchives && !hasXlWhichMeansMultipleArchivesShouldntBeAProblem;

  if (hasArchivesInSubdirs || hasPossiblyProblematicMultipleArchives) {
    api.log(`warn`, `Archive sublayout may require manual fixing, showing warning but continuing:`, { hasArchivesInSubdirs, hasMultipleArchives });

    showArchiveInstallWarning(
      api,
      InstallerType.REDmod,
      hasArchivesInSubdirs,
      hasMultipleArchives,
      false,
      allArchiveFilesInArchivePath,
    );
  }

  const instructions = instructionsToMoveAllFromSourceToDestination(
    relativeSourceDir,
    relativeDestDir,
    allArchiveFilesInArchivePath,
  );

  return right(instructions);
};


const customSoundLayoutAndValidation = (
  _api: VortexApi,
  {
    relativeSourceDir,
    relativeDestDir,
    fileTree,
    redmodInfo,
  }: REDmodInfoAndPathDetes,
  _modInfo: ModInfo,
): Either<Error, readonly VortexInstruction[]> => {
  const customSoundsDir =
    path.join(relativeSourceDir, REDMOD_CUSTOMSOUNDS_DIRNAME);

  const allCustomSoundFiles =
    filesUnder(customSoundsDir, matchREDmodCustomSound, fileTree);

  const infoJsonCustomSounds =
    redmodInfo.customSounds || [];

  const infoJsonSkippedSounds = pipe(
    infoJsonCustomSounds,
    filter((soundDecl) => soundDecl.type === `mod_skip`),
  );

  const infoJsonRequiresSoundFiles =
    infoJsonSkippedSounds.length !== infoJsonCustomSounds.length;

  const hasSoundFiles =
    allCustomSoundFiles.length > 0;

  // This isn't /exactly/ an exhaustive check...
  if ((infoJsonRequiresSoundFiles && !hasSoundFiles)
      || (!infoJsonRequiresSoundFiles && hasSoundFiles)) {
    return left(new Error(`customSounds sublayout: ${jsonp({ soundFilesRequiredPresent: infoJsonRequiresSoundFiles, hasSoundFiles })}!`));
  }

  const fileInstructions = instructionsToMoveAllFromSourceToDestination(
    relativeSourceDir,
    relativeDestDir,
    allCustomSoundFiles,
  );

  const infoJsonHasSoundSpecButOnlySkipped =
    infoJsonCustomSounds.length > 0 && infoJsonSkippedSounds.length === infoJsonCustomSounds.length;

  const customSoundsAllSkippedRequiresPlaceholder =
    infoJsonHasSoundSpecButOnlySkipped && fileInstructions.length < 1;

  const instructions =
    customSoundsAllSkippedRequiresPlaceholder
      ? instructionsToGenerateDirs([path.join(relativeDestDir, REDMOD_CUSTOMSOUNDS_DIRNAME)])
      : fileInstructions;

  return right(instructions);
};


const scriptLayoutAndValidation = (
  _api: VortexApi,
  {
    relativeSourceDir,
    relativeDestDir,
    fileTree,
  }: REDmodInfoAndPathDetes,
  _modInfo: ModInfo,
): Either<Error, readonly VortexInstruction[]> => {
  const scriptsDir =
    path.join(relativeSourceDir, REDMOD_SCRIPTS_DIRNAME);

  const allScriptFiles =
    filesUnder(scriptsDir, matchREDmodScript, fileTree);

  const allScriptFilesInValidBasedir = pipe(
    REDMOD_SCRIPTS_VALID_SUBDIR_NAMES,
    map((validScriptSubdir) => filesUnder(path.join(scriptsDir, validScriptSubdir), matchREDmodScript, fileTree)),
    flatten,
  );

  if (allScriptFiles.length !== allScriptFilesInValidBasedir.length) {
    const invalidScriptFiles = pipe(
      allScriptFiles,
      filter(not(pathIn(allScriptFilesInValidBasedir))),
    );

    return left(new Error(`Script sublayout: these files don't look like valid REDmod scripts: ${invalidScriptFiles.join(`, `)}`));
  }

  const allInstructions = instructionsToMoveAllFromSourceToDestination(
    relativeSourceDir,
    relativeDestDir,
    allScriptFiles,
  );

  return right(allInstructions);
};


const tweakLayoutAndValidation = (
  _api: VortexApi,
  {
    relativeSourceDir,
    relativeDestDir,
    fileTree,
  }: REDmodInfoAndPathDetes,
  _modInfo: ModInfo,
): Either<Error, readonly VortexInstruction[]> => {
  const tweaksDir =
    path.join(relativeSourceDir, REDMOD_TWEAKS_DIRNAME);

  const allTweakFiles =
    filesUnder(tweaksDir, matchREDmodTweak, fileTree);

  const allTweakFilesInValidBasedir = pipe(
    REDMOD_TWEAKS_VALID_SUBDIRS,
    map((validTweakSubdir) =>
      filesUnder(
        path.join(tweaksDir, validTweakSubdir),
        matchREDmodTweak,
        fileTree,
      )),
    flatten,
  );

  if (allTweakFiles.length !== allTweakFilesInValidBasedir.length) {
    const invalidTweakFiles = pipe(
      allTweakFiles,
      filter(not(pathIn(allTweakFilesInValidBasedir))),
    );

    return left(new Error(`Tweak Layout: these files don't look like valid REDmod tweaks: ${invalidTweakFiles.join(`, `)}`));
  }

  const instructions = instructionsToMoveAllFromSourceToDestination(
    relativeSourceDir,
    relativeDestDir,
    allTweakFiles,
  );

  return right(instructions);
};

const extraFilesLayoutAndValidation = (
  api: VortexApi,
  {
    relativeSourceDir,
    relativeDestDir,
    fileTree,
  }: REDmodInfoAndPathDetes,
  _modInfo: ModInfo,
): Either<Error, readonly VortexInstruction[]> => {
  const filesInSubdirsNotHandled = pipe(
    subdirNamesIn(relativeSourceDir, fileTree),
    filter(not(pathIn(REDMOD_SUBTYPE_DIRNAMES))),
    map((subdir) => filesUnder(path.join(relativeSourceDir, subdir), Glob.Any, fileTree)),
    flatten,
  );

  const allRemainingFiles = [
    ...filesIn(relativeSourceDir, not(matchREDmodInfoJson), fileTree),
    ...filesInSubdirsNotHandled,
  ];

  api.log(`info`, `Found some extra files in mod root, installing them too:`, allRemainingFiles);

  const instructions = instructionsToMoveAllFromSourceToDestination(
    relativeSourceDir,
    relativeDestDir,
    allRemainingFiles,
  );

  return right(instructions);
};

const redmodInfoModAttributeInstruction =
  (modInfo: ModInfo, detes: REDmodInfoAndPathDetes): readonly VortexInstruction[] => {

    const redmodInfoForVortex: REDmodInfoForVortex = {
      name: detes.redmodInfo.name,
      version: detes.redmodInfo.version,
      relativePath: normalizeDir(detes.relativeDestDir),
      vortexModId: modInfo.id,
    };

    const redmodInfoModAttribute =
      makeAttr(ModAttributeKey.REDmodInfo, redmodInfoForVortex);

    return [instructionToGenerateMetadataAttribute(redmodInfoModAttribute)];
  };

// This is a little annoying, but it flows better with the inner loop
const gatherAllREDmodInfoModAttributesIntoOneInstruction =
  (instructions: readonly VortexInstruction[]): readonly VortexInstruction[] => {
    const { right: redmodInfoInstructions, left: otherInstructions } = pipe(
      instructions,
      partition((instruction) => instruction.key === ModAttributeKey.REDmodInfo),
    );

    const allREDmodInfosInstruction = pipe(
      redmodInfoInstructions,
      map((instruction) => (instruction.value as ModAttributeValue<REDmodInfoForVortex>).data),
      (redmodInfos) => makeAttr(ModAttributeKey.REDmodInfoArray, redmodInfos),
    );

    return [
      ...otherInstructions,
      instructionToGenerateMetadataAttribute(allREDmodInfosInstruction),
    ];
  };

// …Let's just always do this?
const ensureModdedDirExistsInstruction = (): readonly VortexInstruction[] =>
  instructionsToGenerateDirs([REDMOD_SCRIPTS_MODDED_DIR]);

const redmodModTypeModAttributeInstruction = (): readonly VortexInstruction[] =>
  [instructionToGenerateMetadataAttribute(REDMOD_MODTYPE_ATTRIBUTE)];

//
// Layout pipeline helpers
//

const error = (message: string) => (): Error => new Error(`${InstallerType.REDmod}: ${message}`);

type ModDirsForLayoutFunc = (FileTree) => Either<Error, readonly string[]>;
type LayoutMatcherFunc = (FileTree) => Option<ModDirsForLayoutFunc>;

const canonLayoutModDirs = flow(splitCanonREDmodsIfTheresMultiple);
const namedLayoutModDirs = flow(splitNamedREDmodsIfTheresMultiple);
const toplevelLayoutDir = (_fileTree: FileTree): Either<Error, readonly string[]> => right([FILETREE_ROOT]);

const canonLayoutMatches = (fileTree: FileTree): Option<ModDirsForLayoutFunc> =>
  (detectCanonREDmodLayout(fileTree)
    ? some(canonLayoutModDirs)
    : none);

const namedLayoutMatches = (fileTree: FileTree): Option<ModDirsForLayoutFunc> =>
  (detectNamedREDmodLayout(fileTree)
    ? some(namedLayoutModDirs)
    : none);

const toplevelLayoutMatches = (fileTree: FileTree): Option<ModDirsForLayoutFunc> =>
  (detectToplevelREDmodLayout(fileTree)
    ? some(toplevelLayoutDir)
    : none);

//
// Actual instruction generation
//

const validateCompleteSingleREDmodInstructions = (
  _modInfo: ModInfo,
  redmodInfoAndPathDetes: REDmodInfoAndPathDetes,
) =>
  (instructions: readonly VortexInstruction[]): Either<Error, readonly VortexInstruction[]> => {
    const destinations = pipe(
      instructions,
      map((instruction) => (instruction.destination ? [instruction.destination] : [])),
      flatten,
      toMutableArray,
    );

    const hasOneRequiredSubdir = pipe(
      destinations,
      fileTreeFromPaths,
      (fileTree) => subdirNamesIn(redmodInfoAndPathDetes.relativeDestDir, fileTree),
      any(pathIn(REDMOD_SUBTYPE_DIRNAMES)),
    );

    const hasSpecialCaseCustomSoundsDirWhenOnlySkippingSounds = pipe(
      destinations,
      any(pathEq(path.join(redmodInfoAndPathDetes.relativeDestDir, REDMOD_CUSTOMSOUNDS_DIRNAME))),
    );

    const looksGood =
      hasOneRequiredSubdir || hasSpecialCaseCustomSoundsDirWhenOnlySkippingSounds;

    return looksGood
      ? right(instructions)
      : left(new Error(`REDmods require at least one mod file or placeholder in addition to an info.json, mod seems invalid based on these final instructions: ${S({ instructions })}`));
  };


export const instructionsForLayoutsPipeline = (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: FeatureSet,
  allowedLayouts: readonly LayoutMatcherFunc[],
  readInfoJson: InfoJsonReaderFunc = readInfoJsonFromDisk,
): TaskEither<Error, readonly VortexInstruction[]> => {
  const singleModPipeline =
    (relativeModDir: string): TaskEither<Error, readonly VortexInstruction[]> =>
      pipe(
        readInfoJson(modInfo, relativeModDir),
        chainEitherKW(fixAnyInfoJsonProblems(modInfo)),
        chainEitherKW((validREDmodInfo) => pipe(
          collectPathDetesForInstructions(relativeModDir, validREDmodInfo, fileTree),
          chainE(sanitizePathDetesForREDmodding),
          chainE((redmodInfoAndPathDetes) => pipe(
            [
              archiveLayoutAndValidation,
              customSoundLayoutAndValidation,
              scriptLayoutAndValidation,
              tweakLayoutAndValidation,
              infoJsonLayoutAndValidation,
              extraFilesLayoutAndValidation,
            ],
            traverseArrayE((layout) => layout(api, redmodInfoAndPathDetes, modInfo)),
            mapE(flatten),
            mapE(concat(redmodInfoModAttributeInstruction(modInfo, redmodInfoAndPathDetes))),
            chainE(validateCompleteSingleREDmodInstructions(modInfo, redmodInfoAndPathDetes)),
          )),
        )),
      );

  const allModsForLayoutPipeline = pipe(
    allowedLayouts,
    findFirstMap((allModDirsForLayoutIfMatch) => allModDirsForLayoutIfMatch(fileTree)),
    fromOptionTE(error(`No REDmod layout found! This shouldn't happen, we already tested we should handle this!`)),
    chainEitherK((allModDirsForLayout) => allModDirsForLayout(fileTree)),
    chain(flow(
      traverseArrayTE(singleModPipeline),
      mapTE(flatten),
      mapTE(concat(ensureModdedDirExistsInstruction())),
      mapTE(concat(redmodModTypeModAttributeInstruction())),
      mapTE(gatherAllREDmodInfoModAttributesIntoOneInstruction),
    )),
  );

  return allModsForLayoutPipeline;
};


const allAllowedLayouts = [
  canonLayoutMatches,
  namedLayoutMatches,
  toplevelLayoutMatches,
];

const layoutsAllowedInMultitype = [
  canonLayoutMatches,
];

const layoutsAllowedForConversion = [
  canonLayoutMatches,
];


//
// Vortex
//

export const testForREDmod: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => Promise.resolve({
  supported: detectREDmodLayout(fileTree),
  requiredFiles: [],
});


export const installREDmod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  features: FeatureSet,
): Promise<VortexInstallResult> => {
  const pipelineForInstructions =
    instructionsForLayoutsPipeline(api, fileTree, modInfo, features, allAllowedLayouts);

  // At this point we have to break out to interface with everything else

  const allInstructionsForEverySubmodInside = await pipelineForInstructions();

  return isLeft(allInstructionsForEverySubmodInside)
    ? failAfterWarningUserAndLogging(api, fileTree, modInfo, features, allInstructionsForEverySubmodInside.left)
    : returnInstructionsAndLogEtc(api, fileTree, modInfo, features, allInstructionsForEverySubmodInside.right);
};


//
// External use (MultiType mainly)
//

export const detectAllowedREDmodLayoutsForMultitype =
  (fileTree: FileTree): boolean => detectCanonREDmodLayout(fileTree);

export const redmodAllowedInstructionsForMultitype = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  features: FeatureSet,
): Promise<Either<Error, readonly VortexInstruction[]>> => {
  if (!detectAllowedREDmodLayoutsForMultitype(fileTree)) {
    return right([]);
  }

  const pipelineForInstructions =
    instructionsForLayoutsPipeline(api, fileTree, modInfo, features, layoutsAllowedInMultitype);

  // At this point we have to break out to interface with everything else

  const allInstructionsForEverySubmodInside = await pipelineForInstructions();

  return allInstructionsForEverySubmodInside;
};


export const transformToREDmodArchiveInstructions = async (
  api: VortexApi,
  features: FeatureSet,
  modInfo: ModInfo,
  originalInstructions: Instructions,
): Promise<Either<Error, Instructions>> => {
  if (!IsDynamicFeatureEnabled(features.REDmodAutoconvertArchives)) {
    api.log(`error`, `${transMe}: REDmod transform function called but feature is disabled`);
    return right(originalInstructions);
  }

  const redmodInfoWithAutoconvertTag =
    modInfoTaggedAsAutoconverted(features, modInfo);

  const redmodModuleName =
    redmodInfoWithAutoconvertTag.name;

  const redmodVersion =
    redmodInfoWithAutoconvertTag.version.v;

  const realDestAndVirtualSourceDirWithModname =
    path.join(REDMOD_BASEDIR, redmodModuleName);

  const RealDestAndVirtualSourceArchiveDirWithModname =
    path.join(realDestAndVirtualSourceDirWithModname, REDMOD_ARCHIVES_DIRNAME);

  api.log(`debug`, `Transforming Archive instructions to REDmod`);
  api.log(`debug`, `Original instructions: ${jsonpp(originalInstructions)}`);

  const virtualAndRealArchiveSourcePairs = pipe(
    originalInstructions.instructions,
    filter((instruction) => instruction.type === `copy`),
    map((instruction): [string, string] => [
      instruction.destination.replace(
        normalizeDir(ARCHIVE_MOD_CANONICAL_PREFIX),
        normalizeDir(RealDestAndVirtualSourceArchiveDirWithModname),
      ),
      instruction.source,
    ]),
  );

  const infoJson: REDmodInfo = {
    name: redmodModuleName,
    version: redmodVersion,
  };

  const generateInfoJsonInstruction: VortexInstruction = {
    type: `generatefile`,
    data: jsonpp(infoJson),
    destination: path.join(realDestAndVirtualSourceDirWithModname, REDMOD_INFO_FILENAME),
  };

  const mapFromVirtualSourceToRealSource =
    new Map<string, string>([
      ...virtualAndRealArchiveSourcePairs,
    ]);

  const fileTreeForVirtualREDmodSources =
    fileTreeFromPaths([
      ...mapFromVirtualSourceToRealSource.keys(),
      generateInfoJsonInstruction.destination,
    ]);

  const returnMatchingVirtualInfoJson =
  (generatedInfoJson: REDmodInfo): InfoJsonReaderFunc =>
    (attemptedModInfo: ModInfo, attemptedRelativeModDir: string) => {
      const jsonWhenMatched =
        (attemptedModInfo.name === modInfo.name && attemptedRelativeModDir === realDestAndVirtualSourceDirWithModname)
          ? right(generatedInfoJson)
          : left(new Error(`${transMe}: Info doesn't match (this should NOT happen)! ${S({ attemptedModInfo, attemptedRelativeModDir, generatedInfoJson })}`));

      return pipe(
        jsonWhenMatched,
        TEfromEither,
      );
    };

  const redmodInstructionsGeneratedByREDmodPipeline =
    await instructionsForLayoutsPipeline(
      api,
      fileTreeForVirtualREDmodSources,
      modInfo,
      features,
      layoutsAllowedForConversion,
      returnMatchingVirtualInfoJson(infoJson),
    )();


  if (isLeft(redmodInstructionsGeneratedByREDmodPipeline)) {
    const errorMessage = `${transMe}: Failed to generate archive instructions for REDmod: ${S(redmodInstructionsGeneratedByREDmodPipeline)}`;

    api.log(`error`, errorMessage, {
      originalInstructions, modInfo, infoJson, virtualSourceTree: fileTreeForVirtualREDmodSources,
    });
    return left(new Error(errorMessage));
  }

  const redmodInstructionsMappedBackToRealSources = pipe(
    redmodInstructionsGeneratedByREDmodPipeline.right,
    map((redmodInstruction) =>
      (redmodInstruction.type !== `copy` || path.basename(redmodInstruction.destination) !== REDMOD_INFO_FILENAME
        ? redmodInstruction
        : {
          ...generateInfoJsonInstruction,
          destination: redmodInstruction.destination,
        })),
    map((redmodInstruction) =>
      (redmodInstruction.source && mapFromVirtualSourceToRealSource.get(redmodInstruction.source)
        ? {
          ...redmodInstruction,
          source: mapFromVirtualSourceToRealSource.get(redmodInstruction.source),
        }
        : redmodInstruction)),
    toMutableArray,
  );

  const instructionsToInstallArchiveAsREDmod = {
    kind: REDmodTransformedLayout.Archive,
    instructions: redmodInstructionsMappedBackToRealSources,
  };

  api.log(`info`, `${transMe}: Generated REDmod instructions for archive`, instructionsToInstallArchiveAsREDmod);

  showInfoNotification(
    api,
    InfoNotification.REDmodArchiveAutoconverted,
    `${modInfo.name} was automatically converted and will be installed as a REDmod (${redmodModuleName})!`,
  );

  return right(instructionsToInstallArchiveAsREDmod);
};


export const consolidateREDmodInstructionsForMultiType = (
  api: VortexApi,
  maybeAutoconvertedArchiveInstructions: readonly VortexInstruction[],
  redmodInstructions: readonly VortexInstruction[],
): readonly VortexInstruction[] => {

  // I guess we could also check whether autoconvert is enabled, but
  // call this looking both ways on a one-way street...
  const archivesWereAutoconverted = pipe(
    maybeAutoconvertedArchiveInstructions,
    any((instruction) =>
      instruction.key === ModAttributeKey.ModType && instruction.value.data === ModType.REDmod),
  );

  if (!archivesWereAutoconverted) {
    api.log(`debug`, `${transMe}: Consolidating for MultiType: no autoconverted archives found`);
    return [...maybeAutoconvertedArchiveInstructions, ...redmodInstructions];
  }

  api.log(`debug`, `${transMe}: Consolidating for MultiType: ${S({ maybeAutoconvertedArchiveInstructions, redmodInstructions })}`);

  const allInstructions = pipe(
    maybeAutoconvertedArchiveInstructions,
    concat(redmodInstructions),
  );

  const moddedDirInstruction =
    ensureModdedDirExistsInstruction()[0];

  const justRealInstructions = pipe(
    allInstructions,
    filter((instruction) =>
      instruction.key !== ModAttributeKey.ModType
      && instruction.key !== ModAttributeKey.REDmodInfoArray
      && instruction.destination !== moddedDirInstruction.destination),
  );

  const redmodInfoArraysConsolidatedIntoOne = pipe(
    allInstructions,
    filter((instruction) =>
      instruction.key === ModAttributeKey.REDmodInfoArray),
    map((instruction) =>
      (instruction.value as ModAttributeValue<readonly REDmodInfoForVortex[]>).data),
    flatten,
    (redmodInfos) =>
      makeAttr(ModAttributeKey.REDmodInfoArray, redmodInfos),
    (redmodInfoArrayAttr) =>
      [instructionToGenerateMetadataAttribute(redmodInfoArrayAttr)],
  );

  const consolidatedREDmodInstructions = pipe(
    justRealInstructions,
    concat(redmodInfoArraysConsolidatedIntoOne),
    concat(redmodModTypeModAttributeInstruction()),
    concat(ensureModdedDirExistsInstruction()),
  );

  api.log(`info`, `${transMe}: Consolidating for MultiType: Result: ${S({ consolidatedREDmodInstructions })}`);

  return consolidatedREDmodInstructions;
};

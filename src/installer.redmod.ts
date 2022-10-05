import path from "path";
import {
  flow,
  pipe,
} from "fp-ts/lib/function";
import { not } from "fp-ts/lib/Predicate";
import {
  some as any,
  map,
  filter,
  flatten,
  traverse,
  findFirst,
  toArray as toMutableArray,
} from "fp-ts/ReadonlyArray";
import {
  chain as chainTE,
  map as mapTE,
  ApplicativePar,
  chainEitherKW,
  fromEither as fromEitherTE,
  mapLeft as mapLeftTE,
  TaskEither,
  fromOption as fromOptionTE,
} from "fp-ts/lib/TaskEither";
import * as J from "fp-ts/lib/Json";
import {
  chain as chainE,
  Either,
  isLeft,
  left,
  right,
  map as mapE,
  traverseArray as traverseArrayE,
} from "fp-ts/lib/Either";
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
} from "./filetree";
import {
  REDMOD_INFO_FILENAME,
  REDMOD_BASEDIR,
  REDMOD_SUBTYPE_DIRNAMES,
  REDmodInfo,
  decodeREDmodInfo,
} from "./installers.layouts";
import {
  File,
  fileFromDiskTE,
  instructionsForSourceToDestPairs,
  moveFromTo,
} from "./installers.shared";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
  VortexInstruction,
} from "./vortex-wrapper";
import {
  InstallerType,
  ModInfo,
  V2077InstallFunc,
  V2077TestFunc,
} from "./installers.types";
import { showWarningForUnrecoverableStructureError } from "./ui.dialogs";
import { Features } from "./features";

//
// Types
//


// These guys help us thread the data through the pipeline
interface ValidInfoFile {
  file: File;
  redmodInfo: REDmodInfo;
}

interface DirWithModInfo {
  relativeSourceDir: string;
  redmodInfo: REDmodInfo;
}
interface DirWithInfoAndFsDetes extends DirWithModInfo {
  relativeDestDir: string;
  fileTree: FileTree;
}

// Helps inference a bit earlier
type DirWithInfoFunc =
  (fileTree: FileTree, installingDir: string) => TaskEither<Error, readonly DirWithModInfo[]>;


//
// Helpers
//

const tryReadInfoJson = (
  installingDir: string,
  relativeREDmodDir: string,
): TaskEither<Error, ValidInfoFile> =>
  pipe(
    fileFromDiskTE(
      path.join(installingDir, relativeREDmodDir, REDMOD_INFO_FILENAME),
      path.join(relativeREDmodDir, REDMOD_INFO_FILENAME),
    ),
    chainEitherKW((file) =>
      pipe(
        file.content,
        J.parse,
        chainE(decodeREDmodInfo),
        mapE((redmodInfo) => ({ file, redmodInfo })),
      )),
    mapLeftTE((err) => new Error(`Error validating ${path.join(relativeREDmodDir, REDMOD_INFO_FILENAME)}: ${err}`)),
  );

const validateModnameMatchesDir =
  ({ file, redmodInfo }: ValidInfoFile): Either<Error, ValidInfoFile> => {
    const dirname = path.basename(path.dirname(file.relativePath));

    const hasMatchingName =
      pathEq(dirname)(redmodInfo.name);

    return hasMatchingName
      ? right({ file, redmodInfo })
      : left(new Error(`REDmod directory ${dirname} does not match mod name ${redmodInfo.name} in ${REDMOD_INFO_FILENAME}`));
  };


const validateInfoJson = (detes: DirWithModInfo): Either<Error, DirWithModInfo> => right(detes);

const multipleNamedModsWithInfo =
  (splitter: (fileTree: FileTree) => Either<Error, readonly string[]>): DirWithInfoFunc =>
    (fileTree: FileTree, installingDir: string): TaskEither<Error, readonly DirWithModInfo[]> =>
      pipe(
        splitter(fileTree),
        fromEitherTE,
        chainTE(flow(
          traverse(ApplicativePar)((relative) =>
            pipe(
              tryReadInfoJson(installingDir, relative),
              chainEitherKW(validateModnameMatchesDir),
              mapTE(({ redmodInfo }) => ({ relativeSourceDir: relative, redmodInfo })),
            )),
        )),
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

const matchAnyREDmodSubtypeDir = (fileTree: FileTree) =>
  (inDir: string): boolean =>
    pipe(
      subdirNamesIn(inDir, fileTree),
      any(pathIn(REDMOD_SUBTYPE_DIRNAMES)),
    );

const findCanonicalREDmodDirs = (fileTree: FileTree): readonly string[] =>
  pipe(
    findDirectSubdirsWithSome(REDMOD_BASEDIR, matchREDmodInfoJson, fileTree),
    filter(matchAnyREDmodSubtypeDir(fileTree)),
  );

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
  dirWithSomeIn(FILETREE_ROOT, matchREDmodInfoJson, fileTree) &&
  matchAnyREDmodSubtypeDir(fileTree)(FILETREE_ROOT);

export const detectREDmodLayout = (fileTree: FileTree): boolean =>
  detectCanonREDmodLayout(fileTree) ||
  detectNamedREDmodLayout(fileTree) ||
  detectToplevelREDmodLayout(fileTree);

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

const dirAndInfoForCanon: DirWithInfoFunc = multipleNamedModsWithInfo(splitCanonREDmodsIfTheresMultiple);
const namedModsWithInfo: DirWithInfoFunc = multipleNamedModsWithInfo(splitNamedREDmodsIfTheresMultiple);

const toplevelModWithInfo: DirWithInfoFunc = (
  fileTree: FileTree,
  installingDir: string,
): TaskEither<Error, readonly DirWithModInfo[]> =>
  pipe(
    tryReadInfoJson(installingDir, FILETREE_ROOT),
    mapTE((validInfo) => ([{ relativeSourceDir: FILETREE_ROOT, redmodInfo: validInfo.redmodInfo }])),
  );

const archiveLayout = (
  _api: VortexApi,
  {
    relativeSourceDir,
    relativeDestDir,
    fileTree,
  }: DirWithInfoAndFsDetes,
): Either<Error, readonly VortexInstruction[]> => {
  const archiveDir =
    relativeSourceDir;
    // path.join(relativeSourceDir, REDMOD_ARCHIVES_DIRNAME);

  const allArchiveFilesForMod =
    filesUnder(archiveDir, Glob.Any, fileTree);

  const instructions = instructionsToMoveAllFromSourceToDestination(
    relativeSourceDir,
    relativeDestDir,
    allArchiveFilesForMod,
  );

  return right(instructions);
};

const collectFSDetesForInstructions =
  (dirWithModInfo: DirWithModInfo, fileTree: FileTree): Either<Error, DirWithInfoAndFsDetes> =>
    right({
      ...dirWithModInfo,
      fileTree,
      relativeDestDir: path.join(REDMOD_BASEDIR, dirWithModInfo.redmodInfo.name),
    });


const returnInstructionsAndLogEtc = (
  _api: VortexApi,
  _fileTree: FileTree,
  _modInfo: ModInfo,
  _features: Features,
  instructions: readonly VortexInstruction[],
): Promise<VortexInstallResult> =>
  Promise.resolve({ instructions: toMutableArray(instructions) });


const failAfterWarningUserAndLogging = (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  features: Features,
  error: Error,
): Promise<VortexInstallResult> => {
  const errorMessage = `Didn't Find Expected REDmod Installation!`;

  api.log(
    `error`,
    `${InstallerType.REDmod}: ${errorMessage} Error: ${error.message}`,
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
// Vortex
//

//
// testSupported
//

export const testForREDmod: V2077TestFunc = (
  _api: VortexApi,
  fileTree: FileTree,
): Promise<VortexTestResult> => Promise.resolve({
  supported: detectREDmodLayout(fileTree),
  requiredFiles: [],
});

//
// install
//

export const installREDmod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  features: Features,
): Promise<VortexInstallResult> => {
  const allInstructionsForEverySubmodInside = await pipe(
    [
      { detectLayout: detectCanonREDmodLayout, getModsWithInfo: dirAndInfoForCanon },
      { detectLayout: detectNamedREDmodLayout, getModsWithInfo: namedModsWithInfo },
      { detectLayout: detectToplevelREDmodLayout, getModsWithInfo: toplevelModWithInfo },
    ],
    findFirst(({ detectLayout }) => detectLayout(fileTree)),
    fromOptionTE(() => new Error(`No REDmod layout detected`)),
    chainTE(({ getModsWithInfo }) => getModsWithInfo(fileTree, modInfo.installingDir)),
    chainEitherKW(flow(
      traverseArrayE(flow(
        validateInfoJson,
        chainE((myInfo) => collectFSDetesForInstructions(myInfo, fileTree)),
        chainE((myInfoAndFsDetes) => pipe(
          [
            archiveLayout,
            // customSoundLayout,
            // scriptLayout,
            // tweakLayout,
            // initJsonLayout,
            // extraFilesLayout,
          ],
          traverseArrayE((layout) => layout(api, myInfoAndFsDetes)),
        )),
        mapE(flatten),
      )),
      mapE(flatten),
    )),
  )();

  // At this point we have to break out to interop with the rest..

  return isLeft(allInstructionsForEverySubmodInside)
    ? failAfterWarningUserAndLogging(api, fileTree, modInfo, features, allInstructionsForEverySubmodInside.left)
    : returnInstructionsAndLogEtc(api, fileTree, modInfo, features, allInstructionsForEverySubmodInside.right);
};

import {
  some as any,
  map,
  filter,
  flatten,
} from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { not } from "fp-ts/lib/Predicate";
import path from "path";
import {
  chainEitherKW,
  mapLeft,
} from "fp-ts/lib/TaskEither";
import * as J from "fp-ts/lib/Json";
import {
  Either,
  isLeft,
} from "fp-ts/lib/Either";
import {
  FileTree,
  findDirectSubdirsWithSome,
  filesUnder,
  Glob,
  FILETREE_ROOT,
  sourcePaths,
  subdirNamesIn,
  pathInTree,
  subdirsIn,
  pathEq,
  pathIn,
  dirWithSomeIn,
} from "./filetree";
import {
  REDMOD_INFO_FILENAME,
  MaybeInstructions,
  NoInstructions,
  REDmodLayout,
  InvalidLayout,
  REDMOD_BASEDIR,
  REDMOD_SUBTYPE_DIRNAMES,
  REDmodInfoType,
  REDmodInfo,
} from "./installers.layouts";
import {
  fileFromDiskTE,
  instructionsForSameSourceAndDestPaths,
  instructionsForSourceToDestPairs,
  moveFromTo,
  useFirstMatchingLayoutForInstructionsAsync,
} from "./installers.shared";
import {
  VortexApi,
  VortexTestResult,
  VortexInstallResult,
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
// Helpers
//


const tryReadInfoJson = async (pathOnDisk: string, relativePath: string)
: Promise<Either<Error, REDmodInfo>> =>
  pipe(
    fileFromDiskTE(pathOnDisk, relativePath),
    chainEitherKW((file) => J.parse(file.content)),
    chainEitherKW((json) => REDmodInfoType.decode(json)),
    mapLeft((err) => new Error(`Error parsing ${relativePath}: ${err}`)),
  )();


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
  pathInTree(REDMOD_BASEDIR, fileTree);

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

export const canonREDmodLayout = (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  if (!detectCanonREDmodLayout(fileTree)) {
    return NoInstructions.NoMatch;
  }

  const allValidCanonicalREDmodDirs = findCanonicalREDmodDirs(fileTree);
  const allREDmodLookingDirs = subdirsIn(REDMOD_BASEDIR, fileTree);

  if (allValidCanonicalREDmodDirs.length !== allREDmodLookingDirs.length) {
    const invalidDirs = pipe(
      allREDmodLookingDirs,
      filter(not(pathIn(allValidCanonicalREDmodDirs))),
    );

    api.log(`error`, `${InstallerType.REDmod}: these directories don't look like valid REDmods: ${invalidDirs.join(`, `)}`);
    return InvalidLayout.Conflict;
  }

  const allCanonAndSubdirFiles =
    filesUnder(REDMOD_BASEDIR, Glob.Any, fileTree);

  const allCanonInstructions =
    instructionsForSameSourceAndDestPaths(allCanonAndSubdirFiles);

  return {
    kind: REDmodLayout.Canon,
    instructions: allCanonInstructions,
  };
};

export const namedREDmodLayout = (
  _api: VortexApi,
  _modName: string,
  fileTree: FileTree,
): MaybeInstructions => {
  if (!detectNamedREDmodLayout(fileTree)) {
    return NoInstructions.NoMatch;
  }

  // This should be caught in multitype, but..
  const allNamedREDmodDirsInCaseThereIsExtraStuff = findNamedREDmodDirs(fileTree);

  const allNamedREDmodFiles =
    pipe(
      allNamedREDmodDirsInCaseThereIsExtraStuff,
      map((namedSubdir) => filesUnder(namedSubdir, Glob.Any, fileTree)),
      flatten,
    );

  const allToNamedWithSubdirAsModname =
    pipe(
      allNamedREDmodFiles,
      map(moveFromTo(FILETREE_ROOT, REDMOD_BASEDIR)),
    );

  const allNamedInstructions =
    instructionsForSourceToDestPairs(allToNamedWithSubdirAsModname);

  return {
    kind: REDmodLayout.Named,
    instructions: allNamedInstructions,
  };
};

export const toplevelREDmodLayout = async (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
  installingDir: string,
): Promise<MaybeInstructions> => {
  if (!detectToplevelREDmodLayout(fileTree)) {
    return NoInstructions.NoMatch;
  }

  const manifestFilePath =
    path.join(installingDir, REDMOD_INFO_FILENAME);

  const maybeManifest = await tryReadInfoJson(manifestFilePath, REDMOD_INFO_FILENAME);

  if (isLeft(maybeManifest)) {
    api.log(`info`, `${InstallerType.REDmod}: Couldn't parse info.json: ${maybeManifest.left}`);
    return InvalidLayout.Conflict;
  }

  const manifestData = maybeManifest.right;

  const allToplevelREDmodFiles =
    filesUnder(FILETREE_ROOT, Glob.Any, fileTree);

  const destinationDirWithModuleName =
    path.join(REDMOD_BASEDIR, manifestData.name);

  const allToCanonicalDestination =
    pipe(
      allToplevelREDmodFiles,
      map(moveFromTo(FILETREE_ROOT, destinationDirWithModuleName)),
    );

  const allInstructions =
    instructionsForSourceToDestPairs(allToCanonicalDestination);

  return {
    kind: REDmodLayout.Toplevel,
    instructions: allInstructions,
  };
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

// Install the REDmod stuff, as well as any archives we find
export const installREDmod: V2077InstallFunc = async (
  api: VortexApi,
  fileTree: FileTree,
  modInfo: ModInfo,
  _features: Features,
): Promise<VortexInstallResult> => {
  //
  const allPossibleRedmodLayouts = [
    canonREDmodLayout,
    namedREDmodLayout,
    toplevelREDmodLayout,
  ];

  const selectedInstructions = await useFirstMatchingLayoutForInstructionsAsync(
    api,
    modInfo.name,
    fileTree,
    modInfo.installingDir,
    allPossibleRedmodLayouts,
  );

  if (
    selectedInstructions === NoInstructions.NoMatch ||
    selectedInstructions === InvalidLayout.Conflict
  ) {
    const errorMessage = `Didn't Find Expected REDmod Installation!`;

    api.log(
      `error`,
      `${InstallerType.REDmod}: ${errorMessage}`,
      sourcePaths(fileTree),
    );

    showWarningForUnrecoverableStructureError(
      api,
      InstallerType.REDmod,
      errorMessage,
      sourcePaths(fileTree),
    );

    return Promise.reject(new Error(errorMessage));
  }

  return Promise.resolve({ instructions: selectedInstructions.instructions });
};

import path from "path";
import {
  some as any,
  map,
  filter,
  flatten,
  traverse,
} from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { not } from "fp-ts/lib/Predicate";
import {
  ApplicativePar,
  chainEitherKW,
  mapLeft,
} from "fp-ts/lib/TaskEither";
import * as J from "fp-ts/lib/Json";
import {
  chain,
  Either,
  isLeft,
  left,
  right,
  map as mapRight,
  traverseArray,
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
  MaybeInstructions,
  NoInstructions,
  REDmodLayout,
  InvalidLayout,
  REDMOD_BASEDIR,
  REDMOD_SUBTYPE_DIRNAMES,
  REDmodInfo,
  decodeREDmodInfo,
} from "./installers.layouts";
import {
  File,
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


type ValidInfoFile = [File, REDmodInfo];

const NoAdditionalValidations = [];

const modNameMustMatchDirname =
  (file: File, redmodInfo: REDmodInfo): Either<Error, REDmodInfo> => {
    const dirname = path.basename(path.dirname(file.relativePath));

    const hasMatchingName =
      pathEq(dirname)(redmodInfo.name);

    return hasMatchingName
      ? right(redmodInfo)
      : left(new Error(`REDmod directory ${dirname} does not match mod name ${redmodInfo.name} in ${REDMOD_INFO_FILENAME}`));
  };

const tryReadAndValidateInfoJsons = (
  installingDir: string,
  relativeREDmodDirs: readonly string[],
  semanticValidations: ((file: File, redmodInfo: REDmodInfo) => Either<Error, REDmodInfo>)[],
): Promise<Either<Error, readonly ValidInfoFile[]>> =>
  pipe(
    relativeREDmodDirs,
    traverse(ApplicativePar)((relative) =>
      pipe(
        fileFromDiskTE(
          path.join(installingDir, relative, REDMOD_INFO_FILENAME),
          path.join(relative, REDMOD_INFO_FILENAME),
        ),
        chainEitherKW((file) =>
          pipe(
            file.content,
            J.parse,
            chain(decodeREDmodInfo),
            chain((redmodInfo) =>
              pipe(
                semanticValidations,
                traverseArray((validate) => validate(file, redmodInfo)),
                mapRight(() => redmodInfo),
              )),
            mapRight((redmodInfo): ValidInfoFile => [file, redmodInfo]),
          )),
        mapLeft((err) => new Error(`Error validating ${path.join(relative, REDMOD_INFO_FILENAME)}: ${err}`)),
      )),
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

export const canonREDmodLayout = async (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
  installingDir: string,
): Promise<MaybeInstructions> => {
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

    api.log(`error`, `${InstallerType.REDmod}: Canon Layout: these directories don't look like valid REDmods: ${invalidDirs.join(`, `)}`);
    return InvalidLayout.Conflict;
  }

  const maybeAllREDmodInfoJsons =
    await tryReadAndValidateInfoJsons(installingDir, allValidCanonicalREDmodDirs, [modNameMustMatchDirname]);

  if (isLeft(maybeAllREDmodInfoJsons)) {
    api.log(`error`, `${InstallerType.REDmod}: Canon Layout: error trying to validate ${REDMOD_INFO_FILENAME} files ${maybeAllREDmodInfoJsons.left.message}`);
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

export const namedREDmodLayout = async (
  api: VortexApi,
  _modName: string,
  fileTree: FileTree,
  installingDir: string,
): Promise<MaybeInstructions> => {
  if (!detectNamedREDmodLayout(fileTree)) {
    return NoInstructions.NoMatch;
  }

  const allNamedREDmodDirs = findNamedREDmodDirs(fileTree);

  const maybeAllREDmodInfoJsons =
    await tryReadAndValidateInfoJsons(installingDir, allNamedREDmodDirs, [modNameMustMatchDirname]);

  if (isLeft(maybeAllREDmodInfoJsons)) {
    api.log(`error`, `${InstallerType.REDmod}: Named Layout: error trying to validate ${REDMOD_INFO_FILENAME} files ${maybeAllREDmodInfoJsons.left.message}`);
    return InvalidLayout.Conflict;
  }

  const allNamedREDmodFiles =
    pipe(
      allNamedREDmodDirs,
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

  const maybeManifest =
    await tryReadAndValidateInfoJsons(installingDir, [FILETREE_ROOT], NoAdditionalValidations);

  if (isLeft(maybeManifest)) {
    api.log(`info`, `${InstallerType.REDmod}: Couldn't parse info.json: ${maybeManifest.left.message}`);
    return InvalidLayout.Conflict;
  }

  const manifestData = maybeManifest.right[0][1];

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


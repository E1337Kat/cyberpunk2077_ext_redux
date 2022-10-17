/* eslint-disable no-underscore-dangle */
import nodejsPath from "path";
import KeyTree from "key-tree";
import { pipe } from "fp-ts/lib/function";
import {
  filter,
  map,
  some as any,
} from "fp-ts/lib/ReadonlyArray";
import {
  alwaysTrue,
  negate,
} from "./installers.utils";


export interface Path {
  readonly relativePath: string;
  readonly pathOnDisk: string;
}

export interface File extends Path {
  readonly content: string;
}

export interface FileMove extends File {
  readonly originalRelativePath: string;
}

/*
export type FileTree = {
  sep: Path;
  '$': Filenode;
  // Methods
  add: (key: Path, values: Path[]) => void;
  get: (key: Path) => Path[];
  getSub: (key: Path, grouped: boolean) => Path[] | unknown; // grouped nodejsPath object actually
  // Private
  _getNode: (key: Path) => Filenode;
}
*/

export interface FileTree {
  readonly _kt: KeyTree;
  readonly _insertedPaths: string[];
  readonly _originalPaths: string[];
}

export type PathFilter = (path: string) => boolean;
export enum Glob {
  Any = `*`,
  AnySubdir = `**`,
}

// -.-
export type MaybeFileTree = FileTree | undefined;

export const FILETREE_ROOT = ``;

// Get rid of TOPLEVEL, it bleeds everywhere in here
//
// improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/78
//
export const FILETREE_TOPLEVEL = nodejsPath.dirname(
  `This has no directory so it normalizes to . or current dir basically`,
);

// As with nodejsPath.dirname(), leave out the trailing separator
/**
 * Rebuilds a full file/directory path to the given node.
 * @param node a node in the FileTree
 * @returns The full path to the given node
 */
const dirName = (node): string => nodejsPath.join(...node.fullPath);

// The tree stores '.' at the same level as the top-level subdirs,
// which both makes sense and absolutely does not.
/**
 * Get a list of the children under a given node.
 * @param node a node in the tree to look at
 * @returns an Array of nodes that are children of the given node. An empty Array if the `node` is not actually a node
 */
const actualChildren = (node) => {
  if (!node) {
    return [];
  }

  switch (node.key) {
    case FILETREE_TOPLEVEL:
      return node.parent.children.filter((c) => c.key !== FILETREE_TOPLEVEL);
    case FILETREE_ROOT:
      return node.children;
    default:
      return node.children;
  }
};

const findFilesRecursive = (predicate: PathFilter, node): string[] => {
  const subMatches: string[] = node.children.flatMap((c) =>
    findFilesRecursive(predicate, c));

  const matches = node.values.filter(predicate);

  return subMatches.concat(matches);
};

/**
 * Get all the paths that match the predicate. if the node matches, it will return that path if it should break early, or keep searching even further down the tree and return all matches.
 * @param breakEarly Whether to break on the first matching predicate or not.
 * @param predicate a PathFilter to filter on
 * @param node A node in the FileTree
 * @returns An Array of paths that match on the PathFilter recursively
 */
const findInDirsRecursive = (
  breakEarly: boolean,
  predicate: PathFilter,
  node,
): string[] => {
  const selfMaybe = node.values.some(predicate) ? [dirName(node)] : [];

  if (selfMaybe.length > 0 && breakEarly) {
    return selfMaybe;
  }

  const subMatches: string[] = node.children.flatMap((c) =>
    findInDirsRecursive(breakEarly, predicate, c));

  return subMatches.concat(selfMaybe);
};

// It's 2022, Javascript, why am I adding this manually -.-
const regexpEscape = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);

const looksLikeADirectory = new RegExp(`${regexpEscape(nodejsPath.sep)}$`);

const stripTrailingSeparator = (path: string): string =>
  path.replace(looksLikeADirectory, ``);


//
//
//
//
// API
//
//
//
//

// Helpers

// Annoyingly all three mechanisms behave subtly differently wrt. paths.
// get() does one thing, getSub() another, and _getNode() a third..
// Need to unify them (or, really, just write the damn tree) but for
// now be careful where you use which normalization.
export const normalizeDir = (dir: string): string =>
  (dir === FILETREE_ROOT ? FILETREE_TOPLEVEL : stripTrailingSeparator(dir));

export const safeNormalizePath = (path: string): string =>
  nodejsPath.normalize(path).toLocaleLowerCase();

// Safe path comparison (case-insensitive on Windows)
const pathEqual = (a: string, b: string): boolean =>
  safeNormalizePath(a) === safeNormalizePath(b);

export const pathEq = (a: string) => (b: string): boolean => pathEqual(a, b);

// Safe path set membership
const pathInclude = (paths: readonly string[], path: string): boolean =>
  pipe(paths, any(pathEq(path)));

export const pathIn = (paths: readonly string[]) => (path: string): boolean => pathInclude(paths, path);

// Safe subpath check
export const pathContains = (path: string) => (pathThatShouldContain: string): boolean =>
  // eslint-disable-next-line max-len
  safeNormalizePath(pathThatShouldContain).includes(safeNormalizePath(path));

//
// Creation
//

/**
 * Convert an array of paths to a file tree for easier parsing of the directory tree.
 * @param paths An array of file paths (that are recognizable to `fs`)
 * @returns a FileTree that represents the structure of the array of paths
 */
export const fileTreeFromPaths = (paths: string[]): FileTree => {
  const internalKeyTree = new KeyTree({ separator: nodejsPath.sep });

  const filePathsOnly = paths.filter((path) => !path.endsWith(nodejsPath.sep));

  // Yay mutation
  filePathsOnly.forEach((path) => internalKeyTree.add(nodejsPath.dirname(path), path));

  return {
    _kt: internalKeyTree,
    _insertedPaths: filePathsOnly,
    _originalPaths: [...paths],
  };
};

// Interface

/**
 * Gets the original paths a file tree was built from.
 * @param tree a fileTree
 * @returns the original paths the file tree was built from.
 */
export const sourcePaths = (tree: FileTree): string[] => [...tree._originalPaths];
/**
 * Gets the number of actual files in a file tree.
 * @param tree a FileTree
 * @returns the number of actual files and not just paths from the original paths.
 */
export const fileCount = (tree: FileTree): number => tree._insertedPaths.length;

/**
 * Finds a list of subdirectories directly within the given directory.
 * @param dir a directory to search in
 * @param tree a FileTree
 * @returns an Array of subdirectories under the given directory, or an empty array if the given directory does not exist
 */
export const subdirNamesIn = (dir: string, tree: FileTree): string[] => {
  const node = tree._kt._getNode(stripTrailingSeparator(dir)); // eslint-disable-line no-underscore-dangle

  if (!node || node.children.length < 1) {
    return [];
  }

  return node.children.map((c) => c.key).filter((c) => c !== FILETREE_TOPLEVEL);
};

/**
 * Finds a list of paths (rather than just a directory) directly within the given directory.
 * @param dir a directory to look in
 * @param tree a FileTree
 * @optional predicate a PathFilter to filter on
 * @returns an Array of paths to the subdirectories under the given directory, or an empty array if the directory is not found
 */
export const subdirsIn = (dir: string, tree: FileTree, predicate: PathFilter = alwaysTrue): readonly string[] =>
  pipe(
    subdirNamesIn(dir, tree),
    map((subdir) => nodejsPath.join(dir, subdir)),
    filter(predicate),
  );

/**
 * Find if a given directory exists in the tree at some given point.
 * @param dir a directory to search for
 * @param tree a FileTree
 * @returns true if the directory exists in the tree, false otherwise
 */
export const dirInTree = (dir: string, tree: FileTree): boolean =>
  tree._kt._getNode(stripTrailingSeparator(dir)) !== null;

/**
 * Find if a given path exists in the tree
 * @param path a file or directory path to look for
 * @param tree a FileTree
 * @returns true if the full path can be found in the tree, false otherwise
 */
export const pathInTree = (path: string, tree: FileTree): boolean =>
  // We _could_ just keep track of the paths but since it's possible to mutate..
  (path.endsWith(nodejsPath.sep)
    ? dirInTree(path, tree)
    : tree._kt.get(stripTrailingSeparator(nodejsPath.dirname(path))).includes(path));

// Should really implement globbing here, make it much cleaner

/**
 * Finds all the files **in** the given folder, and optionally matching the given path filter.
 * @param dir a directory to search inside
 * @param predicate a PathFilter to and filter to
 * @param tree a FileTree
 * @returns An Array of filepaths in the directory matching the filter.
 */
export const filesIn = (
  dir: string,
  predicate: PathFilter | Glob,
  tree: FileTree,
): string[] =>
  (predicate !== Glob.Any
    ? tree._kt.get(normalizeDir(dir)).filter(predicate)
    : tree._kt.get(normalizeDir(dir)));

/**
 * Recursively finds all the files **under** the given folder, and optionally matching the given path filter.
 * @param dir a directory to search under
 * @param predicate a PathFilter to filter to
 * @param tree a FileTree
 * @returns An Array of filepaths under the given directory optionally matching the filter.
 */
export const filesUnder = (
  dir: string,
  predicate: PathFilter | Glob,
  tree: FileTree,
): string[] =>
  (predicate !== Glob.Any
    ? tree._kt.getSub(stripTrailingSeparator(dir)).filter(predicate)
    : tree._kt.getSub(stripTrailingSeparator(dir)));

/**
 * Finds if any of the files **in** the given folder exist, and optionally matches the given path filter.
 * @param dir a directory to search inside
 * @param predicate a PathFilter to match on
 * @param tree a FileTree
 * @returns true if there is at least one filepath in the directory, and optionally matches the predicate. False otherwise
 */
export const dirWithSomeIn = (
  dir: string,
  predicate: PathFilter | Glob,
  tree: FileTree,
): boolean =>
  (predicate !== Glob.Any
    ? tree._kt.get(normalizeDir(dir)).some(predicate)
    : tree._kt.get(normalizeDir(dir)));

/**
 * Finds if any of the files **under** the given folder exist recursively, and optionally matches the given path filter.
 * @param dir a directory to search under
 * @param predicate a PathFilter to match on
 * @param tree a FileTree
 * @returns true if there is at least one filepath under the directory, and optionally matches the predicate. False otherwise
 */
export const dirWithSomeUnder = (
  dir: string,
  predicate: PathFilter | Glob,
  tree: FileTree,
): boolean =>
  (predicate !== Glob.Any
    ? tree._kt.getSub(stripTrailingSeparator(dir)).some(predicate)
    : tree._kt.getSub(stripTrailingSeparator(dir)));

/**
 * Get all of the filepaths in the FileTree
 * @param predicate a PathFilter to filter on
 * @param tree a FileTree
 * @returns An Array of filepaths in the whole tree, and optionally matches the filter.
 */
export const findAllFiles = (predicate: PathFilter, tree: FileTree): string[] =>
  findFilesRecursive(predicate, tree._kt.$);

/**
 * Gets all of the filepaths which match the given filter at least one level below the directory.
 * @param dir a directory to search under
 * @param predicate a PathFilter to filter to
 * @param tree a FileTree
 * @returns An Array of all of the filepaths which exist at least one level under the given directory, and optionally match the filter.
 */
export const findAllSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): string[] =>
  actualChildren(tree._kt._getNode(stripTrailingSeparator(dir))).flatMap((sub) =>
    findInDirsRecursive(false, predicate, sub));

/**
 * Find a subdirectory at the top level from the starting `dir` with some files matching the predicate. Generally used to find a named directory on a path that we do not know before hand.
 * @param dir a directory path to look inside
 * @param predicate What to look for
 * @param tree a FileTree
 * @returns an array of paths which match
 */
export const findTopmostSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): string[] =>
  actualChildren(tree._kt._getNode(stripTrailingSeparator(dir))).flatMap((sub) =>
    findInDirsRecursive(true, predicate, sub));

/**
 * Get all of the filepaths the exist under the direct subdirectories of the given directory, and optionally filter the results.
 * @param dir the directory to search
 * @param predicate a PathFilter to filterto
 * @param tree a FileTree
 * @returns An Array with the filepaths where the filter matches some path one sub directory under the given directory
 */
export const findDirectSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): string[] =>
  subdirsIn(dir, tree).filter((subdir) => dirWithSomeIn(subdir, predicate, tree));

// Subtree creation

/**
 * Builds a sub tree from the given tree starting at the given directory
 * @param dir a directory to start the tree build at
 * @param fileTree a FileTree
 * @returns A FileTree with the parent most node at the given directory
 */
export const subtreeFrom = (dir: string, fileTree: FileTree): FileTree => {
  const subtreeFiles = filesUnder(dir, Glob.Any, fileTree).map((path) =>
    nodejsPath.join(...path.split(nodejsPath.sep).slice(1)));

  return fileTreeFromPaths(subtreeFiles);
};

// Filtered tree creation

export const prunedTreeFrom = (
  matchToPrune: PathFilter,
  fileTree: FileTree,
): FileTree => {
  const excludeMatched = (filePath) => negate(matchToPrune(filePath));
  const remainingPaths = filesUnder(FILETREE_ROOT, excludeMatched, fileTree);

  return fileTreeFromPaths(remainingPaths);
};

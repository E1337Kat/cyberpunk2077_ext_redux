/* eslint-disable no-underscore-dangle */
import nodejsPath from "path";
import KeyTree from "key-tree";

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
  _kt: KeyTree;
  _originalPaths: string[];
}

export type PathFilter = (path: string) => boolean;
export enum Glob {
  Any = "*",
  AnySubdir = "**",
}

// -.-
export type MaybeFileTree = FileTree | undefined;

export const FILETREE_ROOT = "";

// Get rid of TOPLEVEL, it bleeds everywhere in here
//
// improvement: https://github.com/E1337Kat/cyberpunk2077_ext_redux/issues/78
//
export const FILETREE_TOPLEVEL = nodejsPath.dirname(
  "This has no directory so it normalizes to . or current dir basically",
);

// As with nodejsPath.dirname(), leave out the trailing separator
const dirName = (node): string => nodejsPath.join(...node.fullPath);

// The tree stores '.' at the same level as the top-level subdirs,
// which both makes sense and absolutely does not.
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
    findFilesRecursive(predicate, c),
  );

  const matches = node.values.filter(predicate);

  return subMatches.concat(matches);
};

const findDirsRecursive = (
  breakEarly: boolean,
  predicate: PathFilter,
  node,
): string[] => {
  const selfMaybe = node.values.some(predicate) ? [dirName(node)] : [];

  if (selfMaybe.length > 0 && breakEarly) {
    return selfMaybe;
  }

  const subMatches: string[] = node.children.flatMap((c) =>
    findDirsRecursive(breakEarly, predicate, c),
  );

  return subMatches.concat(selfMaybe);
};

// It's 2022, Javascript, why am I adding this manually -.-
const regexpEscape = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const looksLikeADirectory = new RegExp(`${regexpEscape(nodejsPath.sep)}$`);

const stripTrailingSeparator = (path: string): string =>
  path.replace(looksLikeADirectory, "");

// Interface

export const fileTreeFromPaths = (paths: string[]): FileTree => {
  const tree: FileTree = {
    _kt: new KeyTree({ separator: nodejsPath.sep }),
    _originalPaths: paths,
  };

  paths.forEach((path) => {
    const normalized = path; // nodejsPath.normalize(path);

    if (!normalized.match(looksLikeADirectory)) {
      tree._kt.add(nodejsPath.dirname(normalized), normalized);
    }
  });

  return tree;
};

export const subdirsIn = (dir: string, tree: FileTree): string[] => {
  const node = tree._kt._getNode(stripTrailingSeparator(dir)); // eslint-disable-line no-underscore-dangle

  if (!node || node.children.length < 1) {
    return [];
  }

  return node.children.map((subdir) => nodejsPath.join(dir, subdir.key));
};

export const pathInTree = (path: string, tree: FileTree): boolean =>
  // We _could_ just keep track of the paths but since it's possible to mutate..
  path.endsWith(nodejsPath.sep)
    ? tree._kt._getNode(stripTrailingSeparator(path)) !== null
    : tree._kt.get(stripTrailingSeparator(nodejsPath.dirname(path))).includes(path);

// Should really implement globbing here, make it much cleaner

export const filesIn = (
  dir: string,
  predicate: PathFilter | Glob,
  tree: FileTree,
): string[] => {
  const normalizedDir =
    dir === FILETREE_ROOT ? FILETREE_TOPLEVEL : stripTrailingSeparator(dir);

  return predicate !== Glob.Any
    ? tree._kt.get(normalizedDir).filter(predicate)
    : tree._kt.get(normalizedDir);
};

export const filesUnder = (dir: string, tree: FileTree): string[] =>
  tree._kt.getSub(stripTrailingSeparator(dir));

export const dirWithSomeIn = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): boolean => tree._kt.get(stripTrailingSeparator(dir)).some(predicate);

export const dirWithSomeUnder = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): boolean => tree._kt.getSub(stripTrailingSeparator(dir)).some(predicate);

export const findAllFiles = (predicate: PathFilter, tree: FileTree): string[] =>
  findFilesRecursive(predicate, tree._kt.$);

export const findAllSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): string[] =>
  actualChildren(tree._kt._getNode(stripTrailingSeparator(dir))).flatMap((sub) =>
    findDirsRecursive(false, predicate, sub),
  );

export const findTopmostSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): string[] =>
  actualChildren(tree._kt._getNode(stripTrailingSeparator(dir))).flatMap((sub) =>
    findDirsRecursive(true, predicate, sub),
  );

export const findDirectSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): string[] =>
  subdirsIn(dir, tree).filter((subdir) => dirWithSomeIn(subdir, predicate, tree));

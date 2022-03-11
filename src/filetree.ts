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

export type FileTree = KeyTree;
export type PathFilter = (path: string) => boolean;

// -.-
export type MaybeFileTree = FileTree | undefined;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PathArray extends Array<PathArray | string> {}

export const FILETREE_ROOT = "";

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

const findFilesRecursive = (predicate: PathFilter, node): PathArray => {
  const subMatches: PathArray = node.children.flatMap((c) =>
    findFilesRecursive(predicate, c),
  );

  const matches = node.values.filter(predicate);

  return subMatches.concat(matches);
};

const findDirsRecursive = (
  breakEarly: boolean,
  predicate: PathFilter,
  node,
): PathArray => {
  const selfMaybe = node.values.some(predicate) ? [dirName(node)] : [];

  if (selfMaybe.length > 0 && breakEarly) {
    return selfMaybe;
  }

  const subMatches: PathArray = node.children.flatMap((c) =>
    findDirsRecursive(breakEarly, predicate, c),
  );

  return subMatches.concat(selfMaybe);
};

// Interface

export const fileTreeFromPaths = (paths: string[]): FileTree => {
  const tree = new KeyTree({ separator: nodejsPath.sep });
  paths.forEach((path) => tree.add(nodejsPath.dirname(path), path));

  return tree;
};

export const subdirPaths = (dir: string, tree: FileTree): string[] => {
  const node = tree._getNode(dir); // eslint-disable-line no-underscore-dangle

  if (node === undefined || node.children.length < 1) {
    return [];
  }

  return node.children.map((subdir) => nodejsPath.join(dir, subdir.key));
};

export const filesIn = (
  dir: string,
  tree: FileTree,
  predicate?: PathFilter,
): PathArray => (predicate ? tree.get(dir).filter(predicate) : tree.get(dir));

export const allFilesInDirAndSubdirs = (
  dir: string,
  tree: FileTree,
): PathArray => tree.getSub(dir);

export const dirWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): boolean => tree.get(dir).some(predicate);

export const findAllFiles = (
  predicate: PathFilter,
  tree: FileTree,
): PathArray => findFilesRecursive(predicate, tree.$);

export const findAllSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): PathArray =>
  actualChildren(tree._getNode(dir)).flatMap((sub) =>
    findDirsRecursive(false, predicate, sub),
  );

export const findTopmostSubdirsWithSome = (
  dir: string,
  predicate: PathFilter,
  tree: FileTree,
): PathArray =>
  actualChildren(tree._getNode(dir)).flatMap((sub) =>
    findDirsRecursive(true, predicate, sub),
  );

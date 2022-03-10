import nodejsPath from "path";
import KeyTree from "key-tree";

/*
export type FileTree = {
  sep: Path;
  '$': FileTreeNode;
  // Methods
  add: (key: Path, values: Path[]) => void;
  get: (key: Path) => Path[];
  getSub: (key: Path, grouped: boolean) => Path[] | unknown; // grouped nodejsPath object actually
  // Private
  _getNode: (key: Path) => FileTreeNode;
}
*/

export type FileTree = KeyTree;
export type Path = string;
export type PathFilter = (path: Path) => boolean;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PathArray extends Array<PathArray | Path> {}

export const FILETREE_ROOT = nodejsPath.dirname(
  "This has no directory so it normalizes to . or current dir basically",
);

export const fileTreeFromPaths = (paths: Path[]): FileTree => {
  const tree = new KeyTree({ separator: nodejsPath.sep });
  paths.forEach((path) => tree.add(nodejsPath.dirname(path), path));

  return tree;
};

export const filesInDir = (
  tree: FileTree,
  dir: Path,
  fileFilter?: PathFilter,
): Path[] => {
  const files = tree.get(dir);

  return fileFilter !== undefined ? files.filter(fileFilter) : files;
};

export const subdirPaths = (tree: FileTree, dir: Path): Path[] => {
  const node = tree._getNode(dir); // eslint-disable-line no-underscore-dangle

  if (node === undefined || node.children.length < 1) {
    return [];
  }

  return node.children.map((subdir) => nodejsPath.join(dir, subdir.key));
};

const findRecursive = (treeNode, predicate: PathFilter): PathArray => {
  const subMatches: PathArray = treeNode.children.flatMap((c) =>
    findRecursive(c, predicate),
  );

  const matches = treeNode.values.filter(predicate);

  return subMatches.concat(matches);
};

export const findAllInTree = (
  tree: FileTree,
  predicate: (path: Path) => boolean,
): PathArray => findRecursive(tree.$, predicate);

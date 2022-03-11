import path from "path";
import {
  fileTreeFromPaths,
  findAllSubdirsWithSome,
  findTopmostSubdirsWithSome,
  findAllFiles,
  FILETREE_ROOT,
  FILETREE_TOPLEVEL,
} from "../../src/filetree";

const paths = [
  path.normalize("topf1.seek"),
  path.normalize("topf2.seek"),
  path.normalize("topf3.notseek"),
  path.normalize("sub1/"),
  path.normalize("sub1/sub12/"),
  path.normalize("sub1/sub12/f12.seek"),
  path.normalize("sub1/sub12/f12.notseek"),
  path.normalize("sub2/"),
  path.normalize("sub2/sub22/f22.seek"),
  path.normalize("sub2/sub23/f23.notseek"),
  path.normalize("sub2/sub24/"),
  path.normalize("sub2/f24.seek"),
  path.normalize("sub2/f2r.notseek"),
  path.normalize("sub2/x2h"),
];

const matchSeek = (f) => path.extname(f) === ".seek";

describe("FileTree", () => {
  test("findAllFiles", () => {
    const fileTree = fileTreeFromPaths(paths);

    const found = findAllFiles(matchSeek, fileTree);

    expect(found).toEqual([
      path.normalize("topf1.seek"),
      path.normalize("topf2.seek"),
      path.normalize("sub1/sub12/f12.seek"),
      path.normalize("sub2/sub22/f22.seek"),
      path.normalize("sub2/f24.seek"),
    ]);
  });

  test("findAllSubdirsWithSome excluding toplevel", () => {
    const fileTree = fileTreeFromPaths(paths);

    const found = findAllSubdirsWithSome(
      FILETREE_TOPLEVEL,
      matchSeek,
      fileTree,
    );

    expect(found).toEqual([
      path.normalize("sub1/sub12"),
      path.normalize("sub2/sub22"),
      path.normalize("sub2"),
    ]);
  });

  test("findAllSubDirsWithSome including toplevel", () => {
    const fileTree = fileTreeFromPaths(paths);

    const found = findAllSubdirsWithSome(FILETREE_ROOT, matchSeek, fileTree);

    expect(found).toEqual([
      path.normalize("."),
      path.normalize("sub1/sub12"),
      path.normalize("sub2/sub22"),
      path.normalize("sub2"),
    ]);
  });

  test("findTopmostSubdirsWithSome excluding toplevel", () => {
    const fileTree = fileTreeFromPaths(paths);

    const found = findTopmostSubdirsWithSome(
      FILETREE_TOPLEVEL,
      matchSeek,
      fileTree,
    );

    expect(found).toEqual([
      path.normalize("sub1/sub12"),
      path.normalize("sub2"),
    ]);
  });

  test("findTopmostSubdirsWithSome including toplevel", () => {
    const fileTree = fileTreeFromPaths(paths);

    const found = findTopmostSubdirsWithSome(
      FILETREE_ROOT,
      matchSeek,
      fileTree,
    );

    expect(found).toEqual([
      path.normalize("."),
      path.normalize("sub1/sub12"),
      path.normalize("sub2"),
    ]);
  });
});

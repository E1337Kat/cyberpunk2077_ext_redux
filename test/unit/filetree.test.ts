import path from "path";
import { fileTreeFromPaths, findAllInTree } from "../../src/filetree";

describe("FileTree", () => {
  test("find actually works", () => {
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

    const fileTree = fileTreeFromPaths(paths);

    const found = findAllInTree(fileTree, (f) => path.extname(f) === ".seek");

    expect(found).toEqual([
      path.normalize("topf1.seek"),
      path.normalize("topf2.seek"),
      path.normalize("sub1/sub12/f12.seek"),
      path.normalize("sub2/sub22/f22.seek"),
      path.normalize("sub2/f24.seek"),
    ]);
  });
});

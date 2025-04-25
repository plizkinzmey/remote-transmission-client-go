import { describe, it, expect, vi } from "vitest";
import { buildFileTree } from "../buildFileTree";
import { TorrentFile, FileNode } from "../../../types/FileTree";
import * as calculateDirStatsModule from "../calculateDirStats"; // Import module for spying

// Mock calculateDirStats to prevent its actual execution during buildFileTree tests
// We test calculateDirStats separately. Here, we just want to know it's called.
const calculateDirStatsSpy = vi.spyOn(
  calculateDirStatsModule,
  "calculateDirStats"
);

describe("buildFileTree", () => {
  beforeEach(() => {
    calculateDirStatsSpy.mockClear();
    // Provide a basic mock implementation if needed, e.g., to avoid errors if it modifies nodes
    calculateDirStatsSpy.mockImplementation((node: FileNode) => {
      // Minimal mock: just return basic stats without modifying node deeply
      return {
        size: node.Size,
        progressSum: node.Progress ?? 0,
        count: node.children?.length ?? 1,
        allWanted: node.Wanted,
        anyWanted: node.Wanted,
      };
    });
  });

  it("should build a flat tree for files in the root", () => {
    const files: TorrentFile[] = [
      {
        ID: 1,
        Name: "file1.txt",
        Path: "file1.txt",
        Size: 100,
        Progress: 1,
        Wanted: true,
      },
      {
        ID: 2,
        Name: "file2.img",
        Path: "file2.img",
        Size: 200,
        Progress: 0.5,
        Wanted: false,
      },
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(2);
    expect(tree[0].Name).toBe("file1.txt");
    expect(tree[0].isDirectory).toBe(false);
    expect(tree[0].ID).toBe(1);
    expect(tree[0].Wanted).toBe(true);
    expect(tree[1].Name).toBe("file2.img");
    expect(tree[1].isDirectory).toBe(false);
    expect(tree[1].ID).toBe(2);
    expect(tree[1].Wanted).toBe(false);
    // Check if calculateDirStats was called for each root node (which are files here)
    expect(calculateDirStatsSpy).toHaveBeenCalledTimes(2);
    expect(calculateDirStatsSpy.mock.calls[0][0]).toBe(tree[0]);
    expect(calculateDirStatsSpy.mock.calls[1][0]).toBe(tree[1]);
  });

  it("should build a nested tree structure", () => {
    const files: TorrentFile[] = [
      {
        ID: 1,
        Name: "file1.txt",
        Path: "root/sub1/file1.txt",
        Size: 100,
        Progress: 1,
        Wanted: true,
      },
      {
        ID: 2,
        Name: "file2.zip",
        Path: "root/sub2/file2.zip",
        Size: 200,
        Progress: 0,
        Wanted: false,
      },
      {
        ID: 3,
        Name: "file3.iso",
        Path: "root/file3.iso",
        Size: 300,
        Progress: 0.5,
        Wanted: true,
      },
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(1); // Only one root node: "root"
    const root = tree[0];
    expect(root.Name).toBe("root");
    expect(root.isDirectory).toBe(true);
    expect(root.children).toHaveLength(3); // sub1, sub2, file3.iso

    const sub1 = root.children?.find((n) => n.Name === "sub1");
    const sub2 = root.children?.find((n) => n.Name === "sub2");
    const file3 = root.children?.find((n) => n.Name === "file3.iso");

    expect(sub1).toBeDefined();
    expect(sub1?.isDirectory).toBe(true);
    expect(sub1?.children).toHaveLength(1);
    expect(sub1?.children?.[0].Name).toBe("file1.txt");
    expect(sub1?.children?.[0].ID).toBe(1);
    expect(sub1?.children?.[0].Wanted).toBe(true);

    expect(sub2).toBeDefined();
    expect(sub2?.isDirectory).toBe(true);
    expect(sub2?.children).toHaveLength(1);
    expect(sub2?.children?.[0].Name).toBe("file2.zip");
    expect(sub2?.children?.[0].ID).toBe(2);
    expect(sub2?.children?.[0].Wanted).toBe(false);

    expect(file3).toBeDefined();
    expect(file3?.isDirectory).toBe(false);
    expect(file3?.ID).toBe(3);
    expect(file3?.Wanted).toBe(true);

    // Check if calculateDirStats was called once for the root node
    expect(calculateDirStatsSpy).toHaveBeenCalledTimes(1);
    expect(calculateDirStatsSpy.mock.calls[0][0]).toBe(root);
  });

  it("should handle files and directories with the same name at different levels", () => {
    const files: TorrentFile[] = [
      {
        ID: 1,
        Name: "data",
        Path: "data",
        Size: 10,
        Progress: 1,
        Wanted: true,
      }, // File named 'data'
      {
        ID: 2,
        Name: "file.txt",
        Path: "data/file.txt",
        Size: 20,
        Progress: 1,
        Wanted: true,
      }, // File inside a dir named 'data'
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(1); // Root file 'data' overwrites root dir 'data'

    const fileData = tree[0]; // The only root node should be the file 'data'

    expect(fileData).toBeDefined();
    expect(fileData.Name).toBe("data");
    expect(fileData.isDirectory).toBe(false); // It was overwritten to be a file
    expect(fileData.ID).toBe(1);

    // calculateDirStats is called once for the single root node (the file 'data')
    expect(calculateDirStatsSpy).toHaveBeenCalledTimes(1);
    expect(calculateDirStatsSpy.mock.calls[0][0]).toBe(fileData);
  });

  it("should sort files by path before building", () => {
    const files: TorrentFile[] = [
      {
        ID: 2,
        Name: "file2.txt",
        Path: "b/file2.txt",
        Size: 200,
        Progress: 0,
        Wanted: false,
      },
      {
        ID: 1,
        Name: "file1.txt",
        Path: "a/file1.txt",
        Size: 100,
        Progress: 1,
        Wanted: true,
      },
      {
        ID: 3,
        Name: "file3.txt",
        Path: "c/file3.txt",
        Size: 300,
        Progress: 0.5,
        Wanted: true,
      },
    ];

    const tree = buildFileTree(files);
    expect(tree).toHaveLength(3);
    expect(tree[0].Name).toBe("a");
    expect(tree[1].Name).toBe("b");
    expect(tree[2].Name).toBe("c");
  });

  it("should return an empty array for empty input", () => {
    const files: TorrentFile[] = [];
    const tree = buildFileTree(files);
    expect(tree).toEqual([]);
    expect(calculateDirStatsSpy).not.toHaveBeenCalled();
  });

  it("should correctly handle paths without leading/trailing slashes", () => {
    const files: TorrentFile[] = [
      {
        ID: 1,
        Name: "file.txt",
        Path: "dir/file.txt",
        Size: 100,
        Progress: 1,
        Wanted: true,
      },
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(1);
    expect(tree[0].Name).toBe("dir");
    expect(tree[0].isDirectory).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children?.[0].Name).toBe("file.txt");
    expect(tree[0].children?.[0].isDirectory).toBe(false);
    expect(tree[0].children?.[0].ID).toBe(1);

    // calculateDirStats is called once for the root node "dir"
    expect(calculateDirStatsSpy).toHaveBeenCalledTimes(1);
    expect(calculateDirStatsSpy.mock.calls[0][0]).toBe(tree[0]);
  });

  it("should update existing node if a file path matches an existing directory path (edge case)", () => {
    const files: TorrentFile[] = [
      {
        ID: 1,
        Name: "b.txt",
        Path: "a/b.txt",
        Size: 100,
        Progress: 1,
        Wanted: true,
      },
      { ID: 2, Name: "a", Path: "a", Size: 50, Progress: 0, Wanted: false },
    ];

    const tree = buildFileTree(files);

    expect(tree).toHaveLength(1); // Only one root node 'a'
    const nodeA = tree[0];

    // The second entry (file 'a') should overwrite the properties of the node created for directory 'a'
    expect(nodeA.Name).toBe("a");
    expect(nodeA.isDirectory).toBe(false); // Overwritten to be a file
    expect(nodeA.ID).toBe(2);
    expect(nodeA.Size).toBe(50);
    expect(nodeA.Progress).toBe(0);
    expect(nodeA.Wanted).toBe(false);
    expect(nodeA.children).toBeUndefined(); // Children array removed

    // calculateDirStats should be called once for the final node 'a'
    expect(calculateDirStatsSpy).toHaveBeenCalledTimes(1);
    expect(calculateDirStatsSpy.mock.calls[0][0]).toBe(nodeA);
  });
});

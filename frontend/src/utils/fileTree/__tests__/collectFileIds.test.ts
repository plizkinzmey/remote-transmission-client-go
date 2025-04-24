import { describe, it, expect } from "vitest";
import { collectFileIds } from "../collectFileIds";
import { FileNode } from "../../../types/FileTree";

// Helper to create a simple FileNode for testing
const createFile = (id: number, path: string): FileNode => ({
  ID: id,
  Name: path.split("/").pop() || "",
  Path: path,
  Size: 100,
  Progress: 1,
  Wanted: true,
  isDirectory: false,
  expanded: false,
});

const createDirectory = (
  path: string,
  children: FileNode[] = []
): FileNode => ({
  ID: -1,
  Name: path.split("/").pop() || "",
  Path: path,
  Size: 0, // Size will be calculated later
  Progress: 0,
  Wanted: false,
  isDirectory: true,
  children: children,
  expanded: false,
});

describe("collectFileIds", () => {
  it("should return the ID for a single file node", () => {
    const file = createFile(1, "file.txt");
    expect(collectFileIds(file)).toEqual([1]);
  });

  it("should return an empty array for an empty directory node", () => {
    const dir = createDirectory("emptyDir");
    expect(collectFileIds(dir)).toEqual([]);
  });

  it("should return IDs of files directly inside a directory", () => {
    const file1 = createFile(10, "dir/file1.txt");
    const file2 = createFile(20, "dir/file2.img");
    const dir = createDirectory("dir", [file1, file2]);
    expect(collectFileIds(dir)).toEqual([10, 20]);
  });

  it("should return IDs of files in nested directories", () => {
    const file1 = createFile(100, "root/sub1/file1.doc");
    const file2 = createFile(200, "root/sub2/file2.zip");
    const file3 = createFile(300, "root/file3.png");
    const sub1 = createDirectory("root/sub1", [file1]);
    const sub2 = createDirectory("root/sub2", [file2]);
    const root = createDirectory("root", [sub1, sub2, file3]);

    // Sort expected result for consistent comparison
    expect(collectFileIds(root).sort((a, b) => a - b)).toEqual([100, 200, 300]);
  });

  it("should return an empty array if directory contains only empty subdirectories", () => {
    const sub1 = createDirectory("root/sub1");
    const sub2 = createDirectory("root/sub2");
    const root = createDirectory("root", [sub1, sub2]);
    expect(collectFileIds(root)).toEqual([]);
  });

  it("should handle mixed files and directories correctly", () => {
    const fileA = createFile(1, "mix/a.txt");
    const fileB = createFile(2, "mix/sub/b.txt");
    const sub = createDirectory("mix/sub", [fileB]);
    const fileC = createFile(3, "mix/c.txt");
    const mix = createDirectory("mix", [fileA, sub, fileC]);

    expect(collectFileIds(mix).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("should handle file nodes with ID 0", () => {
    const file = createFile(0, "zero.id");
    expect(collectFileIds(file)).toEqual([0]);
  });

  it("should ignore directory nodes even if they have an ID (which shouldn't happen)", () => {
    const dirWithId: FileNode = {
      ID: 999, // Invalid state for a directory
      Name: "dirWithId",
      Path: "dirWithId",
      Size: 0,
      Progress: 0,
      Wanted: false,
      isDirectory: true,
      children: [createFile(5, "dirWithId/file.txt")],
      expanded: false,
    };
    expect(collectFileIds(dirWithId)).toEqual([5]);
  });
});

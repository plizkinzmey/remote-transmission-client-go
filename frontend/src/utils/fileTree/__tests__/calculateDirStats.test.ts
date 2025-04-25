import { describe, it, expect } from "vitest";
import { calculateDirStats } from "../calculateDirStats";
import { FileNode, DirStats } from "../../../types/FileTree";

// Helper to create FileNode instances
const createFile = (
  id: number,
  path: string,
  size: number,
  progress: number,
  wanted: boolean
): FileNode => ({
  ID: id,
  Name: path.split("/").pop() || "",
  Path: path,
  Size: size,
  Progress: progress,
  Wanted: wanted,
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
  Size: 0, // Initial size
  Progress: 0, // Initial progress
  Wanted: false, // Initial wanted state
  isDirectory: true,
  children: children,
  expanded: false,
  indeterminate: false, // Initial indeterminate state
});

describe("calculateDirStats", () => {
  it("should return stats for a single file node (base case)", () => {
    const file = createFile(1, "file.txt", 100, 0.5, true);
    const stats = calculateDirStats(file);

    expect(stats).toEqual<DirStats>({
      size: 100,
      progressSum: 0.5,
      count: 1,
      allWanted: true,
      anyWanted: true,
    });
    // Check that the node itself wasn't modified unnecessarily
    expect(file.Size).toBe(100);
    expect(file.Progress).toBe(0.5);
    expect(file.Wanted).toBe(true);
    expect(file.indeterminate).toBeUndefined();
  });

  it("should return zero stats for an empty directory (base case)", () => {
    const emptyDir = createDirectory("empty");
    const stats = calculateDirStats(emptyDir);

    expect(stats).toEqual({
      size: 0,
      progressSum: 0,
      count: 1,
      allWanted: false,
      anyWanted: false,
    });
    // Re-evaluating the base case in calculateDirStats:
    expect(emptyDir.Size).toBe(0);
    expect(emptyDir.Progress).toBe(0);
    expect(emptyDir.Wanted).toBe(false); // Default for dir
    expect(emptyDir.indeterminate).toBe(false); // Default for dir
  });

  it("should calculate stats for a directory with multiple files", () => {
    const file1 = createFile(1, "dir/f1", 100, 1, true); // 100 * 1 = 100
    const file2 = createFile(2, "dir/f2", 200, 0.5, true); // 200 * 0.5 = 100
    const file3 = createFile(3, "dir/f3", 300, 0, false); // 300 * 0 = 0
    const dir = createDirectory("dir", [file1, file2, file3]);

    const stats = calculateDirStats(dir);

    expect(dir.Size).toBe(600);
    expect(dir.Progress).toBeCloseTo(0.5);
    expect(dir.Wanted).toBe(false);
    expect(dir.indeterminate).toBe(true);

    expect(stats).toEqual({
      size: 600,
      progressSum: dir.Progress,
      count: 3,
      allWanted: false,
      anyWanted: true,
    });
  });

  it("should calculate stats for nested directories", () => {
    const file1 = createFile(1, "root/sub1/f1", 100, 1, true); // Sub1: size=100, prog=1, wanted=T, ind=F
    const file2 = createFile(2, "root/sub2/f2", 200, 0.5, false); // Sub2: size=200, prog=0.5, wanted=F, ind=F
    const file3 = createFile(3, "root/f3", 300, 0.2, true); // Root file
    const sub1 = createDirectory("root/sub1", [file1]);
    const sub2 = createDirectory("root/sub2", [file2]);
    const root = createDirectory("root", [sub1, sub2, file3]);

    // Calculate stats for subdirs first (as happens recursively)
    calculateDirStats(sub1);
    expect(sub1.Size).toBe(100);
    expect(sub1.Progress).toBe(1);
    expect(sub1.Wanted).toBe(true);
    expect(sub1.indeterminate).toBe(false);

    calculateDirStats(sub2);
    expect(sub2.Size).toBe(200);
    expect(sub2.Progress).toBe(0.5);
    expect(sub2.Wanted).toBe(false);
    expect(sub2.indeterminate).toBe(false);

    // Now calculate stats for the root
    const rootStats = calculateDirStats(root);

    expect(root.Size).toBe(600);
    expect(root.Progress).toBeCloseTo(1.7 / 3);
    expect(root.Wanted).toBe(false);
    expect(root.indeterminate).toBe(true);

    expect(rootStats).toEqual({
      size: 600,
      progressSum: root.Progress,
      count: 3,
      allWanted: false,
      anyWanted: true,
    });
  });

  it("should set Wanted=true and indeterminate=false if all children are wanted", () => {
    const file1 = createFile(1, "dir/f1", 100, 1, true);
    const file2 = createFile(2, "dir/f2", 200, 0.5, true);
    const dir = createDirectory("dir", [file1, file2]);

    calculateDirStats(dir);
    expect(dir.Wanted).toBe(true);
    expect(dir.indeterminate).toBe(false);
  });

  it("should set Wanted=false and indeterminate=false if no children are wanted", () => {
    const file1 = createFile(1, "dir/f1", 100, 1, false);
    const file2 = createFile(2, "dir/f2", 200, 0.5, false);
    const dir = createDirectory("dir", [file1, file2]);

    calculateDirStats(dir);
    expect(dir.Wanted).toBe(false);
    expect(dir.indeterminate).toBe(false);
  });

  it("should handle directory with zero-size files", () => {
    const file1 = createFile(1, "dir/f1", 0, 1, true);
    const file2 = createFile(2, "dir/f2", 0, 0.5, true);
    const dir = createDirectory("dir", [file1, file2]);

    calculateDirStats(dir);
    expect(dir.Size).toBe(0);
    expect(dir.Progress).toBeCloseTo(0.75);
    expect(dir.Wanted).toBe(true);
    expect(dir.indeterminate).toBe(false);
  });
});

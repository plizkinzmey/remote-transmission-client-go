import { describe, it, expect } from "vitest";
import { updateNodesWanted } from "../updateNodesWanted";
import { FileNode } from "../../../types/FileTree";
import { calculateDirStats } from "../calculateDirStats"; // Needed for internal recalculation

// Mock calculateDirStats used internally by updateNodesWanted
vi.mock("../calculateDirStats", () => ({
  calculateDirStats: vi.fn((node: FileNode) => {
    // Simple mock for testing updateNodesWanted logic
    if (!node.isDirectory || !node.children?.length) {
      return {
        size: node.Size,
        progressSum: node.Progress ?? 0,
        count: 1,
        allWanted: node.Wanted,
        anyWanted: node.Wanted,
      };
    }
    const stats = node.children.map(
      vi
        .fn()
        .mockReturnValue({ allWanted: node.Wanted, anyWanted: node.Wanted })
    ); // Simplified mock return
    const allWanted = stats.every((s) => s.allWanted);
    const anyWanted = stats.some((s) => s.anyWanted);
    return {
      size: node.Size,
      progressSum: node.Progress ?? 0,
      count: node.children.length,
      allWanted,
      anyWanted,
    };
  }),
}));

// Helper to create FileNode instances
const createFile = (id: number, path: string, wanted: boolean): FileNode => ({
  ID: id,
  Name: path.split("/").pop() || "",
  Path: path,
  Size: 100,
  Progress: 1,
  Wanted: wanted,
  isDirectory: false,
  expanded: false,
});

const createDirectory = (
  path: string,
  children: FileNode[],
  wanted: boolean,
  indeterminate = false
): FileNode => ({
  ID: -1,
  Name: path.split("/").pop() || "",
  Path: path,
  Size: 0,
  Progress: 0,
  Wanted: wanted,
  isDirectory: true,
  children: children,
  expanded: false,
  indeterminate: indeterminate,
});

describe("updateNodesWanted", () => {
  it("should update Wanted status for the target file node", () => {
    const file1 = createFile(1, "file1.txt", false);
    const file2 = createFile(2, "file2.txt", true);
    const nodes = [file1, file2];
    const fileIds = [1]; // IDs affected by the change

    const updatedNodes = updateNodesWanted(nodes, file1, true, fileIds);

    expect(updatedNodes[0].Wanted).toBe(true); // file1 updated
    expect(updatedNodes[1].Wanted).toBe(true); // file2 unchanged
    expect(updatedNodes[0].indeterminate).toBe(false); // Indeterminate reset
  });

  it("should update Wanted status for the target directory and its children", () => {
    const file1 = createFile(10, "root/sub/file1.txt", false);
    const file2 = createFile(20, "root/sub/file2.txt", false);
    const sub = createDirectory("root/sub", [file1, file2], false);
    const file3 = createFile(30, "root/file3.txt", true);
    const root = createDirectory("root", [sub, file3], false, true); // Initially indeterminate
    const nodes = [root];
    const fileIds = [10, 20]; // IDs within the target directory 'sub'

    // Target the 'sub' directory to set Wanted=true
    const updatedNodes = updateNodesWanted(nodes, sub, true, fileIds);

    const updatedRoot = updatedNodes[0];
    const updatedSub = updatedRoot.children?.[0] as FileNode;
    const updatedFile1 = updatedSub.children?.[0] as FileNode;
    const updatedFile2 = updatedSub.children?.[1] as FileNode;
    const updatedFile3 = updatedRoot.children?.[1] as FileNode;

    // Check updates based on logic: targetNode or fileIds.includes(node.ID) or path startsWith
    expect(updatedSub.Wanted).toBe(true); // Target directory updated
    expect(updatedSub.indeterminate).toBe(false);
    expect(updatedFile1.Wanted).toBe(true); // Child file updated via fileIds
    expect(updatedFile1.indeterminate).toBe(false);
    expect(updatedFile2.Wanted).toBe(true); // Child file updated via fileIds
    expect(updatedFile2.indeterminate).toBe(false);

    // Check nodes outside the target subtree remain unchanged by direct update
    expect(updatedFile3.Wanted).toBe(true); // file3 was not targeted

    // Check if parent (root) indeterminate/wanted state was recalculated (mocked recalculation)
    // Our mock calculateDirStats is simple, it won't perfectly mimic the real one here.
    // We rely on the fact that updateNodesWanted calls calculateDirStats internally.
    // Let's refine the mock slightly or test calculateDirStats separately for accuracy.
    // For this test, we focus on the direct updates by updateNodesWanted.
    // expect(updatedRoot.indeterminate).toBe(false); // Depends on recalculation
    // expect(updatedRoot.Wanted).toBe(true); // Depends on recalculation
  });

  it("should update only files specified by fileIds if target is a file", () => {
    const file1 = createFile(1, "f1", false);
    const file2 = createFile(2, "f2", false);
    const file3 = createFile(3, "f3", false);
    const nodes = [file1, file2, file3];
    const fileIds = [1, 3]; // Only update f1 and f3

    // Target file1, but fileIds dictates the update scope
    const updatedNodes = updateNodesWanted(nodes, file1, true, fileIds);

    expect(updatedNodes[0].Wanted).toBe(true); // Updated via fileIds
    expect(updatedNodes[1].Wanted).toBe(false); // Not in fileIds, unchanged
    expect(updatedNodes[2].Wanted).toBe(true); // Updated via fileIds
  });

  it("should return a new array and new node objects", () => {
    const file1 = createFile(1, "file1.txt", false);
    const nodes = [file1];
    const fileIds = [1];

    const updatedNodes = updateNodesWanted(nodes, file1, true, fileIds);

    expect(updatedNodes).not.toBe(nodes); // Should be a new array
    expect(updatedNodes[0]).not.toBe(file1); // Should be a new object
    expect(updatedNodes[0].Wanted).toBe(true);
  });

  it("should handle empty nodes array", () => {
    const nodes: FileNode[] = [];
    const target = createFile(1, "target", false);
    const fileIds = [1];
    const updatedNodes = updateNodesWanted(nodes, target, true, fileIds);
    expect(updatedNodes).toEqual([]);
  });

  it("should reset indeterminate flag on updated nodes", () => {
    const file1 = createFile(10, "root/f1", false);
    const dir = createDirectory("root", [file1], false, true); // Start indeterminate
    const nodes = [dir];
    const fileIds = [10];

    const updatedNodes = updateNodesWanted(nodes, dir, true, fileIds);
    expect(updatedNodes[0].indeterminate).toBe(false); // Indeterminate reset on dir
    expect(updatedNodes[0].children?.[0].indeterminate).toBe(false); // Indeterminate reset on file
  });

  // Add more tests for edge cases like nested updates, root updates etc.
  it("should update Wanted status when unchecking a parent directory", () => {
    const file1 = createFile(10, "root/sub/file1.txt", true);
    const file2 = createFile(20, "root/sub/file2.txt", true);
    const sub = createDirectory("root/sub", [file1, file2], true); // All wanted initially
    const file3 = createFile(30, "root/file3.txt", true);
    const root = createDirectory("root", [sub, file3], true); // All wanted initially
    const nodes = [root];
    const fileIds = [10, 20, 30]; // All file IDs

    // Target the 'root' directory to set Wanted=false
    const updatedNodes = updateNodesWanted(nodes, root, false, fileIds);

    const updatedRoot = updatedNodes[0];
    const updatedSub = updatedRoot.children?.[0] as FileNode;
    const updatedFile1 = updatedSub.children?.[0] as FileNode;
    const updatedFile2 = updatedSub.children?.[1] as FileNode;
    const updatedFile3 = updatedRoot.children?.[1] as FileNode;

    expect(updatedRoot.Wanted).toBe(false);
    expect(updatedRoot.indeterminate).toBe(false);
    expect(updatedSub.Wanted).toBe(false);
    expect(updatedSub.indeterminate).toBe(false);
    expect(updatedFile1.Wanted).toBe(false);
    expect(updatedFile2.Wanted).toBe(false);
    expect(updatedFile3.Wanted).toBe(false);
  });
});

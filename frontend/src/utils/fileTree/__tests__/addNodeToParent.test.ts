import { describe, it, expect } from "vitest";
import { addNodeToParent } from "../addNodeToParent";
import { FileNode } from "../../../types/FileTree";

// Helper to create a simple FileNode for testing
const createNode = (path: string, isDirectory = false): FileNode => ({
  ID: isDirectory ? -1 : Math.floor(Math.random() * 1000),
  Name: path.split("/").pop() || "",
  Path: path,
  Size: isDirectory ? 0 : 100,
  Progress: isDirectory ? 0 : 1,
  Wanted: true,
  isDirectory: isDirectory,
  children: isDirectory ? [] : undefined,
  expanded: false,
});

describe("addNodeToParent", () => {
  it("should add a child node to the parent's children array", () => {
    const parent = createNode("parentDir", true);
    const child = createNode("parentDir/childFile");
    const root: { [path: string]: FileNode } = {
      parentDir: parent,
    };

    addNodeToParent(root, child, "parentDir");

    expect(parent.children).toBeDefined();
    expect(parent.children).toHaveLength(1);
    expect(parent.children?.[0]).toBe(child);
  });

  it("should add multiple child nodes to the parent", () => {
    const parent = createNode("root", true);
    const child1 = createNode("root/file1.txt");
    const child2 = createNode("root/subdir", true);
    const root: { [path: string]: FileNode } = {
      root: parent,
    };

    addNodeToParent(root, child1, "root");
    addNodeToParent(root, child2, "root");

    expect(parent.children).toHaveLength(2);
    expect(parent.children).toContain(child1);
    expect(parent.children).toContain(child2);
  });

  it("should do nothing if the parent node does not exist in root", () => {
    const child = createNode("nonexistentParent/child");
    const root: { [path: string]: FileNode } = {}; // Parent not in root

    // No error should be thrown
    expect(() =>
      addNodeToParent(root, child, "nonexistentParent")
    ).not.toThrow();
  });

  it("should do nothing if the parent node is not a directory (no children array)", () => {
    const parentFile = createNode("parentFile.txt"); // Not a directory
    const child = createNode("parentFile.txt/child"); // Invalid path, but for testing
    const root: { [path: string]: FileNode } = {
      "parentFile.txt": parentFile,
    };

    addNodeToParent(root, child, "parentFile.txt");

    // parentFile.children should remain undefined
    expect(parentFile.children).toBeUndefined();
  });

  it("should handle cases where parent exists but children array is missing (though unlikely with createNode)", () => {
    const parent: FileNode = {
      ID: -1,
      Name: "parent",
      Path: "parent",
      Size: 0,
      Progress: 0,
      Wanted: false,
      isDirectory: true,
      // children: undefined, // Explicitly undefined
    };
    const child = createNode("parent/child");
    const root: { [path: string]: FileNode } = {
      parent: parent,
    };

    addNodeToParent(root, child, "parent");

    // Should still not add the child if children array is missing
    expect(parent.children).toBeUndefined();
  });
});

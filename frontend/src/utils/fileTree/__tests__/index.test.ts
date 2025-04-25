import { describe, it, expect } from "vitest";

// Import all exports from the index file
import * as fileTreeUtils from "../index";

// Optionally, import originals for comparison if needed, though checking existence is primary
import { addNodeToParent as originalAddNodeToParent } from "../addNodeToParent";
import { buildFileTree as originalBuildFileTree } from "../buildFileTree";
import { calculateDirStats as originalCalculateDirStats } from "../calculateDirStats";
import { collectFileIds as originalCollectFileIds } from "../collectFileIds";
import { createNodeForPath as originalCreateNodeForPath } from "../createNodeForPath";
import { formatFileSize as originalFormatFileSize } from "../formatFileSize";
import { updateNodesWanted as originalUpdateNodesWanted } from "../updateNodesWanted";

describe("fileTree index", () => {
  it("should export addNodeToParent function", () => {
    expect(fileTreeUtils.addNodeToParent).toBeDefined();
    expect(typeof fileTreeUtils.addNodeToParent).toBe("function");
    expect(fileTreeUtils.addNodeToParent).toBe(originalAddNodeToParent);
  });

  it("should export buildFileTree function", () => {
    expect(fileTreeUtils.buildFileTree).toBeDefined();
    expect(typeof fileTreeUtils.buildFileTree).toBe("function");
    expect(fileTreeUtils.buildFileTree).toBe(originalBuildFileTree);
  });

  it("should export calculateDirStats function", () => {
    expect(fileTreeUtils.calculateDirStats).toBeDefined();
    expect(typeof fileTreeUtils.calculateDirStats).toBe("function");
    expect(fileTreeUtils.calculateDirStats).toBe(originalCalculateDirStats);
  });

  it("should export collectFileIds function", () => {
    expect(fileTreeUtils.collectFileIds).toBeDefined();
    expect(typeof fileTreeUtils.collectFileIds).toBe("function");
    expect(fileTreeUtils.collectFileIds).toBe(originalCollectFileIds);
  });

  it("should export createNodeForPath function", () => {
    expect(fileTreeUtils.createNodeForPath).toBeDefined();
    expect(typeof fileTreeUtils.createNodeForPath).toBe("function");
    expect(fileTreeUtils.createNodeForPath).toBe(originalCreateNodeForPath);
  });

  it("should export formatFileSize function", () => {
    expect(fileTreeUtils.formatFileSize).toBeDefined();
    expect(typeof fileTreeUtils.formatFileSize).toBe("function");
    expect(fileTreeUtils.formatFileSize).toBe(originalFormatFileSize);
  });

  it("should export updateNodesWanted function", () => {
    expect(fileTreeUtils.updateNodesWanted).toBeDefined();
    expect(typeof fileTreeUtils.updateNodesWanted).toBe("function");
    expect(fileTreeUtils.updateNodesWanted).toBe(originalUpdateNodesWanted);
  });

  // Type exports cannot be directly tested at runtime in JS/TS tests easily.
  // The fact that the import works without TS errors is the primary check.
  it("should allow importing types (compile-time check)", () => {
    // This test mainly serves as a placeholder to acknowledge type exports.
    // We can declare variables with the types to ensure they are available.
    let node: fileTreeUtils.FileNode | undefined;
    let file: fileTreeUtils.TorrentFile | undefined;
    let stats: fileTreeUtils.DirStats | undefined;
    expect(true).toBe(true); // Dummy assertion
  });
});

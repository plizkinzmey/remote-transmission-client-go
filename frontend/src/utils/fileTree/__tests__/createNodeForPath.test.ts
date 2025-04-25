import { describe, it, expect } from "vitest";
import { createNodeForPath } from "../createNodeForPath";
import { TorrentFile } from "../../../types/FileTree";

const mockTorrentFile: TorrentFile = {
  ID: 123,
  Name: "file.txt", // This might differ from partName
  Path: "dir/subdir/file.txt",
  Size: 1024,
  Progress: 0.5,
  Wanted: true,
};

describe("createNodeForPath", () => {
  it("should create a file node correctly", () => {
    const partName = "file.txt";
    const fullPath = "dir/subdir/file.txt";
    const isFile = true;

    const node = createNodeForPath(mockTorrentFile, partName, fullPath, isFile);

    expect(node.ID).toBe(mockTorrentFile.ID);
    expect(node.Name).toBe(partName);
    expect(node.Path).toBe(fullPath);
    expect(node.Size).toBe(mockTorrentFile.Size);
    expect(node.Progress).toBe(mockTorrentFile.Progress);
    expect(node.Wanted).toBe(mockTorrentFile.Wanted);
    expect(node.isDirectory).toBe(false);
    expect(node.children).toBeUndefined();
    expect(node.expanded).toBe(false); // Default expanded state
  });

  it("should create a directory node correctly", () => {
    const partName = "subdir";
    const fullPath = "dir/subdir";
    const isFile = false;

    // TorrentFile data is less relevant for directory creation but passed anyway
    const node = createNodeForPath(mockTorrentFile, partName, fullPath, isFile);

    expect(node.ID).toBe(-1); // Directories have ID -1
    expect(node.Name).toBe(partName);
    expect(node.Path).toBe(fullPath);
    expect(node.Size).toBe(0); // Directories have Size 0 initially
    expect(node.Progress).toBe(0); // Directories have Progress 0 initially
    expect(node.Wanted).toBe(false); // Directories default to Wanted: false
    expect(node.isDirectory).toBe(true);
    expect(node.children).toEqual([]); // Directories have an empty children array
    expect(node.expanded).toBe(false); // Default expanded state
  });

  it("should handle root directory creation", () => {
    const partName = "root";
    const fullPath = "root";
    const isFile = false;

    const node = createNodeForPath(mockTorrentFile, partName, fullPath, isFile);

    expect(node.ID).toBe(-1);
    expect(node.Name).toBe(partName);
    expect(node.Path).toBe(fullPath);
    expect(node.isDirectory).toBe(true);
    expect(node.children).toEqual([]);
    expect(node.Wanted).toBe(false);
    expect(node.expanded).toBe(false);
  });

  it("should handle file in root directory", () => {
    const partName = "rootfile.iso";
    const fullPath = "rootfile.iso";
    const isFile = true;
    const rootFileTorrent: TorrentFile = {
      ID: 5,
      Name: "rootfile.iso",
      Path: "rootfile.iso",
      Size: 5000,
      Progress: 0,
      Wanted: false,
    };

    const node = createNodeForPath(rootFileTorrent, partName, fullPath, isFile);

    expect(node.ID).toBe(rootFileTorrent.ID);
    expect(node.Name).toBe(partName);
    expect(node.Path).toBe(fullPath);
    expect(node.Size).toBe(rootFileTorrent.Size);
    expect(node.Progress).toBe(rootFileTorrent.Progress);
    expect(node.Wanted).toBe(rootFileTorrent.Wanted);
    expect(node.isDirectory).toBe(false);
    expect(node.children).toBeUndefined();
    expect(node.expanded).toBe(false);
  });
});

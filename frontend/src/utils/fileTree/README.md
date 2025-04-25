# File Tree Utilities

This module provides a set of utility functions for building, manipulating, and analyzing the file tree structure of torrents within the Transmission Client frontend.

## Overview

The core functionality revolves around transforming the flat list of files received from the backend into a hierarchical tree structure (`FileNode[]`) suitable for display and interaction in the UI (e.g., in the `TorrentContent` component).

## Key Functions

-   **`buildFileTree(files: TorrentFile[]): FileNode[]`**:
    The main function to construct the file tree. It takes an array of `TorrentFile` objects, sorts them by path, creates `FileNode` instances for directories and files, establishes parent-child relationships, and calculates initial directory statistics. It utilizes `createNodeForPath`, `addNodeToParent`, and `calculateDirStats`.

-   **`calculateDirStats(node: FileNode): DirStats`**:
    Recursively calculates aggregated statistics (total size, average progress, total file count, and `Wanted`/`indeterminate` status) for a directory node based on its children. Updates the directory node's `Size`, `Progress`, `Wanted`, and `indeterminate` properties.

-   **`updateNodesWanted(nodes: FileNode[], targetNode: FileNode, wanted: boolean, fileIds: number[]): FileNode[]`**:
    Recursively updates the `Wanted` status of a target node and its descendants (if it's a directory) or specific file nodes based on provided IDs. Returns a *new* array of nodes with updated statuses. It also recalculates the `Wanted` and `indeterminate` status for parent directories affected by the change.

-   **`collectFileIds(node: FileNode): number[]`**:
    Recursively collects the IDs of all *files* within a given node (and its children if it's a directory).

-   **`formatFileSize(size: number | undefined): string`**:
    Formats a file size (in bytes) into a human-readable string using binary prefixes (B, KiB, MiB, GiB, TiB) with two decimal places. Handles `undefined` or non-positive inputs gracefully.

-   **`createNodeForPath(file: TorrentFile, partName: string, fullPath: string, isFile: boolean): FileNode`**:
    A helper function used by `buildFileTree` to create a single `FileNode` instance, initializing its properties based on whether it represents a file or a directory.

-   **`addNodeToParent(root: { [path: string]: FileNode }, node: FileNode, parentPath: string): void`**:
    A helper function used by `buildFileTree` to add a newly created node to the `children` array of its parent node within the `root` lookup object.

## Usage

These utilities are primarily used by components responsible for displaying torrent contents, such as `TorrentContent`, to build the file tree and handle user interactions like selecting/deselecting files for download.

```typescript
import { buildFileTree, updateNodesWanted, collectFileIds, TorrentFile, FileNode } from './index'; // Assuming import from this directory's index

// Example: Building the tree
const filesFromBackend: TorrentFile[] = [/* ... array of TorrentFile objects ... */];
let fileTree: FileNode[] = buildFileTree(filesFromBackend);

// Example: Handling a user toggling a node's 'Wanted' status
const handleToggleWanted = (nodeToToggle: FileNode) => {
  const newWantedStatus = !nodeToToggle.Wanted;
  const idsToUpdate = collectFileIds(nodeToToggle); // Get IDs of files affected

  // Update the tree state (assuming 'fileTree' is managed by React state)
  const updatedTree = updateNodesWanted(fileTree, nodeToToggle, newWantedStatus, idsToUpdate);
  // setFileTree(updatedTree); // Update React state

  // Send updated file IDs and their 'wanted' status to the backend...
};
```

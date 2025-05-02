# File Tree Utilities

This module provides a set of utility functions for building, manipulating, and analyzing the file tree structure of torrents within the Transmission Client frontend.

## Overview

The core functionality revolves around transforming the flat list of files received from the backend into a hierarchical tree structure (`FileNode[]`) suitable for display and interaction in the UI (e.g., in the `TorrentContent` component).

## Key Functions

- **`buildFileTree(files: TorrentFile[]): FileNode[]`**:
    The main function to construct the file tree. It takes an array of `TorrentFile` objects, sorts them by path, creates `FileNode` instances for directories and files, establishes parent-child relationships, and calculates initial directory statistics. It utilizes `createNodeForPath`, `addNodeToParent`, and `calculateDirStats`.

- **`calculateDirStats(node: FileNode): DirStats`**:
    Recursively calculates aggregated statistics (total size, average progress, total file count, and `Wanted`/`indeterminate` status) for a directory node based on its children. Updates the directory node's `Size`, `Progress`, `Wanted`, and `indeterminate` properties.

- **`updateNodesWanted(nodes: FileNode[], targetNode: FileNode, wanted: boolean, fileIds: number[]): FileNode[]`**:
    Updates the `Wanted` status for the target node and its children, recursively updating parent nodes to maintain state consistency. Collects and returns an array of file IDs that need updating on the backend.

## Usage

```typescript
// Import the necessary functions
import { buildFileTree, updateNodesWanted } from '../utils/fileTree';

// Example usage for building a torrent's file tree
const torrentFiles = await GetTorrentFiles(torrentId);
const fileTree = buildFileTree(torrentFiles);

// Updating selected files status
const handleToggleWanted = (node: FileNode, wanted: boolean) => {
  // Create a deep copy to maintain immutability
  const updatedTree = [...fileTree];
  // Array to collect file IDs that need updating
  const fileIds = [];
  // Update nodes and collect affected file IDs
  updateNodesWanted(updatedTree, node, wanted, fileIds);
  
  // Update file statuses on the backend
  if (fileIds.length > 0) {
    await SetFilesWanted(torrentId, fileIds, wanted);
  }
  
  // Update the file tree state in the component
  setFileTree(updatedTree);
};
```

## Data Structures

### TorrentFile (input from backend)

```typescript
interface TorrentFile {
  Id: number;            // Unique file ID
  Path: string;          // Full file path including name
  Name: string;          // File name
  Size: number;          // File size in bytes
  Progress: number;      // Download progress (0-1)
  Wanted: boolean;       // Whether the file is selected for download
}
```

### FileNode (internal tree representation)

```typescript
interface FileNode {
  Id?: number;           // File ID (only for files, not directories)
  Path: string;          // Full path of the node
  Name: string;          // File or directory name
  Size?: number;         // File size or directory total size
  Progress?: number;     // File download progress or directory average progress
  Wanted: boolean;       // Download selection status
  indeterminate?: boolean; // Intermediate state (for directories)
  isDirectory: boolean;  // Whether the node is a directory
  children?: FileNode[]; // Child nodes for directories
  parent?: FileNode;     // Reference to parent node
}
```

### DirStats (internal directory aggregation structure)

```typescript
interface DirStats {
  size: number;          // Total size
  progressSum: number;   // Weighted progress sum
  count: number;         // File count
  allWanted: boolean;    // Whether all files are wanted
  anyWanted: boolean;    // Whether any files are wanted
}
```

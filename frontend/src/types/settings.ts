/**
 * Represents the changes to download paths to be saved.
 */
export interface PathChanges {
  pathsToAdd: string[];
  pathsToRemove: string[];
  defaultPath: string | null; // null if default path hasn't changed
}

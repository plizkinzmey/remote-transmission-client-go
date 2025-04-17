# `PathsTab` Component

## Overview

The `PathsTab` component provides a user interface within the application settings for managing download paths. It allows users to:

- View the list of saved download paths.
- See the current default download path (marked with a star).
- Add new download paths with validation.
- Remove existing download paths with confirmation.
- Set any saved path as the default download path.

## Props

- `onPathsChanged?: (hasChanges: boolean) => void;`
  - An optional callback function that is invoked whenever the pending changes state (additions, removals, default path change) is updated. It receives a boolean indicating whether there are unsaved changes.

## Ref Handle (`PathsTabRef`)

The component uses `forwardRef` and exposes the following methods and properties through its ref:

- `saveChanges: () => Promise<void>;`
  - Asynchronously saves all pending changes (added paths, removed paths, new default path) by calling the backend.
- `resetChanges: () => void;`
  - Discards all pending changes and reverts the displayed paths and default path to their state when the component was loaded or last saved.
- `getPathChanges: () => { pathsToAdd: string[]; pathsToRemove: string[]; defaultPath: string | null; };`
  - Returns an object containing the lists of paths pending addition and removal, and the path selected as the new default (or `null` if the default hasn't changed).
- `hasChanges: boolean;`
  - A boolean property indicating if there are any pending changes that haven't been saved.

## Custom Hook: `usePathsManagement`

All the state management logic, including fetching paths, handling user interactions (add, remove, set default), validation, tracking pending changes, and communicating with the backend (via Wails functions), is encapsulated within the `usePathsManagement` custom hook (`./hooks/usePathsManagement.ts`). The `PathsTab` component primarily consumes the state and functions returned by this hook to render the UI.

## Usage Example

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { PathsTab, PathsTabRef } from './PathsTab'; // Assuming index.ts re-exports
import { Button } from '@radix-ui/themes';

function SettingsDialog() {
  const pathsTabRef = useRef<PathsTabRef>(null);
  const [hasPathChanges, setHasPathChanges] = useState(false);

  const handleSaveChanges = async () => {
    if (pathsTabRef.current) {
      try {
        await pathsTabRef.current.saveChanges();
        console.log('Path changes saved successfully!');
        setHasPathChanges(false); // Reset changes indicator
      } catch (error) {
        console.error('Failed to save path changes:', error);
        // Handle error display
      }
    }
  };

  const handleCancelChanges = () => {
    if (pathsTabRef.current) {
      pathsTabRef.current.resetChanges();
      setHasPathChanges(false); // Reset changes indicator
    }
  };

  // Update local state when changes occur in PathsTab
  const handlePathsChanged = (changesExist: boolean) => {
    setHasPathChanges(changesExist);
  };

  // Alternatively, check the ref directly when needed
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (pathsTabRef.current) {
  //       setHasPathChanges(pathsTabRef.current.hasChanges);
  //     }
  //   }, 500); // Check periodically or based on events
  //   return () => clearInterval(interval);
  // }, []);


  return (
    <div>
      <h2>Settings</h2>
      {/* Other settings tabs */}
      <PathsTab ref={pathsTabRef} onPathsChanged={handlePathsChanged} />
      {/* Other settings tabs */}

      <div style={{ marginTop: '20px' }}>
        <Button onClick={handleSaveChanges} disabled={!hasPathChanges}>
          Save Path Changes
        </Button>
        <Button onClick={handleCancelChanges} disabled={!hasPathChanges} variant="soft" color="gray">
          Cancel Path Changes
        </Button>
      </div>
    </div>
  );
}

export default SettingsDialog;
```

## Styling

Component-specific styles are defined in `PathsTab.module.css` using CSS Modules.

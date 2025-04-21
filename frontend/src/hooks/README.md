# Custom Hooks

This directory contains custom React hooks used throughout the Transmission Client frontend application.

## Available Hooks

### `useBulkOperations`

Manages bulk operations (start, stop, remove, set speed limit) for selected torrents.

**Purpose:**

-   Provides functions to initiate bulk actions on a set of selected torrents.
-   Tracks the progress of `start` and `stop` operations by monitoring torrent status changes.
-   Handles API calls to the backend for executing these operations.
-   Manages loading states (`bulkOperations`) and error reporting (`error`) for these operations.

**Parameters:**

-   `torrents` (`TorrentData[]`): An array of all currently displayed torrents.
-   `selectedTorrents` (`Set<number>`): A Set containing the IDs of the currently selected torrents.
-   `refreshTorrents` (`() => Promise<void>`): A callback function to refresh the torrent list after an operation completes or fails.
-   `config` (`Config | undefined`): The application configuration object, required for the `handleSetSpeedLimit` operation. Contains `slowSpeedLimit` and `slowSpeedUnit`.

**Returns:** (`object`)

-   `bulkOperations` (`BulkOperationsState`): An object indicating which bulk operations are currently in progress (`start`, `stop`, `remove`, `speedLimit`).
-   `error` (`string | null`): An error message if a bulk operation failed, otherwise `null`.
-   `handleStartSelected` (`() => Promise<void>`): Function to start the selected torrents that are currently stopped.
-   `handleStopSelected` (`() => Promise<void>`): Function to stop the selected torrents that are currently running (downloading or seeding).
-   `handleRemoveSelected` (`(deleteData?: boolean) => Promise<void>`): Function to remove the selected torrents. Optionally accepts `deleteData` (default `false`) to also delete the downloaded files.
-   `handleSetSpeedLimit` (`(isSlowMode: boolean) => Promise<void>`): Function to enable or disable the slow speed limit for the selected torrents based on the `isSlowMode` argument and the `config` object.

**Example Usage:**

```typescript
import { useBulkOperations } from '@hooks/useBulkOperations';
import { useTorrentData } from '@hooks/useTorrentData'; // Assuming this hook provides torrents and refresh logic

function TorrentToolbar({ selectedTorrents, config }) {
  const { torrents, refreshTorrents } = useTorrentData(); // Get torrents and refresh function
  const {
    bulkOperations,
    error,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit,
  } = useBulkOperations(torrents, selectedTorrents, refreshTorrents, config);

  return (
    <div>
      <button onClick={handleStartSelected} disabled={bulkOperations.start}>
        {bulkOperations.start ? 'Starting...' : 'Start'}
      </button>
      <button onClick={handleStopSelected} disabled={bulkOperations.stop}>
        {bulkOperations.stop ? 'Stopping...' : 'Stop'}
      </button>
      <button onClick={() => handleRemoveSelected(false)} disabled={bulkOperations.remove}>
        {bulkOperations.remove ? 'Removing...' : 'Remove'}
      </button>
      {/* ... other buttons ... */}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
    </div>
  );
}
```

---

*(Add descriptions for other hooks here as they are created/refactored)*

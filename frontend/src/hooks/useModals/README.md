# `useModals` Hook

## Overview

The `useModals` hook is responsible for managing the visibility state of various modals within the application, specifically the Settings modal and the Add Torrent modal.

It also handles the application's first-start logic (showing the Settings modal automatically) and processes torrent file inputs, both from drag-and-drop actions and from `torrent-opened` events emitted by the backend.

## Usage

Import the hook and destructure the required state variables and functions:

```typescript
import { useModals } from '@/hooks/useModals';

function MyComponent() {
  const {
    showSettings,
    showAddTorrent,
    openSettings,
    closeSettings,
    openAddTorrent,
    closeAddTorrent,
    // ... other properties if needed
  } = useModals();

  // Use the state and functions to control modals
  return (
    <div>
      <button onClick={openSettings}>Open Settings</button>
      {/* Render SettingsModal based on showSettings */}

      <button onClick={openAddTorrent}>Add Torrent Manually</button>
      {/* Render AddTorrentModal based on showAddTorrent */}
    </div>
  );
}
```

## Return Value (`UseModalsReturn`)

The hook returns an object with the following properties:

-   `showSettings: boolean`: Whether the settings modal is currently visible.
-   `showAddTorrent: boolean`: Whether the add torrent modal is currently visible.
-   `torrentFilePath: string | null`: The file path of a torrent received via the `torrent-opened` event. `null` otherwise.
-   `isFirstStart: boolean`: `true` if the application detected it's running for the first time (no config found), `false` otherwise.
-   `torrentFileData: TorrentFileData | null`: An object `{ name: string, data: string }` containing the name and base64 data of a torrent file dropped onto the application. `null` otherwise.
-   `checkFirstStart: (isReconnecting: boolean) => Promise<void>`: An async function to check if it's the first start. It attempts to load the configuration. If no config is found or loading fails, it sets `isFirstStart` and `showSettings` to `true`. Should typically be called once when the application loads. The `isReconnecting` parameter should be `true` if the check is happening during a reconnection attempt, to avoid incorrectly triggering the first-start logic.
-   `handleSuccessfulSettingsSave: () => void`: A function to call after the user successfully saves settings for the first time. It sets `isFirstStart` and `showSettings` to `false`.
-   `openSettings: () => void`: Opens the settings modal (`showSettings = true`).
-   `closeSettings: () => void`: Closes the settings modal (`showSettings = false`), but only if `isFirstStart` is `false`.
-   `openAddTorrent: () => void`: Opens the add torrent modal (`showAddTorrent = true`).
-   `closeAddTorrent: () => void`: Closes the add torrent modal (`showAddTorrent = false`) and resets `torrentFilePath` and `torrentFileData` to `null`.
-   `handleTorrentFileDrop: (fileName: string, fileData: string) => void`: Handles a dropped torrent file. It sets `torrentFileData` with the provided name and base64 data, and opens the add torrent modal (`showAddTorrent = true`).

## Dependencies

-   `@wailsjs/runtime`: Used for `EventsOn` to listen for backend events (`torrent-opened`).
-   `@wailsjs/go/main/App`: Used for `LoadConfig` to check for existing configuration during the first start check.

## First Start Logic

1.  The `checkFirstStart` function is called (usually on app load).
2.  It attempts to load the configuration using `LoadConfig`.
3.  If `LoadConfig` returns `null`, `undefined`, or throws an error, the hook assumes it's the first time the application is running.
4.  `isFirstStart` is set to `true`.
5.  `showSettings` is set to `true`, automatically opening the settings modal.
6.  The `closeSettings` function will *not* close the modal while `isFirstStart` is `true`.
7.  After the user saves the initial settings, `handleSuccessfulSettingsSave` should be called.
8.  This sets `isFirstStart` to `false` and closes the settings modal (`showSettings = false`).
9.  Subsequent calls to `closeSettings` will now work as expected.

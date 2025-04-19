# Settings Component

## Overview

The `Settings` component provides a modal dialog for configuring the application's settings. It allows users to manage connection details, download/upload limits, and storage paths. It handles loading existing settings, validating user input, testing the connection, saving changes, and managing loading/error states. It can be displayed automatically on the first application start or opened manually by the user.

## Props

-   `isOpen` (boolean): Controls the visibility of the settings modal.
-   `onOpenChange` (function): Callback function invoked when the modal's open state changes (e.g., when closed by the user).
-   `isFirstStart` (boolean, optional): If `true`, the modal is displayed in a "first start" mode, preventing dismissal until settings are saved and the connection is verified. Defaults to `false`.

## Usage

```tsx
import { useState } from 'react';
import { Settings } from './Settings';
import { Button } from '@/components/ui/button'; // Assuming a Button component exists

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirstStart, setIsFirstStart] = useState(checkIfFirstStart()); // Logic to determine if it's the first start

  return (
    <div>
      <Button onClick={() => setIsSettingsOpen(true)}>Open Settings</Button>
      <Settings
        isOpen={isSettingsOpen || isFirstStart}
        onOpenChange={setIsSettingsOpen}
        isFirstStart={isFirstStart}
      />
      {/* Other application content */}
    </div>
  );
}
```

## Internal Hooks

The component utilizes several custom hooks to manage its logic:

-   `useSettingsLoader`: Handles loading the initial settings from the backend and manages the `isLoading` state.
-   `useSettingsState`: Manages the core state of the settings form, including the `settings` object, validation `errors`, connection status (`isConnectionValid`, `connectionErrorMessage`), and pending path changes (`hasPendingPathsChanges`). It also provides the `handleSettingsChange` callback.
-   `useConnectionTester`: Encapsulates the logic for testing the connection to the Transmission server based on the current settings.
-   `useSettingsSaver`: Manages the saving process, including validation, interaction with the `PathsTab` for path changes, calling the backend `SaveAllSettings` function, and handling the `isSaving` state and save errors.

## Subcomponents

The settings are organized into tabs:

-   `ConnectionTab`: For configuring server address, port, username, and password.
-   `LimitsTab`: For setting global and per-torrent speed limits and connection limits.
-   `PathsTab`: For managing download directories and incomplete file locations.

## State Management

The primary state (`settings`, `errors`, etc.) is managed within the `useSettingsState` hook. Loading and saving states (`isLoading`, `isSaving`) are managed by `useSettingsLoader` and `useSettingsSaver` respectively. The overall open/closed state of the modal is controlled externally via the `isOpen` and `onOpenChange` props.

## Error Handling

-   **Loading Errors:** Handled within `useSettingsLoader` and typically displayed as a general error message within the modal.
-   **Validation Errors:** Calculated by `validateSettings` (used by `useSettingsSaver` and potentially `useSettingsState`) and displayed inline within the relevant tabs.
-   **Connection Test Errors:** Handled by `useConnectionTester` and displayed near the connection test button.
-   **Saving Errors:** Handled by `useSettingsSaver` and displayed as a general error message.
-   Status messages (loading, saving, success, error) are often shown using the `StatusMessage` component.

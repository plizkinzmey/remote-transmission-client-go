# useNotification Hook

## Purpose

The `useNotification` hook provides a way to show native operating system notifications from within the application. This hook acts as a wrapper around the Go backend function that triggers native notifications, providing a more convenient API and error handling.

## API

```typescript
const { 
  showSuccess, 
  showError, 
  showInfo, 
  showWarning, 
  showFormatted 
} = useNotification();
```

### Functions

- `showSuccess(title: string, message: string)`: Shows a success notification (green)
- `showError(title: string, message: string)`: Shows an error notification (red)
- `showInfo(title: string, message: string)`: Shows an informational notification (blue)
- `showWarning(title: string, message: string)`: Shows a warning notification (orange)
- `showFormatted(title: string, messageKey: string, formatValues: Record<string, string | number>, level: NotificationLevel)`: Shows a notification with localized text and format value substitution

### Types

- `NotificationLevel`: Union type of string literals: `"info" | "success" | "warning" | "error"`
- `UseNotificationResult`: Interface containing all functions returned by the hook

## Usage Examples

### Basic Usage

```tsx
import React from 'react';
import { useNotification } from '@/hooks/useNotification';

const MyComponent: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess("Success", "Data saved successfully");
    } catch (error) {
      showError("Error", "Failed to save data");
    }
  };
  
  return (
    <button onClick={handleSave}>Save</button>
  );
};
```

### Using Localized Messages

```tsx
import React from 'react';
import { useNotification } from '@/hooks/useNotification';

const TorrentList: React.FC = () => {
  const { showFormatted } = useNotification();
  
  const handleDownloadComplete = (torrentName: string) => {
    showFormatted(
      "Download Complete",
      "torrent.downloadComplete", 
      { name: torrentName },
      "success"
    );
  };
  
  return (
    // Component content
  );
};
```

## Implementation Details

- Uses the Go backend function `ShowNotification` from the Wails API
- Provides error handling for failed notifications
- Integrates with the application's localization system
- Returns memoized functions to prevent unnecessary re-renders
- Logs errors to both the Wails runtime log and the console

## Error Handling

If the notification system fails (e.g., the OS notification system is unavailable), the error is:

1. Logged via Wails `LogError`
2. Logged to the console
3. Silently handled (no exceptions thrown to the caller)

## Dependencies

- `@wailsjs/go/main/App` - For calling the Go backend notification function
- `@wailsjs/runtime` - For access to logging functions
- `@/contexts/LocalizationContext` - For localization of messages
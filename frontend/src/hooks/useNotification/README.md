# useNotification Hook

## Purpose

The `useNotification` hook provides a way to show native operating system notifications from within the application with full localization support. This hook acts as a wrapper around the Go backend function that triggers native notifications, providing a convenient API for localized notifications with error handling.

## API

```typescript
const { 
  showSuccess, 
  showError, 
  showInfo, 
  showWarning, 
  showFormatted,
  showDirect
} = useNotification();
```

### Functions

- `showSuccess(titleKey: string, messageKey: string, formatValues?: Record<string, string | number>)`: Shows a success notification (green) with localized title and message
- `showError(titleKey: string, messageKey: string, formatValues?: Record<string, string | number>)`: Shows an error notification (red) with localized title and message
- `showInfo(titleKey: string, messageKey: string, formatValues?: Record<string, string | number>)`: Shows an informational notification (blue) with localized title and message
- `showWarning(titleKey: string, messageKey: string, formatValues?: Record<string, string | number>)`: Shows a warning notification (orange) with localized title and message
- `showFormatted(titleKey: string, messageKey: string, formatValues: Record<string, string | number>, level: NotificationLevel)`: Shows a notification with localized title and message with format value substitution
- `showDirect(title: string, message: string, level: NotificationLevel)`: Shows a notification with direct strings without localization (for special cases)

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
      showSuccess("notifications.successTitle", "notifications.dataSaved");
    } catch (error) {
      showError("notifications.errorTitle", "notifications.saveFailed");
    }
  };
  
  return (
    <button onClick={handleSave}>Save</button>
  );
};
```

### Using Format Values

```tsx
import React from 'react';
import { useNotification } from '@/hooks/useNotification';

const TorrentList: React.FC = () => {
  const { showSuccess } = useNotification();
  
  const handleDownloadComplete = (torrentName: string) => {
    showSuccess(
      "notifications.downloadCompleteTitle",
      "notifications.downloadCompleteMessage", 
      { name: torrentName }
    );
  };
  
  return (
    // Component content
  );
};
```

### Using Direct Notification (Without Localization)

```tsx
import React from 'react';
import { useNotification } from '@/hooks/useNotification';

const DebugComponent: React.FC = () => {
  const { showDirect } = useNotification();
  
  const showDebugInfo = (info: string) => {
    showDirect(
      "Debug Info",
      info,
      "info"
    );
  };
  
  return (
    <button onClick={() => showDebugInfo("Some technical information")}>Show Debug Info</button>
  );
};
```

## Implementation Details

- Uses the Go backend function `ShowNotification` from the Wails API
- Provides error handling for failed notifications
- Fully integrates with the application's localization system
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

## Notes

1. For all methods except `showDirect`, you should provide localization keys, not direct strings.
2. The display of native notifications depends on the operating system availability and permissions. If you encounter issues with notifications, check your system notification settings.
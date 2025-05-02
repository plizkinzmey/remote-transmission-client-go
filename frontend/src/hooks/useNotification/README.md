# useNotification Hook

This custom hook provides a standardized way to display notifications in the application by wrapping the native notification API provided by the Go backend.

## Features

- Display notifications with different severity levels (success, error, warning, info)
- Localized notification messages
- Integration with the application's notification system
- Automatic error handling

## Usage

```tsx
import { useNotification } from './useNotification';

const YourComponent = () => {
  const { showNotification } = useNotification();
  
  const handleSuccess = () => {
    showNotification({
      title: 'Operation Successful',
      message: 'Your action was completed successfully',
      level: 'success'
    });
  };
  
  const handleError = (error) => {
    showNotification({
      title: 'Error',
      message: error.message || 'An unknown error occurred',
      level: 'error'
    });
  };
  
  return (
    <button onClick={handleSuccess}>Trigger Notification</button>
  );
};
```

## API

### NotificationOptions

```tsx
interface NotificationOptions {
  title: string;         // Notification title
  message: string;       // Notification message body
  level: 'success' | 'error' | 'warning' | 'info'; // Severity level
}
```

### Return Value

```tsx
interface UseNotificationReturn {
  showNotification: (options: NotificationOptions) => Promise<void>;
}
```

## Implementation Details

The hook utilizes the Wails binding to the Go backend's `ShowNotification` function, which displays native OS notifications. It gracefully handles any errors that might occur during notification display.

## Error Handling

If the notification system encounters an error when attempting to show a notification, it will:

1. Log the error to the console
2. Prevent the error from propagating to the calling component
3. Return a resolved promise to maintain the API contract

This ensures that notification failures don't disrupt the application's functionality.
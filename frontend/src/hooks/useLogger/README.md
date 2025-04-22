# `useLogger` Hook

This hook provides a simple logging utility that automatically prepends a context (typically the component name) to each log message before sending it to the Wails runtime logger.

## Usage

Import the hook and call it within your functional component, providing a context string.

```typescript
import React from 'react';
import { useLogger } from '@/hooks/useLogger'; // Adjust the import path as needed

const MyComponent: React.FC = () => {
  const logger = useLogger('MyComponent');

  const handleClick = () => {
    logger.info('Button clicked');
    // Logs: [MyComponent] Button clicked

    try {
      // Some operation that might fail
      throw new Error('Something went wrong');
    } catch (error) {
      logger.error('Operation failed', { error });
      // Logs: [MyComponent] Operation failed {"error":{}}
    }
  };

  return <button onClick={handleClick}>Click Me</button>;
};

export default MyComponent;
```

## API

### `useLogger(context: string): Logger`

-   **`context`**: `string` - A string identifier for the logging context (e.g., component name).
-   **Returns**: `Logger` - An object containing logging methods.

### `Logger` Interface

The returned `Logger` object has the following methods:

-   **`debug(message: string, data?: object): void`**: Logs a debug message.
-   **`info(message: string, data?: object): void`**: Logs an informational message.
-   **`warn(message: string, data?: object): void`**: Logs a warning message.
-   **`error(message: string, data?: object): void`**: Logs an error message.

Each method takes a `message` string and an optional `data` object. The `data` object will be stringified using `JSON.stringify` and appended to the log message.

## Dependencies

This hook relies on the Wails runtime logging functions (`LogDebug`, `LogInfo`, `LogWarning`, `LogError`) being available globally.

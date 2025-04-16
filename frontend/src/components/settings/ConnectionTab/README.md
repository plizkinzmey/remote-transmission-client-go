# ConnectionTab Component

## Purpose

The `ConnectionTab` component provides a user interface for configuring and testing the connection settings to a Transmission RPC server. It allows users to input the host, port, username, and password.

## Props

-   `settings: ConnectionConfig`: An object containing the current connection settings (`host`, `port`, `username`, `password`).
-   `onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void`: A callback function invoked when any setting value changes. It receives an object with the changed setting(s).
-   `onConnectionTest?: (success: boolean, errorMessage?: string) => void`: An optional callback function invoked after a connection test is performed. It receives `true` for success or `false` and an error message for failure. This allows the parent component to display the connection status.
-   `errors?: { [key: string]: string }`: An optional object containing validation errors for the input fields (e.g., `{ host: "Host is required" }`).

## Usage Example

```tsx
import React, { useState } from 'react';
import { ConnectionTab } from './'; // Assuming import from index.ts
import { ConnectionConfig } from '../../App'; // Adjust path as needed
import { StatusMessage } from '../StatusMessage'; // Adjust path as needed

const SettingsPage = () => {
  const [settings, setSettings] = useState<ConnectionConfig>({
    host: 'localhost',
    port: 9091,
    username: '',
    password: '',
  });
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState({}); // Add validation logic if needed

  const handleSettingsChange = (newSettings: Partial<ConnectionConfig>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setConnectionTestResult(null); // Reset test status on change
    // Add validation logic here and update validationErrors
  };

  const handleConnectionTest = (success: boolean, message?: string) => {
    setConnectionTestResult({ success, message });
  };

  return (
    <div>
      <h2>Connection Settings</h2>
      {connectionTestResult && (
         <StatusMessage
            type={connectionTestResult.success ? 'success' : 'error'}
            message={connectionTestResult.message || (connectionTestResult.success ? 'Connection successful!' : 'Connection failed!')}
         />
      )}
      <ConnectionTab
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onConnectionTest={handleConnectionTest}
        errors={validationErrors}
      />
      {/* Other settings tabs */}
    </div>
  );
};
```

## Dependencies

-   React
-   `@radix-ui/themes` (for UI components like `TextField`, `Flex`, `Button`, etc.)
-   `useLocalization` (from `../../contexts/LocalizationContext`) for internationalization.
-   Wails Go function: `TestConnection` (from `../../../wailsjs/go/main/App`) for testing the connection.

## Implementation Details

-   **Connection Logic:** The logic for handling the connection test, including managing loading states and parsing potential errors, is encapsulated within the `useConnectionTest` custom hook (`./hooks/useConnectionTest.ts`).
-   **State Management:** The component uses the `useState` hook internally via `useConnectionTest` to manage the testing state. Configuration state (`settings`) is managed by the parent component.
-   **Styling:** Uses CSS Modules (`ConnectionTab.module.css`) for styling, minimizing inline styles.
-   **Testing:** Unit tests should cover rendering, input changes, validation error display, and connection test logic (success/failure scenarios). Test IDs (`data-testid`) are provided for key interactive elements.

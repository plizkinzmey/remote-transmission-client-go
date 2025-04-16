# LimitsTab Component

## Description

The `LimitsTab` component provides a user interface for configuring speed limits and the maximum upload ratio within the Transmission client settings. It allows users to set the maximum upload ratio and define the threshold and units for the "slow speed" mode.

## Props

-   **`settings`**: `ConnectionConfig`
    -   An object containing the current connection configuration, including `maxUploadRatio`, `slowSpeedLimit`, and `slowSpeedUnit`.
-   **`onSettingsChange`**: `(newSettings: Partial<ConnectionConfig>) => void`
    -   A callback function invoked when any limit setting is changed by the user. It receives a partial `ConnectionConfig` object containing only the updated settings.
-   **`errors`**: `{ [key: string]: string }` (optional)
    -   An object containing validation errors for the input fields. Keys correspond to setting names (`maxUploadRatio`, `slowSpeedLimit`), and values are the error messages to display. Defaults to an empty object.

## Usage Example

```tsx
import React, { useState } from 'react';
import { LimitsTab } from './LimitsTab';
import { ConnectionConfig } from '../../../App'; // Adjust path as needed

const SettingsContainer: React.FC = () => {
  const [settings, setSettings] = useState<ConnectionConfig>({
    // ... other settings
    maxUploadRatio: 2.0,
    slowSpeedLimit: 50,
    slowSpeedUnit: 'KiB/s',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSettingsChange = (newSettings: Partial<ConnectionConfig>) => {
    // Perform validation if needed
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    // Clear or set errors based on validation
    // setErrors(validationResult);
  };

  return (
    <LimitsTab
      settings={settings}
      onSettingsChange={handleSettingsChange}
      errors={errors}
    />
  );
};
```

## Dependencies

-   React
-   `@radix-ui/themes` (TextField, Select, Flex, Text, Grid, Box)
-   `useLocalization` hook (from `../../../contexts/LocalizationContext`)
-   `ConnectionConfig` type (from `../../../App`)

## Implementation Details

-   The component uses controlled inputs (`TextField.Root`, `Select.Root`) bound to the `settings` prop.
-   Input changes trigger the `onSettingsChange` callback with the updated values.
-   Empty string inputs for numeric fields (`maxUploadRatio`, `slowSpeedLimit`) are treated as `0`. Non-numeric inputs are also treated as `0`.
-   Validation errors passed via the `errors` prop are displayed below the respective input fields.
-   Inline styles for input width have been moved to `LimitsTab.module.css`.

# Theme Context

This module provides the context, provider, and hook for managing the application's theme (light, dark, or auto).

## Purpose

The `ThemeContext` is responsible for:

-   Managing the user's selected theme preference (`light`, `dark`, `auto`).
-   Persisting the theme choice in `localStorage`.
-   Detecting the system's preferred color scheme when the theme is set to `auto`.
-   Providing the current theme state and a function to update it (`setTheme`) to consuming components via the `useTheme` hook.
-   Integrating with Radix UI's `<RadixTheme>` component to apply the chosen theme's styles.

## API

### `ThemeProvider`

A React component that wraps the part of the application that needs access to the theme state. It initializes the theme from `localStorage` or defaults to `'auto'`, handles system theme changes, and provides the context value.

**Usage:**

```tsx
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext'; // Adjust import path as needed
import AppContent from './AppContent';

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
```

### `useTheme`

A custom hook to access the theme context value.

**Returns:**

-   `theme`: (`ThemeType`) The currently selected theme preference ('light', 'dark', or 'auto').
-   `setTheme`: (`(theme: ThemeType) => void`) A function to update the theme preference.

**Usage:**

```tsx
import React from 'react';
import { useTheme, ThemeType } from './contexts/ThemeContext'; // Adjust import path
import { Button, Select } from '@radix-ui/themes'; // Example UI components

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: ThemeType) => {
    setTheme(value);
  };

  return (
    <Select.Root value={theme} onValueChange={handleThemeChange}>
      <Select.Trigger placeholder="Select theme" />
      <Select.Content>
        <Select.Item value="light">Light</Select.Item>
        <Select.Item value="dark">Dark</Select.Item>
        <Select.Item value="auto">Auto</Select.Item>
      </Select.Content>
    </Select.Root>
  );
};

export default ThemeSwitcher;
```

### `ThemeType`

A type definition for the possible theme values:

```typescript
export type ThemeType = "light" | "dark" | "auto";
```

### `ThemeContext`

The raw React context object. Generally, you should prefer using the `useTheme` hook instead of consuming this directly.

## Implementation Details

-   **Persistence:** The selected `ThemeType` is stored in `localStorage` under the key `"theme"`.
-   **System Theme Detection:** Uses `window.matchMedia('(prefers-color-scheme: dark)')` to detect the system preference when `theme` is `'auto'`. It listens for changes to this preference.
-   **Radix UI Integration:** The `ThemeProvider` wraps its children with `<RadixTheme>` from `@radix-ui/themes`, passing the determined theme ('light' or 'dark') to the `appearance` prop.
-   **Error Handling:** Includes basic error handling for `localStorage` access and `matchMedia` usage.

## Dependencies

-   `react`
-   `@radix-ui/themes`

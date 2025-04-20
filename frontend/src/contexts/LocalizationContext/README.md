# LocalizationContext

A React context provider for handling internationalization in the Transmission Client application.

## Features

- Dynamic language switching
- Automatic language detection
- Translation caching
- Parameter substitution in translations
- Loading state handling
- Error fallbacks

## Usage

### Basic Usage

```tsx
import { LocalizationProvider } from '@contexts/LocalizationContext';

function App() {
  return (
    <LocalizationProvider>
      <YourApp />
    </LocalizationProvider>
  );
}
```

### Using Translations

```tsx
import { useLocalization } from '@contexts/LocalizationContext';

function MyComponent() {
  const { t, currentLanguage, setLanguage, availableLanguages } = useLocalization();

  return (
    <div>
      <h1>{t('my.translation.key')}</h1>
      <p>{t('greeting.with.params', 'User')}</p>
      
      <select value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}>
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## API

### LocalizationProvider

Main context provider component that manages translations and language settings.

Props:
- `children`: React.ReactNode

### useLocalization Hook

Returns:
- `t: (key: string, ...params: any[]) => string` - Translation function
- `currentLanguage: string` - Current active language code
- `setLanguage: (language: string) => Promise<void>` - Function to change language
- `availableLanguages: LocaleInfo[]` - List of available languages
- `isLoading: boolean` - Loading state indicator

### Types

```typescript
interface LocaleInfo {
  code: string;
  name: string;
}

interface LocalizationContextType {
  t: (key: string, ...params: any[]) => string;
  currentLanguage: string;
  setLanguage: (language: string) => Promise<void>;
  availableLanguages: LocaleInfo[];
  isLoading: boolean;
}
```

## Internal Architecture

The context is split into several components:

1. `LocalizationContext.tsx` - Main context and provider implementation
2. `useTranslations.ts` - Hook for handling translations and caching
3. `useLanguageInitialization.ts` - Hook for language initialization and management

## Testing

Tests are located in the `__tests__` directory and cover:

- Translation functionality
- Language initialization
- Context integration
- Error handling

Run tests with:
```bash
npm test
```
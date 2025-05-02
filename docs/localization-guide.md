# Localization Guide

This document provides guidelines for implementing and maintaining localization in the Transmission Client application.

## Overview

The application supports multiple languages through a custom localization system based on JSON translation files. This ensures that users can interact with the application in their preferred language.

## Supported Languages

The application currently supports:

- English (en) - default language
- Russian (ru)

## Directory Structure

```
transmission-client-go/
├── locales/
│   ├── en.json      # English translations
│   └── ru.json      # Russian translations
├── internal/
│   └── infrastructure/
│       └── localization_service.go  # Backend localization service
└── frontend/
    └── src/
        └── contexts/
            └── LocalizationContext.tsx  # Frontend localization context
```

## Architecture

The localization system is implemented using these components:

1. **Backend Service (`localization_service.go`)**:
   - Loads translation files
   - Detects system language
   - Provides translation functions to the Go code
   - Exposes translations to the frontend

2. **Frontend Context (`LocalizationContext.tsx`)**:
   - Provides React components with translation capabilities
   - Manages language selection
   - Formats translations with parameters

## Adding New Translations

### Adding a New String

When adding a new user-facing string to the application:

1. Add the string to `locales/en.json` with a descriptive key:

```json
{
  "common.buttons.save": "Save",
  "common.buttons.cancel": "Cancel",
  "feature.newKey": "Your new string here"
}
```

2. Add the corresponding translation to all supported languages (e.g., `locales/ru.json`):

```json
{
  "common.buttons.save": "Сохранить",
  "common.buttons.cancel": "Отмена",
  "feature.newKey": "Ваша новая строка здесь"
}
```

### Key Naming Conventions

Use dot notation with meaningful hierarchy:

- `common.buttons.save` - Common UI element
- `errors.connection.timeout` - Error message
- `torrent.status.downloading` - Feature-specific content
- `settings.tabs.general` - Settings section

## Using Translations

### In Go Backend

```go
// Simple translation
message := a.localizationService.Translate("errors.connection.failed", locale)

// Translation with parameters
message := a.localizationService.Translate("errors.file.notFound", locale, filePath)
```

### In React Frontend

```tsx
import { useLocalization } from '../contexts/LocalizationContext';

const MyComponent = () => {
  const { translate } = useLocalization();
  
  return (
    <div>
      <h1>{translate('feature.title')}</h1>
      <p>{translate('feature.description', { count: 5 })}</p>
      <button>{translate('common.buttons.save')}</button>
    </div>
  );
};
```

## Parameter Formatting

Translations can include parameters that will be replaced at runtime:

### In JSON Files

```json
{
  "torrent.count": "Found {{count}} torrents",
  "torrent.added": "Added torrent: {{name}}"
}
```

### In Go Code

```go
// The array of arguments will replace {{0}}, {{1}}, etc.
message := a.localizationService.Translate("torrent.added", locale, torrentName)
```

### In React Code

```tsx
// Named parameters are supported in the frontend
const message = translate('torrent.count', { count: torrents.length })
```

## Language Selection

The application automatically detects the system language on first launch. Users can change the language in the settings.

### Language Persistence

The selected language is stored in:

1. Application configuration
2. Local storage (frontend)

When the language changes, the UI updates immediately without requiring a restart.

## Best Practices

1. **Avoid String Concatenation**: Instead of concatenating strings, use parameters.

   ```tsx
   // ❌ Bad
   translate('torrent.status') + ": " + translate('torrent.downloading')
   
   // ✅ Good
   translate('torrent.statusWithState', { state: translate('torrent.downloading') })
   ```

2. **Provide Context**: Use descriptive keys that indicate where/how the string is used.

3. **Keep Translations Organized**: Group related translations together and maintain a logical hierarchy.

4. **Test with Different Languages**: Verify UI layout with languages that may be significantly longer than English.

5. **Handle Pluralization**: For countable items, provide variants for different quantities when needed.

## Troubleshooting

If a translation is missing:

1. The application will fall back to the English version
2. In development mode, a console warning will be displayed
3. Check that the key exists in all language files

## Adding a New Language

To add support for a new language:

1. Create a new file in the `locales/` directory (e.g., `fr.json` for French)
2. Copy the content from `en.json` and translate all strings
3. Add the new language to the list of available languages in the localization service
4. Add appropriate UI for selecting the new language in settings

## Localization Testing

Before committing new translations:

1. Verify all strings are translated
2. Check for formatting errors
3. Test the UI with the new language to ensure layout works correctly
4. Verify parameter replacement works correctly

# LocalizationContext

React контекст для управления интернационализацией в приложении Transmission Client.

## Возможности

- Динамическое переключение языков
- Автоматическое определение языка
- Кэширование переводов
- Подстановка параметров в переводы
- Обработка состояния загрузки
- Обработка ошибок с откатом на резервные варианты

## Использование

### Базовое использование

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

### Использование переводов

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

Основной компонент-провайдер контекста, который управляет переводами и языковыми настройками.

Пропсы:
- `children`: React.ReactNode

### Хук useLocalization

Возвращает:
- `t: (key: string, ...params: any[]) => string` - Функция перевода
- `currentLanguage: string` - Текущий активный код языка
- `setLanguage: (language: string) => Promise<void>` - Функция для смены языка
- `availableLanguages: LocaleInfo[]` - Список доступных языков
- `isLoading: boolean` - Индикатор состояния загрузки

### Типы

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

## Внутренняя архитектура

Контекст разделен на несколько компонентов:

1. `LocalizationContext.tsx` - Основная реализация контекста и провайдера
2. `useTranslations.ts` - Хук для управления переводами и кэшированием
3. `useLanguageInitialization.ts` - Хук для инициализации и управления языком

## Тестирование

Тесты находятся в директории `__tests__` и охватывают:

- Функциональность переводов
- Инициализацию языка
- Интеграцию контекста
- Обработку ошибок

Запуск тестов:
```bash
npm test
```
# Контекст Темы (Theme Context)

Этот модуль предоставляет контекст, провайдер и хук для управления темой приложения (светлая, темная или авто).

## Назначение

`ThemeContext` отвечает за:

-   Управление выбранной пользователем темой (`light`, `dark`, `auto`).
-   Сохранение выбора темы в `localStorage`.
-   Определение предпочитаемой цветовой схемы системы, когда тема установлена в `auto`.
-   Предоставление текущего состояния темы и функции для ее обновления (`setTheme`) компонентам-потребителям через хук `useTheme`.
-   Интеграцию с компонентом `<RadixTheme>` из Radix UI для применения стилей выбранной темы.

## API

### `ThemeProvider`

React-компонент, который оборачивает часть приложения, нуждающуюся в доступе к состоянию темы. Он инициализирует тему из `localStorage` (или по умолчанию `'auto'`), обрабатывает изменения системной темы и предоставляет значение контекста.

**Использование:**

```tsx
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext'; // Скорректируйте путь импорта при необходимости
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

Пользовательский хук для доступа к значению контекста темы.

**Возвращает:**

-   `theme`: (`ThemeType`) Текущая выбранная тема ('light', 'dark' или 'auto').
-   `setTheme`: (`(theme: ThemeType) => void`) Функция для обновления выбранной темы.

**Использование:**

```tsx
import React from 'react';
import { useTheme, ThemeType } from './contexts/ThemeContext'; // Скорректируйте путь импорта
import { Button, Select } from '@radix-ui/themes'; // Пример UI-компонентов

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: ThemeType) => {
    setTheme(value);
  };

  return (
    <Select.Root value={theme} onValueChange={handleThemeChange}>
      <Select.Trigger placeholder="Выберите тему" />
      <Select.Content>
        <Select.Item value="light">Светлая</Select.Item>
        <Select.Item value="dark">Темная</Select.Item>
        <Select.Item value="auto">Авто</Select.Item>
      </Select.Content>
    </Select.Root>
  );
};

export default ThemeSwitcher;
```

### `ThemeType`

Определение типа для возможных значений темы:

```typescript
export type ThemeType = "light" | "dark" | "auto";
```

### `ThemeContext`

"Сырой" объект React-контекста. В общем случае, предпочтительнее использовать хук `useTheme` вместо прямого потребления контекста.

## Детали Реализации

-   **Персистентность:** Выбранный `ThemeType` сохраняется в `localStorage` под ключом `"theme"`.
-   **Определение Системной Темы:** Использует `window.matchMedia('(prefers-color-scheme: dark)')` для определения системных предпочтений, когда `theme` установлено в `'auto'`. Прослушивает изменения этого предпочтения.
-   **Интеграция с Radix UI:** `ThemeProvider` оборачивает дочерние элементы компонентом `<RadixTheme>` из `@radix-ui/themes`, передавая определенную тему ('light' или 'dark') в проп `appearance`.
-   **Обработка Ошибок:** Включает базовую обработку ошибок при доступе к `localStorage` и использовании `matchMedia`.

## Зависимости

-   `react`
-   `@radix-ui/themes`

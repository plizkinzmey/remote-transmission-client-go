# ThemeToggle

Компонент для переключения темы приложения (светлая/темная/авто).

## Использование

```tsx
import { ThemeToggle } from './ThemeToggle';

const Header = () => (
  <header>
    <ThemeToggle />
  </header>
);
```

## Особенности

- Интеграция с ThemeContext для управления темой
- Поддержка локализации через LocalizationContext
- Адаптивные иконки для разных состояний темы
- Анимация при наведении и переключении
- Доступность с помощью ARIA атрибутов

## Зависимости

- [@radix-ui/themes](https://www.radix-ui.com/themes/docs/overview/getting-started) - для UI компонентов
- [@heroicons/react](https://heroicons.com/) - для иконок темы
- LocalizationContext - для локализации
- ThemeContext - для управления темой

## API

Компонент не принимает пропсы, вся функциональность реализована через контексты:

### ThemeContext

```typescript
interface ThemeContextProps {
  theme: "light" | "dark" | "auto";
  setTheme: (theme: ThemeType) => void;
}
```

### Состояния темы

- `light` - светлая тема
- `dark` - темная тема
- `auto` - автоматическая тема (зависит от системных настроек)

### Локализация

Используются следующие ключи локализации:
- `settings.themeLight` - светлая тема
- `settings.themeDark` - темная тема
- `settings.themeAuto` - автоматическая тема

## CSS кастомизация

Компонент использует CSS модули и поддерживает следующие классы:

```css
.container - контейнер компонента
.toggleButton - кнопка переключения
.menuItem - элемент выпадающего меню
```

## Тестирование

Для запуска тестов используйте:

```bash
npm run test ThemeToggle
```

Тесты покрывают:
- Корректное отображение компонента
- Переключение тем
- Отображение правильных иконок
- Локализацию
- Интеграцию с ThemeContext
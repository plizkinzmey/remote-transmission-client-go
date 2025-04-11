# Руководство по тестированию фронтенд-компонентов

Данное руководство описывает принципы и практики тестирования фронтенд-компонентов проекта Transmission Client. Соблюдение этих правил поможет поддерживать высокое качество кода и упростит совместную работу.

## Содержание

- [Руководство по тестированию фронтенд-компонентов](#руководство-по-тестированию-фронтенд-компонентов)
  - [Содержание](#содержание)
  - [Технологический стек](#технологический-стек)
  - [Структура тестов](#структура-тестов)
  - [Требования к покрытию](#требования-к-покрытию)
  - [Моки и стабы](#моки-и-стабы)
    - [CSS-модули](#css-модули)
    - [Внешние зависимости](#внешние-зависимости)
    - [Wails API и Go функции](#wails-api-и-go-функции)
  - [Именование тестов](#именование-тестов)
  - [Селекторы в тестах](#селекторы-в-тестах)
    - [Предпочтительные селекторы (в порядке приоритета):](#предпочтительные-селекторы-в-порядке-приоритета)
    - [Избегайте:](#избегайте)
  - [Проверка стилей](#проверка-стилей)
  - [Запуск тестов](#запуск-тестов)
    - [Запуск всех тестов:](#запуск-всех-тестов)
    - [Запуск тестов с отчетом о покрытии:](#запуск-тестов-с-отчетом-о-покрытии)
    - [Запуск отдельных тестов:](#запуск-отдельных-тестов)
  - [Типичные проблемы и решения](#типичные-проблемы-и-решения)
    - [1. Проблемы с CSS модулями](#1-проблемы-с-css-модулями)
    - [2. Проблемы с перерисовкой](#2-проблемы-с-перерисовкой)
  - [Тестирование компонентов Radix UI](#тестирование-компонентов-radix-ui)

## Технологический стек

Для тестирования фронтенда используются следующие технологии:

- **Vitest** - основной фреймворк для тестирования
- **React Testing Library** - библиотека для тестирования React-компонентов
- **Jest DOM** - расширения для проверки DOM-элементов

## Структура тестов

Все тесты для фронтенд-компонентов должны размещаться в директории `frontend/src/test/components` и соответствовать структуре исходного кода:

```
frontend/src/
  components/
    MyComponent.tsx
  test/
    components/
      MyComponent.test.tsx
```

Модульные тесты должны проверять:
1. Правильность рендеринга компонента
2. Корректную обработку пропсов
3. Поведение компонента при различных условиях
4. Обработку событий пользователя (если применимо)
5. Корректность использования стилей и CSS-классов

## Требования к покрытию

Для обеспечения качества кода установлены следующие требования к покрытию тестами:

- **Строки (lines)**: не менее 70%
- **Функции (functions)**: не менее 70%
- **Ветки (branches)**: не менее 70%
- **Операторы (statements)**: не менее 70%

Для новых компонентов рекомендуется стремиться к 100% покрытию кода.

## Моки и стабы

### CSS-модули

CSS-модули должны быть мокированы в файле `setup-tests.ts` в формате:

```typescript
vi.mock("../styles/ComponentName.module.css", () => ({
  default: {
    className1: "className1-mock",
    className2: "className2-mock",
    // ...
  }
}));
```

### Внешние зависимости

Сторонние библиотеки и компоненты (например, компоненты Radix UI) должны быть мокированы в тестовых файлах:

```typescript
vi.mock("@radix-ui/themes", () => {
  return {
    Box: ({ className, style, children, ...props }: any) => (
      <div
        className={className}
        style={style}
        data-testid="custom-box-container"
        {...props}
      >
        {children}
      </div>
    ),
    // ...
  };
});
```

### Wails API и Go функции

Моки для функций Wails и вызовов Go должны быть определены в `setup-tests.ts`:

```typescript
const wailsMocks = {
  LogDebug: vi.fn(),
  LogInfo: vi.fn(),
  // ...
};

vi.mock("../../wailsjs/runtime", () => ({
  LogDebug: wailsMocks.LogDebug,
  // ...
}));

vi.mock("../../wailsjs/go/main/App", () => ({
  LoadConfig: vi.fn(),
  // ...
}));
```

## Именование тестов

Для именования тестов используется шаблон:

```typescript
describe('ComponentName', () => {
  it('action/behavior when condition', () => {
    // test code
  });
});
```

Например:
- `it('renders with default props')`
- `it('displays error message when status is error')`
- `it('calls onSubmit when form is submitted')`

## Селекторы в тестах

### Предпочтительные селекторы (в порядке приоритета):

1. **data-testid** - Всегда используйте атрибуты `data-testid` для ключевых элементов:

```typescript
// В компоненте:
<div data-testid="status-container">...</div>

// В тесте:
const container = screen.getByTestId("status-container");
```

2. **Поиск по тексту**:

```typescript
screen.getByText("Сообщение об ошибке")
```

3. **Поиск по роли**:

```typescript
screen.getByRole("button", { name: "Сохранить" })
```

### Избегайте:

- Селекторов по классам CSS (за исключением проверки наличия самих классов)
- Селекторов по индексам (`firstChild`, `childNodes[1]` и т.д.)
- Селекторов по DOM-структуре, которая может измениться

## Проверка стилей

Для проверки применения стилей используйте:

```typescript
// Проверка inline-стилей
expect(element).toHaveStyle("color: red");

// Проверка классов CSS
expect(element).toHaveClass(styles.errorMessage);

// Проверка атрибутов
expect(element).toHaveAttribute("width", "24px");
```

## Запуск тестов

### Запуск всех тестов:

```
npm run test
```

### Запуск тестов с отчетом о покрытии:

```
npm run test:coverage
```

### Запуск отдельных тестов:

```
npm run test -- StatusMessage
```

## Типичные проблемы и решения

### 1. Проблемы с CSS модулями

При ошибках вида "Cannot read property 'className' of undefined":

- Убедитесь, что CSS-модуль правильно мокирован в `setup-tests.ts`
- Проверьте, что формат мока соответствует использованию в компоненте (с объектом `default` или без него)

### 2. Проблемы с перерисовкой

При ошибках обновления компонента после действий:

- Используйте `rerender` из React Testing Library
- Убедитесь, что все состояния обновляются через `act()`

## Тестирование компонентов Radix UI

При тестировании компонентов, использующих Radix UI, особое внимание следует уделить темам, порталам и мокированию компонентов.

### Мокирование компонентов Radix UI

```typescript
vi.mock('@radix-ui/themes', () => ({
  IconButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  DropdownMenu: {
    Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
    Trigger: ({ children }: any) => (
      <div data-testid="dropdown-trigger">{children}</div>
    ),
    Content: ({ children }: any) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    Item: ({ onClick, children, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
```

### Интеграция с системой тем

При тестировании компонентов, использующих темы Radix UI:

1. **Настройка провайдера темы**:
```typescript
import { Theme as RadixTheme } from "@radix-ui/themes";

const TestThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RadixTheme appearance="dark" accentColor="blue" radius="medium">
    {children}
  </RadixTheme>
);
```

2. **Использование провайдера темы в тестах**:
```typescript
describe('КомпонентСТемой', () => {
  it('корректно отображается с темой', () => {
    render(
      <TestThemeProvider>
        <КомпонентСТемой />
      </TestThemeProvider>
    );
    // ... проверки
  });
});
```

### Тестирование переключения тем

При тестировании компонентов с возможностью смены темы:

1. **Мок контекста темы**:
```typescript
const mockSetTheme = vi.fn();
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light', // или 'dark', 'auto'
    setTheme: mockSetTheme,
  }),
}));
```

2. **Тестирование смены темы**:
```typescript
it('переключает тему при клике', async () => {
  const { rerender } = render(
    <TestThemeProvider>
      <ThemeToggle />
    </TestThemeProvider>
  );

  fireEvent.click(screen.getByTestId('theme-toggle-button'));
  fireEvent.click(screen.getByTestId('theme-toggle-light'));
  
  expect(mockSetTheme).toHaveBeenCalledWith('light');
});
```

### Тестирование стилизованных компонентов

При тестировании компонентов, использующих систему стилей Radix UI:

1. **Не тестируйте детали реализации** системы стилей Radix UI
2. **Фокусируйтесь на тестировании поведения** компонента и взаимодействии с пользователем
3. **Используйте атрибуты data-testid** для выбора элементов вместо селекторов на основе стилей

```typescript
// ПРАВИЛЬНО: тестирование поведения
it('отображает правильную иконку для текущей темы', () => {
  render(
    <TestThemeProvider>
      <ThemeToggle />
    </TestThemeProvider>
  );
  
  expect(screen.getByTestId('theme-icon-light')).toBeInTheDocument();
});

// НЕПРАВИЛЬНО: тестирование стилей Radix UI
it('применяет стили Radix UI', () => {
  render(<ThemeToggle />);
  expect(screen.getByRole('button')).toHaveStyle({ 
    backgroundColor: 'var(--accent-9)' 
  });
});
```

### Лучшие практики тестирования Radix UI

1. **Правильное мокирование порталов**:
   - Используйте простые div элементы вместо порталов в тестах
   - Добавляйте data-testid для удобного поиска элементов

2. **Обработка смены темы**:
   - Тестируйте компонент в разных темах
   - Проверяйте корректность отображения контента при смене темы

3. **Тестирование доступности**:
   - Проверяйте ARIA атрибуты
   - Тестируйте навигацию с клавиатуры

4. **Взаимодействие с компонентами**:
   - Тестируйте открытие/закрытие выпадающих меню
   - Проверяйте обработку событий клика и наведения

### Частые проблемы

1. **Тестирование внутренней реализации Radix UI**:
   - Избегайте тестирования внутренних механизмов библиотеки
   - Фокусируйтесь на пользовательском взаимодействии

2. **Сложности с порталами**:
   - Используйте моки для порталов
   - Дожидайтесь рендеринга контента с помощью waitFor

3. **Проблемы с темами**:
   - Всегда оборачивайте компоненты в ThemeProvider
   - Учитывайте возможность автоматической смены темы

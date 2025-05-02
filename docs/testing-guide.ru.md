# Руководство по тестированию фронтенда

Это руководство описывает принципы и практики тестирования фронтенд-компонентов в проекте Transmission Client. Следование этим правилам поможет поддерживать высокое качество кода и упростить совместную работу.

## Содержание

- [Руководство по тестированию фронтенда](#руководство-по-тестированию-фронтенда)
  - [Содержание](#содержание)
  - [Стек технологий](#стек-технологий)
  - [Структура тестов](#структура-тестов)
  - [Требования к покрытию](#требования-к-покрытию)
  - [Моки и заглушки](#моки-и-заглушки)
    - [CSS-модули](#css-модули)
    - [Внешние зависимости](#внешние-зависимости)
    - [Wails API и функции Go](#wails-api-и-функции-go)
  - [Именование тестов](#именование-тестов)
  - [Селекторы в тестах](#селекторы-в-тестах)
    - [Предпочтительные селекторы (в порядке приоритета):](#предпочтительные-селекторы-в-порядке-приоритета)
    - [Избегайте:](#избегайте)
    - [Лучшие практики для data-testid](#лучшие-практики-для-data-testid)
  - [Тестирование компонентов с порталами](#тестирование-компонентов-с-порталами)
    - [Поиск элементов в порталах](#поиск-элементов-в-порталах)
    - [Ожидание контента портала](#ожидание-контента-портала)
    - [Мокирование компонентов портала](#мокирование-компонентов-портала)
    - [Тестирование событий портала](#тестирование-событий-портала)
    - [Распространенные проблемы](#распространенные-проблемы)
    - [Пример теста](#пример-теста)
    - [Лучшие практики](#лучшие-практики-1)
  - [Тестирование стилей](#тестирование-стилей)
  - [Запуск тестов](#запуск-тестов)
    - [Запуск всех тестов:](#запуск-всех-тестов)
    - [Запуск тестов с отчетом о покрытии:](#запуск-тестов-с-отчетом-о-покрытии)
    - [Запуск конкретных тестов:](#запуск-конкретных-тестов)
  - [Распространенные проблемы и решения](#распространенные-проблемы-и-решения)
    - [1. Проблемы с CSS-модулями](#1-проблемы-с-css-модулями)
    - [2. Проблемы с перерисовкой](#2-проблемы-с-перерисовкой)
    - [3. Проблемы с React Context](#3-проблемы-с-react-context)
  - [Тестирование файловых операций](#тестирование-файловых-операций)
    - [Мокирование FileReader](#мокирование-filereader)
  - [Тестирование API браузера](#тестирование-api-браузера)
    - [Мокирование ResizeObserver](#мокирование-resizeobserver)
  - [Работа с асинхронными тестами](#работа-с-асинхронными-тестами)
    - [Правильное использование waitFor](#правильное-использование-waitfor)
    - [Тестирование хуков React useEffect](#тестирование-хуков-react-useeffect)
    - [Соблюдение `exhaustive-deps`](#соблюдение-exhaustive-deps)
  - [Достижение 100% покрытия тестами](#достижение-100-покрытия-тестами)
  - [Тестирование мокирования React.useState](#тестирование-мокирования-reactusestate)
  - [Тестирование компонентов, использующих внешние библиотеки](#тестирование-компонентов-использующих-внешние-библиотеки)
  - [Тестирование компонентов Radix UI](#тестирование-компонентов-radix-ui)
    - [Лучшие практики для тестирования Radix UI](#лучшие-практики-для-тестирования-radix-ui)
  - [Тестирование сложных композиций компонентов](#тестирование-сложных-композиций-компонентов)
  - [Тестирование состояний загрузки и обработки ошибок](#тестирование-состояний-загрузки-и-обработки-ошибок)
  - [Управление состоянием в тестах](#управление-состоянием-в-тестах)
- [Лучшие практики тестирования Go](./go-testing-best-practices.ru.md)

## Стек технологий

Для тестирования фронтенда используются следующие технологии:

- **Vitest** - основной фреймворк для тестирования
- **React Testing Library** - библиотека для тестирования React-компонентов
- **Jest DOM** - расширения для тестирования DOM-элементов

## Структура тестов

Тесты для каждого компонента должны располагаться в подкаталоге `__tests__` внутри каталога самого компонента:

```
frontend/src/
  components/
    MyComponent/
      __tests__/
        MyComponent.test.tsx  # Тесты для основного компонента
        index.test.tsx      # Тесты для index.ts
      MyComponent.tsx
      index.ts
      MyComponent.module.css
      README.md
```

Юнит-тесты должны проверять:
1. Корректный рендеринг компонента (`MyComponent.test.tsx`)
2. Правильную обработку пропсов (`MyComponent.test.tsx`)
3. Поведение компонента в различных условиях (`MyComponent.test.tsx`)
4. Обработку пользовательских событий (если применимо) (`MyComponent.test.tsx`)
5. Корректное использование стилей и CSS-классов (`MyComponent.test.tsx`)
6. **Правильность реэкспорта компонента и его типов из `index.ts` (`index.test.tsx`)**:
   - Убедитесь, что `index.ts` экспортирует основной компонент.
   - Убедитесь, что `index.ts` экспортирует тип пропсов компонента (если он есть).

Пример теста для `index.ts`:
```typescript
// filepath: src/components/MyComponent/__tests__/index.test.tsx
import { describe, it, expect } from "vitest";
import { MyComponent } from "../index"; // Импорт из index.ts
import { MyComponent as OriginalComponent } from "../MyComponent"; // Импорт из файла компонента

describe("MyComponent index", () => {
  it("должен экспортировать компонент MyComponent", () => {
    expect(MyComponent).toBeDefined();
    // Дополнительно проверяем, что это действительно тот компонент
    expect(MyComponent).toBe(OriginalComponent);
  });

  // Если есть экспорт типов, можно добавить проверку (хотя это сложнее в Jest/Vitest)
  // it("должен экспортировать тип MyComponentProps", () => {
  //   // Проверка типов во время выполнения затруднительна,
  //   // но сам факт импорта без ошибок уже является частичной проверкой
  //   expect(typeof MyComponentProps).toBe('undefined'); // Placeholder
  // });
});
```

## Требования к покрытию

Для обеспечения качества кода установлены следующие требования к покрытию тестами:

- **Строки (Lines)**: не менее 70%
- **Функции (Functions)**: не менее 70%
- **Ветви (Branches)**: не менее 70%
- **Инструкции (Statements)**: не менее 70%

Для новых компонентов рекомендуется стремиться к 100% покрытию кода.

## Моки и заглушки

### CSS-модули

CSS-модули должны быть замоканы в файле `setup-tests.ts` в следующем формате:

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

Сторонние библиотеки и компоненты (например, компоненты Radix UI) должны быть замоканы в файлах тестов:

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

### Wails API и функции Go

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

Используйте следующий шаблон для именования тестов:

```typescript
describe('КомпонентName', () => {
  it('действие/поведение при условии', () => {
    // код теста
  });
});
```

Примеры правильного именования тестов:
- `отображается при попытке переподключения`
- `не отображается когда переподключение не требуется`
- `применяет правильные стили`
- `вызывает onSubmit при отправке формы`
- `отображает спиннер во время загрузки`

## Селекторы в тестах

### Предпочтительные селекторы (в порядке приоритета):

1. **data-testid** - Всегда используйте атрибуты `data-testid` для ключевых элементов:

```typescript
// В компоненте:
<div data-testid="status-container">...</div>

// В тесте:
const container = screen.getByTestId("status-container");
```

2. **Запросы по тексту**:

```typescript
screen.getByText("Сообщение об ошибке")
```

3. **Запросы по роли**:

```typescript
screen.getByRole("button", { name: "Сохранить" })
```

### Избегайте:

- Селекторов CSS-классов (кроме случаев проверки наличия классов)
- Селекторов по индексу (`firstChild`, `childNodes[1]` и т.д.)
- Селекторов структуры DOM, которая может измениться
- Использования `querySelector` напрямую на DOM-элементах (используйте методы RTL)

### Лучшие практики для data-testid

При добавлении атрибутов data-testid к компонентам следуйте этим рекомендациям:

1. **Будьте конкретны и описательны**:
   ```jsx
   // ХОРОШО
   <button data-testid="save-settings-button">Сохранить</button>

   // СЛИШКОМ ОБЩЕ
   <button data-testid="button">Сохранить</button>
   ```

2. **Используйте согласованные шаблоны именования**:
   ```jsx
   // Рекомендуемый шаблон: [компонент]-[элемент]-[вариант/состояние]
   <input data-testid="search-input-active" />
   <button data-testid="search-button-disabled" disabled />
   ```

3. **Добавляйте data-testid к компонентам библиотек**:
   Для внешних UI-библиотек (таких как Radix UI, Material UI) оборачивайте их или расширяйте с помощью data-testid:
   ```jsx
   <Select.Root>
     <Select.Trigger data-testid="path-select-trigger" />
     <Select.Content>
       {items.map(item => (
         <Select.Item
           key={item.value}
           value={item.value}
           data-testid={`select-item-${item.value}`}
         >
           {item.label}
         </Select.Item>
       ))}
     </Select.Content>
   </Select.Root>
   ```

4. **Добавляйте data-testid к динамическим компонентам**:
   ```jsx
   {items.map((item, index) => (
     <li key={item.id} data-testid={`item-${item.id}`}>
       {item.name}
     </li>
   ))}
   ```

5. **Добавляйте data-testid для условного рендеринга**:
   ```jsx
   {isLoading ? (
     <div data-testid="loading-state"><Spinner /></div>
   ) : (
     <div data-testid="loaded-state">{content}</div>
   )}
   ```

6. **Не злоупотребляйте**:
   Добавляйте data-testid только к элементам, с которыми вам действительно нужно взаимодействовать или проверять в тестах.

7. **Добавляйте data-testid к формам**:
   Всегда добавляйте data-testid к формам, чтобы избежать использования querySelector:
   ```jsx
   <form data-testid="add-item-form" onSubmit={handleSubmit}>
     {/* содержимое формы */}
   </form>
   ```

8. **Используйте data-testid для тестов отправки формы**:
   При тестировании отправки формы используйте data-testid формы вместо нацеливания на кнопку отправки:
   ```typescript
   // ХОРОШО
   const form = screen.getByTestId("add-item-form");
   fireEvent.submit(form);

   // ИЗБЕГАЙТЕ (более хрупко)
   const submitButton = screen.getByText("Отправить");
   fireEvent.click(submitButton);
   ```

## Тестирование компонентов с порталами

Компоненты, использующие порталы (например, модальные окна, диалоги или всплывающие подсказки из Radix UI), рендерят контент вне обычной иерархии DOM, что требует особых подходов к тестированию.

### Поиск элементов в порталах

При тестировании компонентов, использующих порталы, используйте селекторы уровня документа вместо селекторов, ограниченных компонентом:

```typescript
// НЕПРАВИЛЬНО: Это может не найти элементы в порталах
const modal = screen.getByTestId("settings-modal");

// ПРАВИЛЬНО: Используйте запросы уровня документа
const modal = document.querySelector('[data-testid="settings-modal"]');

// ИЛИ используйте утилиту within для поиска по всему document.body
import { within } from '@testing-library/react';
const modal = within(document.body).getByTestId("settings-modal");
```

### Ожидание контента портала

Когда портал рендерится динамически (например, после нажатия кнопки), дождитесь появления контента:

```typescript
import { act } from '@testing-library/react';

// Нажмите кнопку, которая открывает модальное окно на основе портала
fireEvent.click(openModalButton);

// Дождитесь рендеринга контента портала
await act(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
});

// Теперь протестируйте контент портала
const modal = document.querySelector('[data-testid="modal-content"]');
expect(modal).not.toBeNull();
```

### Мокирование компонентов портала

Для компонентов, таких как Radix UI, которые используют порталы внутри, вы можете замокать их для упрощения тестирования:

```typescript
// Мок компонента Dialog.Portal из Radix UI
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog');
  return {
    ...actual,
    DialogPortal: ({ children }) => <div data-testid="mocked-portal">{children}</div>,
  };
});
```

### Тестирование событий портала

При тестировании событий на элементах внутри порталов:

1. Используйте `act()` для обертывания обновлений состояния:

```typescript
await act(async () => {
  fireEvent.click(openModalButton);
});
```

2. Убедитесь, что события всплывают правильно:

```typescript
// Добавьте опцию bubbles: true, чтобы события распространялись правильно
portalElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
// Или при использовании fireEvent:
fireEvent(element, new MouseEvent('click', { bubbles: true }));
```

### Распространенные проблемы

1. **Всплытие событий**: Событиям в порталах нужно `bubbles: true` для правильного распространения.

2. **Обновления состояния**: Всегда оборачивайте изменения состояния, связанные с порталами, в `act()`.

3. **Очистка**: Убедитесь, что порталы правильно очищаются после тестов:

```typescript
afterEach(() => {
  cleanup(); // Удалит элементы портала
});
```

### Пример теста

Вот полный пример тестирования компонента модального окна, использующего портал:

```typescript
describe('Компонент модального окна', () => {
  it('открывается и закрывается правильно', async () => {
    render(<Modal />);

    // Открыть модальное окно
    await act(async () => {
      fireEvent.click(screen.getByText('Открыть модальное окно'));
    });

    // Проверить контент модального окна (в портале)
    const modalContent = within(document.body).getByTestId('modal-content');
    expect(modalContent).toBeInTheDocument();

    // Закрыть модальное окно
    await act(async () => {
      fireEvent.click(within(document.body).getByText('Закрыть'));
    });

    expect(modalContent).not.toBeInTheDocument();
  });
});
```

### Лучшие практики

1. Всегда используйте `act()` при запуске изменений состояния в порталах.
2. Используйте запросы уровня документа для поиска контента портала.
3. Добавляйте правильную очистку в `afterEach`.
4. Мокируйте компоненты портала, когда это возможно, для упрощения тестов.
5. Добавляйте правильные тестовые идентификаторы к контенту портала.

## Тестирование стилей

Для проверки применения стилей используйте:

```typescript
// Тестирование инлайн-стилей
expect(element).toHaveStyle("color: red");

// Тестирование CSS-классов
expect(element).toHaveClass(styles.errorMessage);

// Тестирование атрибутов
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

### Запуск конкретных тестов:

```
npm run test -- StatusMessage
```

## Распространенные проблемы и решения

### 1. Проблемы с CSS-модулями

При ошибках типа "Cannot read property 'className' of undefined":

- Убедитесь, что CSS-модуль правильно замокан в `setup-tests.ts`.
- Проверьте, что формат мока соответствует использованию в компоненте (с объектом `default` или без него).

### 2. Проблемы с перерисовкой

При ошибках, связанных с обновлением компонента после действий:

- Используйте `rerender` из React Testing Library.
- Убедитесь, что все обновления состояния обернуты в `act()`.

### 3. Проблемы с React Context

Если ваши компоненты используют React Context (например, ThemeContext или LocalizationContext), вам нужно создать обертки контекста для тестирования:

```typescript
// Создайте файл мока в src/test/mocks/localization-context-mock.tsx
import React, { ReactNode } from "react";
import { LocalizationContext } from "../../contexts/LocalizationContext";

export const MockLocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockContext = {
    t: (key: string) => key,
    locale: "en",
    setLocale: vi.fn(),
    isLoading: false
  };

  return (
    <LocalizationContext.Provider value={mockContext}>
      {children}
    </LocalizationContext.Provider>
  );
};
```

Используйте эту обертку в тестах:

```typescript
render(
  <MockLocalizationProvider>
    <ComponentToTest />
  </MockLocalizationProvider>
);
```

## Тестирование файловых операций

### Мокирование FileReader

При тестировании компонентов, обрабатывающих загрузку файлов или операции перетаскивания:

```typescript
// Сохраняем оригинальную реализацию FileReader
const OriginalFileReader = window.FileReader;

// Настраиваем мок перед тестами
beforeEach(() => {
  const fileReaderMock = {
    readAsDataURL: vi.fn(),
    onload: null as any,
    result: "data:application/x-bittorrent;base64,mockBase64Content"
  };

  // Заменяем глобальный FileReader
  window.FileReader = vi.fn(() => fileReaderMock);
});

// Восстанавливаем оригинал после тестов
afterEach(() => {
  window.FileReader = OriginalFileReader;
});

it('обрабатывает выбор файла', () => {
  // Создаем мок файла
  const file = new File(['content'], 'test.torrent', { type: 'application/x-bittorrent' });

  // Симулируем изменение ввода файла
  fireEvent.change(fileInput, { target: { files: [file] } });

  // Вручную вызываем событие onload на мок-ридере
  const mockReader = window.FileReader();
  if (mockReader.onload) {
    mockReader.onload({ target: mockReader } as any);
  }

  // Проверяем результат
  expect(onFileSelectMock).toHaveBeenCalledWith('test.torrent', 'mockBase64Content');
});
```

## Тестирование API браузера

### Мокирование ResizeObserver

Многие UI-библиотеки, такие как Radix UI, используют ResizeObserver, который недоступен в jsdom:

```typescript
// В setup-tests.ts или отдельном файле мока
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Добавляем в глобальный объект перед тестами
window.ResizeObserver = MockResizeObserver;
```

## Работа с асинхронными тестами

### Правильное использование waitFor

При тестировании компонентов с асинхронными операциями всегда используйте `waitFor`:

```typescript
await waitFor(() => {
  expect(screen.getByText('Данные успешно загружены')).toBeInTheDocument();
});
```

Для операций, которые могут занять больше времени:

```typescript
await waitFor(() => {
  expect(mockOnPathChange).toHaveBeenCalled();
}, { timeout: 2000 });
```

### Тестирование хуков React useEffect

Для компонентов с несколькими хуками useEffect:

```typescript
it('вызывает эффект после рендеринга', async () => {
  const mockFunction = vi.fn();

  render(<Component onLoad={mockFunction} />);

  // Дожидаемся завершения всех эффектов
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### Соблюдение `exhaustive-deps`

- Всегда включайте все зависимости, используемые внутри `useEffect`, `useCallback`, `useMemo`, в массив зависимостей хука.
- Это помогает избежать проблем с устаревшими замыканиями и обеспечивает предсказуемое поведение.
- Используйте линтер `eslint-plugin-react-hooks` для автоматической проверки правила `exhaustive-deps`.

## Достижение 100% покрытия тестами

Чтобы достичь 100% покрытия тестами:

1. **Тестируйте все ветви условного рендеринга**:
```typescript
it('рендерит состояние загрузки', () => {
  vi.mocked(useLocalization).mockReturnValue({
    t: vi.fn(),
    isLoading: true,
    locale: 'en',
    setLocale: vi.fn()
  });

  render(<Component />);
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
});
```

2. **Тестируйте все возможные комбинации состояний React**:
   - Начальное состояние
   - После взаимодействия пользователя
   - После загрузки данных
   - Состояния ошибок

3. **Мокируйте все внешние зависимости**:
   - Вызовы API
   - Значения контекста
   - API браузера

4. **Тестируйте пустые и граничные случаи**:
   - Пустые массивы или коллекции
   - Граничные значения
   - Невалидные входные данные

5. **Тестируйте функции очистки в useEffect**:
```typescript
it('очищает при размонтировании', () => {
  const mockCleanup = vi.fn();
  vi.spyOn(React, 'useEffect').mockImplementation(f => {
    const cleanup = f();
    if (cleanup) return mockCleanup;
  });

  const { unmount } = render(<Component />);
  unmount();
  expect(mockCleanup).toHaveBeenCalled();
});
```

6. **Покрывайте все функции, включая инлайн и анонимные**:
   - Инструменты покрытия могут не всегда корректно отслеживать анонимные функции, определенные прямо в JSX (например, `<Component onClick={() => doSomething()} />`).
   - Если тест не покрывает такую функцию, вынесите ее в `useCallback`:
     ```typescript
     const handleClick = useCallback(() => {
       doSomething();
     }, [/* зависимости */]);

     return <Component onClick={handleClick} />;
     ```
   - Это создает стабильную ссылку на функцию, которую инструменты покрытия и тесты могут надежно отследить.

## Тестирование мокирования React.useState

В некоторых случаях вам нужно замокать React.useState для тестирования определенных условий состояния:

```typescript
it('возвращает null при загрузке', () => {
  const originalUseState = React.useState;

  // Мокируем useState, чтобы принудительно установить состояние загрузки в true
  vi.spyOn(React, 'useState')
    .mockImplementationOnce(() => ["", vi.fn()]) // Первый вызов useState
    .mockImplementationOnce(() => [[], vi.fn()]) // Второй вызов useState
    .mockImplementationOnce(() => [true, vi.fn()]); // Состояние isLoading

  const { container } = render(<Component />);
  expect(container.firstChild).toBeNull();

  // Восстанавливаем оригинал
  React.useState = originalUseState;
});
```

## Тестирование компонентов, использующих внешние библиотеки

Когда ваш компонент использует внешние библиотеки, такие как Radix UI:

```typescript
// Создаем обертку для компонентов внешней библиотеки
export const TestThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme="light" scaling="100%">
      <div>{children}</div>
    </ThemeProvider>
  );
};

// Используем ее в тестах
render(
  <TestThemeProvider>
    <Component />
  </TestThemeProvider>
);
```

## Тестирование компонентов Radix UI

При тестировании компонентов, использующих Radix UI, особое внимание необходимо уделить темам, порталам и мокированию компонентов.

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

### Тестирование интеграции тем

При тестировании компонентов, зависящих от тем Radix UI:

1. **Настройка Theme Provider**:
```typescript
import { Theme as RadixTheme } from "@radix-ui/themes";

const TestThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RadixTheme appearance="dark" accentColor="blue" radius="medium">
    {children}
  </RadixTheme>
);
```

2. **Использование Theme Provider в тестах**:
```typescript
describe('ComponentWithTheme', () => {
  it('рендерится корректно с темой', () => {
    render(
      <TestThemeProvider>
        <ComponentWithTheme />
      </TestThemeProvider>
    );
    // ... тестовые утверждения
  });
});
```

### Тестирование переключения тем

При тестировании компонентов, которые могут переключать темы:

1. **Мок Theme Context**:
```typescript
const mockSetTheme = vi.fn();
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light', // или 'dark', 'auto'
    setTheme: mockSetTheme,
  }),
}));
```

2. **Тестирование изменений темы**:
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

При тестировании компонентов, использующих систему стилизации Radix UI:

1. **Не тестируйте детали реализации** системы стилизации Radix UI.
2. **Сосредоточьтесь на тестировании поведения компонента** и взаимодействий пользователя.
3. **Используйте атрибуты data-testid** для выбора элементов вместо селекторов на основе стилей.

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

### Лучшие практики для тестирования Radix UI

1. **Мокируйте порталы соответствующим образом**:
   - Используйте простые div элементы вместо порталов в тестах.
   - Добавляйте data-testid для удобного поиска элементов.

2. **Обрабатывайте изменения темы**:
   - Тестируйте компонент в разных темах.
   - Проверяйте корректность отображения контента при смене темы.

3. **Тестируйте доступность**:
   - Проверяйте ARIA атрибуты.
   - Тестируйте навигацию с клавиатуры.

4. **Взаимодействие компонентов**:
   - Тестируйте открытие/закрытие выпадающих меню.
   - Проверяйте обработку событий клика и наведения.

5. **Обрабатывайте колбэки событий осторожно**:
   - Некоторые обработчики событий Radix (например, `onOpenChange` у `Dialog.Root`) могут передавать аргументы в колбэк.
   - Если вы передаете свою функцию напрямую (например, `onOpenChange={myHandler}`), убедитесь, что она может принимать эти аргументы или что они не вызовут проблем.
   - Безопаснее использовать обертку (`onOpenChange={() => myHandler()}`) или вынести обработчик в `useCallback`, если аргументы не нужны или должны быть проигнорированы.

### Распространенные ошибки

1. **Тестирование внутренней реализации Radix UI**:
   - Избегайте тестирования внутренних механизмов библиотеки.
   - Фокусируйтесь на пользовательском взаимодействии.

2. **Сложности с порталами**:
   - Используйте моки для порталов.
   - Дожидайтесь рендеринга контента с помощью waitFor.

3. **Проблемы с темами**:
   - Всегда оборачивайте компоненты в ThemeProvider.
   - Учитывайте возможность автоматической смены темы.

## Тестирование сложных композиций компонентов

При тестировании сложных компонентов, разделенных на несколько подкомпонентов, следует применять особый подход:

### Тестирование на разных уровнях

1. **Тестирование корневого компонента**:
   - Проверяйте только общее поведение и интеграцию подкомпонентов.
   - Мокируйте подкомпоненты при необходимости, избегая тестирования их внутренней логики.
   - Сосредоточьтесь на проверке правильности передачи пропсов.

```typescript
// Мок подкомпонентов для тестирования корневого компонента
vi.mock('../FileNode', () => ({
  FileNode: ({ node, onToggleWanted, onToggleExpand }) => (
    <div
      data-testid={`file-node-mock-${node.Path}`}
      data-path={node.Path}
      onClick={() => onToggleWanted(node)}
      onDoubleClick={() => onToggleExpand(node)}
    />
  )
}));

it('передает правильные пропсы в подкомпоненты', async () => {
  render(<TorrentContent id={123} name="Test" onClose={mockClose} />);

  await waitFor(() => {
    const fileNode = screen.getByTestId('file-node-mock-file1.txt');
    expect(fileNode).toHaveAttribute('data-path', 'file1.txt');
  });

  // Проверка взаимодействия между компонентами
  fireEvent.click(fileNode);
  expect(mockSetFilesWanted).toHaveBeenCalled();
});
```

2. **Тестирование подкомпонентов**:
   - Тестируйте подкомпоненты изолированно, с различными пропсами.
   - Проверяйте все возможные состояния подкомпонентов.
   - Фокусируйтесь на специфичной для подкомпонента логике.

### Тестирование кастомных хуков

Для компонентов, выносящих логику в кастомные хуки (например, `useTorrentFiles`, `useDownloadDirectory`):

1. **Изолированное тестирование хуков**:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTorrentFiles } from '../hooks/useTorrentFiles';
import { GetTorrentFiles, SetFilesWanted } from '../../wailsjs/go/main/App';

// Мокируем внешние зависимости
vi.mock('../../wailsjs/go/main/App', () => ({
  GetTorrentFiles: vi.fn(),
  SetFilesWanted: vi.fn()
}));

describe('хук useTorrentFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('загружает файлы при монтировании', async () => {
    vi.mocked(GetTorrentFiles).mockResolvedValue([
      { ID: 1, Path: 'file1.txt', Size: 100, Progress: 50, Wanted: true }
    ]);

    const { result, waitForNextUpdate } = renderHook(() => useTorrentFiles(123));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.fileTree.length).toBe(1);
    expect(GetTorrentFiles).toHaveBeenCalledWith(123);
  });

  it('переключает выбор файла', async () => {
    vi.mocked(GetTorrentFiles).mockResolvedValue([
      { ID: 1, Path: 'file1.txt', Size: 100, Progress: 50, Wanted: true }
    ]);

    const { result, waitForNextUpdate } = renderHook(() => useTorrentFiles(123));

    await waitForNextUpdate();

    act(() => {
      result.current.toggleNode(result.current.fileTree[0]);
    });

    expect(SetFilesWanted).toHaveBeenCalledWith(123, [1], false);
  });
});
```

2. **Тестирование интеграции хуков с компонентами**:
   - Проверяйте обновление компонента при изменении данных в хуке.
   - Тестируйте пограничные случаи и обработку ошибок.

### Тестирование взаимодействия с API

Для компонентов, работающих с внешними API:

```typescript
it('корректно обрабатывает ошибки API', async () => {
  vi.mocked(GetTorrentFiles).mockRejectedValue(new Error('API error'));

  render(<TorrentContent id={123} name="Test" onClose={mockClose} />);

  await waitFor(() => {
    expect(screen.getByTestId('files-error')).toBeInTheDocument();
    expect(screen.getByTestId('files-error')).toHaveTextContent('errors.failedToLoadFiles');
  });
});
```

### Особенности тестирования сложных взаимодействий

1. **Проверка эффектов действий в UI на данные**:
```typescript
it('обновляет состояние выбора при переключении файлов', async () => {
  // Настраиваем начальное состояние
  vi.mocked(GetTorrentFiles).mockResolvedValue([
    { ID: 1, Path: 'file1.txt', Size: 100, Progress: 50, Wanted: true },
    { ID: 2, Path: 'file2.txt', Size: 100, Progress: 50, Wanted: true }
  ]);

  render(<TorrentContent id={123} name="Test" onClose={mockClose} />);

  // Ждем загрузку файлов
  await waitFor(() => {
    expect(screen.getByTestId('file-node-file1.txt')).toBeInTheDocument();
  });

  // Имитируем переключение выбора всех файлов
  const toggleAll = screen.getByTestId('toggle-all-checkbox');
  fireEvent.click(toggleAll);

  // Проверяем вызов API для снятия выбора
  expect(SetFilesWanted).toHaveBeenCalledWith(123, [1, 2], false);
});
```

2. **Тестирование синхронизации данных между компонентами**:
   - Проверяйте, что изменения в одном компоненте отражаются в других.
   - Тестируйте использование общих данных через контекст или пропсы.

## Тестирование состояний загрузки и обработки ошибок

### 1. Состояния загрузки

1. **Начальное состояние загрузки**:
   ```typescript
   it('отображает спиннер при начальной загрузке', () => {
     render(<Component />);
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
   });
   ```

2. **Переход между состояниями**:
   ```typescript
   it('скрывает спиннер после загрузки данных', async () => {
     render(<Component />);

     // Проверяем наличие спиннера
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Ждем завершения загрузки
     await waitFor(() => {
       expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
     });
   });
   ```

3. **Множественные загрузки**:
   ```typescript
   it('корректно обрабатывает параллельные загрузки', async () => {
     render(<Component />);

     // Запускаем несколько загрузок
     fireEvent.click(screen.getByTestId('load-item-1'));
     fireEvent.click(screen.getByTestId('load-item-2'));

     // Проверяем спиннер
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Ждем завершения всех загрузок
     await waitFor(() => {
       expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
     });
   });
   ```

### 2. Обработка ошибок

1. **Отображение ошибок**:
   ```typescript
   it('отображает сообщение об ошибке при неудачной загрузке', async () => {
     // Мокируем ошибку
     vi.mocked(loadData).mockRejectedValue(new Error('Тестовая ошибка'));

     render(<Component />);

     await waitFor(() => {
       expect(screen.getByTestId('error-display'))
         .toHaveTextContent('Тестовая ошибка');
     });
   });
   ```

2. **Повторные попытки**:
   ```typescript
   it('позволяет повторить загрузку после ошибки', async () => {
     // Сначала ошибка, потом успех
     vi.mocked(loadData)
       .mockRejectedValueOnce(new Error('Ошибка'))
       .mockResolvedValueOnce({ data: 'success' });

     render(<Component />);

     // Ждем появления ошибки
     await waitFor(() => {
       expect(screen.getByTestId('error-display')).toBeInTheDocument();
     });

     // Нажимаем кнопку повтора
     fireEvent.click(screen.getByTestId('error-retry-button'));

     // Проверяем успешную загрузку
     await waitFor(() => {
       expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
       expect(screen.getByText('success')).toBeInTheDocument();
     });
   });
   ```

### 3. Комбинации состояний

1. **Переходы между состояниями**:
   ```typescript
   it('правильно переключается между состояниями', async () => {
     render(<Component />);

     // Начальная загрузка
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Успешная загрузка
     await waitFor(() => {
       expect(screen.getByTestId('content')).toBeInTheDocument();
     });

     // Запуск новой загрузки
     fireEvent.click(screen.getByTestId('refresh-button'));
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Ошибка при обновлении
     await waitFor(() => {
       expect(screen.getByTestId('error-display')).toBeInTheDocument();
     });
   });
   ```

2. **Восстановление после ошибок**:
   ```typescript
   it('восстанавливает предыдущее состояние после ошибки', async () => {
     const initialData = { value: 'initial' };
     const mockLoad = vi.mocked(loadData)
       .mockResolvedValueOnce(initialData)
       .mockRejectedValueOnce(new Error('Ошибка обновления'));

     const { rerender } = render(<Component />);

     // Ждем начальной загрузки
     await waitFor(() => {
       expect(screen.getByText('initial')).toBeInTheDocument();
     });

     // Пробуем обновить с ошибкой
     fireEvent.click(screen.getByTestId('refresh-button'));

     await waitFor(() => {
       // Проверяем наличие ошибки
       expect(screen.getByTestId('error-display')).toBeInTheDocument();
       // Проверяем, что старые данные все еще отображаются
       expect(screen.getByText('initial')).toBeInTheDocument();
     });
   });
   ```

### 4. Отмена загрузок

1. **Отмена при размонтировании**:
   ```typescript
   it('отменяет загрузку при размонтировании', async () => {
     const mockAbort = vi.fn();
     const mockController = new AbortController();
     mockController.abort = mockAbort;
     vi.mocked(window.AbortController).mockImplementation(() => mockController);

     const { unmount } = render(<Component />);

     // Размонтируем компонент во время загрузки
     unmount();

     expect(mockAbort).toHaveBeenCalled();
   });
   ```

2. **Отмена пользователем**:
   ```typescript
   it('позволяет пользователю отменить загрузку', async () => {
     render(<Component />);

     // Запускаем загрузку
     fireEvent.click(screen.getByTestId('start-load-button'));

     // Отменяем загрузку
     fireEvent.click(screen.getByTestId('cancel-button'));

     await waitFor(() => {
       // Проверяем, что загрузка отменена
       expect(screen.queryByTestId('loading-spinner'))
         .not.toBeInTheDocument();
       // Проверяем сообщение об отмене
       expect(screen.getByText('Загрузка отменена'))
         .toBeInTheDocument();
     });
   });
   ```

### 5. Тестирование таймаутов

1. **Обработка таймаутов**:
   ```typescript
   it('обрабатывает таймаут загрузки', async () => {
     // Мокируем функцию загрузки, которая не завершается
     vi.mocked(loadData).mockImplementation(() => new Promise(() => {}));

     render(<Component timeout={1000} />);

     // Ждем сообщения о таймауте
     await waitFor(() => {
       expect(screen.getByText('Превышено время ожидания'))
         .toBeInTheDocument();
     }, { timeout: 2000 });
   });
   ```

2. **Автоматические повторные попытки**:
   ```typescript
   it('автоматически повторяет попытку после таймаута', async () => {
     // Первый запрос - таймаут, второй - успех
     vi.mocked(loadData)
       .mockImplementationOnce(() => new Promise(() => {}))
       .mockResolvedValueOnce({ data: 'success' });

     render(<Component timeout={1000} retryCount={1} />);

     // Ждем успешной загрузки после повторной попытки
     await waitFor(() => {
       expect(screen.getByText('success')).toBeInTheDocument();
     }, { timeout: 3000 });

     // Проверяем количество попыток
     expect(loadData).toHaveBeenCalledTimes(2);
   });
   ```

### 6. Тестирование индикаторов прогресса

1. **Прогресс загрузки**:
   ```typescript
   it('отображает прогресс загрузки', async () => {
     const mockProgress = vi.fn();
     vi.mocked(loadData).mockImplementation(async () => {
       mockProgress(0);
       await new Promise(resolve => setTimeout(resolve, 100));
       mockProgress(50);
       await new Promise(resolve => setTimeout(resolve, 100));
       mockProgress(100);
       return { data: 'success' };
     });

     render(<Component onProgress={mockProgress} />);

     await waitFor(() => {
       expect(mockProgress).toHaveBeenNthCalledWith(1, 0);
       expect(mockProgress).toHaveBeenNthCalledWith(2, 50);
       expect(mockProgress).toHaveBeenNthCalledWith(3, 100);
     });
   });
   ```

2. **Индикаторы состояния**:
   ```typescript
   it('корректно отображает индикаторы состояния', async () => {
     render(<Component />);

     // Проверяем начальное состояние
     expect(screen.getByTestId('status-indicator'))
       .toHaveAttribute('data-status', 'idle');

     // Запускаем загрузку
     fireEvent.click(screen.getByTestId('start-button'));
     expect(screen.getByTestId('status-indicator'))
       .toHaveAttribute('data-status', 'loading');

     // Ждем завершения
     await waitFor(() => {
       expect(screen.getByTestId('status-indicator'))
         .toHaveAttribute('data-status', 'success');
     });
   });
   ```

### 7. Рекомендации

1. **Всегда тестируйте**:
   - Начальное состояние загрузки
   - Успешное завершение загрузки
   - Обработку ошибок
   - Возможность повторных попыток
   - Отмену загрузки
   - Восстановление после ошибок

2. **Используйте правильные утверждения**:
   ```typescript
   // ❌ Плохо: нестабильный тест
   await new Promise(resolve => setTimeout(resolve, 1000));
   expect(screen.getByTestId('content')).toBeInTheDocument();

   // ✅ Хорошо: ждем изменения состояния
   await waitFor(() => {
     expect(screen.getByTestId('content')).toBeInTheDocument();
   });
   ```

3. **Тестируйте пограничные случаи**:
   - Множественные параллельные загрузки
   - Отмена во время загрузки
   - Повторная загрузка при наличии ошибки
   - Таймауты и сетевые проблемы

4. **Моделируйте реальные сценарии**:
   - Медленное соединение
   - Потеря связи
   - Частичная загрузка данных
   - Неожиданные форматы ответов

5. **Поддерживайте чистоту тестов**:
   - Сбрасывайте моки между тестами
   - Очищайте таймеры
   - Восстанавливайте исходное состояние
   - Изолируйте тесты друг от друга

## Управление состоянием в тестах

### 1. Подготовка начального состояния

1. **Использование фабрик данных**:
   ```typescript
   // test/factories/torrent.ts
   export const createTorrent = (override = {}) => ({
     id: 1,
     name: "test.torrent",
     progress: 0,
     status: "stopped",
     ...override
   });

   // В тестах:
   it('отображает прогресс торрента', () => {
     const torrent = createTorrent({ progress: 50 });
     render(<TorrentItem torrent={torrent} />);
     expect(screen.getByTestId('progress-bar')).toHaveAttribute('value', '50');
   });
   ```

2. **Мокирование глобального состояния**:
   ```typescript
   const mockStore = {
     torrents: [createTorrent(), createTorrent()],
     settings: { theme: 'dark' },
     user: { isAuthenticated: true }
   };

   const mockTorrentContext = {
     state: mockStore,
     dispatch: vi.fn()
   };

   vi.mock('../contexts/TorrentContext', () => ({
     useTorrentContext: () => mockTorrentContext
   }));
   ```

### 2. Тестирование побочных эффектов

1. **Проверка вызовов эффектов**:
   ```typescript
   it('обновляет данные при изменении ID', () => {
     const loadData = vi.fn();
     const { rerender } = render(
       <Component id={1} onLoad={loadData} />
     );

     // Проверяем первоначальную загрузку
     expect(loadData).toHaveBeenCalledWith(1);

     // Меняем пропсы
     rerender(<Component id={2} onLoad={loadData} />);

     // Проверяем повторный вызов с новым ID
     expect(loadData).toHaveBeenCalledWith(2);
   });
   ```

2. **Тестирование очистки эффектов**:
   ```typescript
   it('отписывается от событий при размонтировании', () => {
     const unsubscribe = vi.fn();
     vi.mocked(subscribeToEvents).mockReturnValue(unsubscribe);

     const { unmount } = render(<Component />);
     unmount();

     expect(unsubscribe).toHaveBeenCalled();
   });
   ```

### 3. Тестирование изменений состояния

1. **Проверка обновления UI**:
   ```typescript
   it('обновляет UI при изменении данных', async () => {
     const { rerender } = render(
       <TorrentList torrents={[createTorrent({ progress: 0 })]} />
     );

     // Проверяем начальное состояние
     expect(screen.getByTestId('progress-0')).toBeInTheDocument();

     // Обновляем пропсы
     rerender(
       <TorrentList torrents={[createTorrent({ progress: 50 })]} />
     );

     // Проверяем обновление UI
     await waitFor(() => {
       expect(screen.getByTestId('progress-50')).toBeInTheDocument();
     });
   });
   ```

2. **Тестирование условного рендеринга**:
   ```typescript
   it('показывает разные компоненты в зависимости от состояния', () => {
     const { rerender } = render(
       <StatusDisplay status="loading" />
     );

     // Проверяем состояние загрузки
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Меняем состояние
     rerender(<StatusDisplay status="error" />);

     // Проверяем отображение ошибки
     expect(screen.getByTestId('error-message')).toBeInTheDocument();
   });
   ```

### 4. Работа с асинхронным состоянием

1. **Тестирование промежуточных состояний**:
   ```typescript
   it('отображает все этапы загрузки', async () => {
     render(<DataLoader />);

     // Начальное состояние
     expect(screen.getByTestId('initial-state')).toBeInTheDocument();

     // Состояние загрузки
     fireEvent.click(screen.getByText('Загрузить'));
     expect(screen.getByTestId('loading-state')).toBeInTheDocument();

     // Финальное состояние
     await waitFor(() => {
       expect(screen.getByTestId('loaded-state')).toBeInTheDocument();
     });
   });
   ```

2. **Обработка гонки состояний**:
   ```typescript
   it('обрабатывает гонку состояний корректно', async () => {
     // Создаем Promise, который завершится позже
     const slowData = new Promise(resolve =>
       setTimeout(() => resolve('slow'), 100)
     );

     // Создаем Promise, который завершится раньше
     const fastData = Promise.resolve('fast');

     // Первый запрос (медленный)
     vi.mocked(loadData).mockResolvedValueOnce(slowData);

     const { rerender } = render(<Component id={1} />);

     // Второй запрос (быстрый)
     vi.mocked(loadData).mockResolvedValueOnce(fastData);
     rerender(<Component id={2} />);

     // Проверяем, что отображаются данные от последнего запроса
     await waitFor(() => {
       expect(screen.getByText('fast')).toBeInTheDocument();
     });
   });
   ```

### 5. Тестирование кеширования

1. **Проверка механизма кеширования**:
   ```typescript
   it('использует кешированные данные при повторном рендере', async () => {
     const loadData = vi.fn().mockResolvedValue({ data: 'test' });

     const { rerender } = render(
       <CachedComponent id={1} loadData={loadData} />
     );

     // Ждем первой загрузки
     await waitFor(() => {
       expect(screen.getByText('test')).toBeInTheDocument();
     });

     // Перерендер с теми же пропсами
     rerender(<CachedComponent id={1} loadData={loadData} />);

     // Проверяем, что повторной загрузки не было
     expect(loadData).toHaveBeenCalledTimes(1);
   });
   ```

2. **Тестирование инвалидации кеша**:
   ```typescript
   it('сбрасывает кеш при необходимости', async () => {
     const loadData = vi.fn()
       .mockResolvedValueOnce({ data: 'old' })
       .mockResolvedValueOnce({ data: 'new' });

     const { rerender } = render(
       <CachedComponent id={1} version={1} loadData={loadData} />
     );

     // Ждем первой загрузки
     await waitFor(() => {
       expect(screen.getByText('old')).toBeInTheDocument();
     });

     // Меняем версию для инвалидации кеша
     rerender(<CachedComponent id={1} version={2} loadData={loadData} />);

     // Проверяем перезагрузку данных
     await waitFor(() => {
       expect(screen.getByText('new')).toBeInTheDocument();
     });
     expect(loadData).toHaveBeenCalledTimes(2);
   });
   ```

### 6. Тестирование оптимизаций производительности

1. **Проверка мемоизации**:
   ```typescript
   it('не перерендеривает оптимизированные компоненты', () => {
     const renderSpy = vi.fn();

     const OptimizedChild = memo(() => {
       renderSpy();
       return <div>Optimized</div>;
     });

     const { rerender } = render(
       <Parent>
         <OptimizedChild />
       </Parent>
     );

     // Первый рендер
     expect(renderSpy).toHaveBeenCalledTimes(1);

     // Обновление родителя не должно вызывать рендер дочернего
     rerender(
       <Parent>
         <OptimizedChild />
       </Parent>
     );

     expect(renderSpy).toHaveBeenCalledTimes(1);
   });
   ```

2. **Тестирование useMemo и useCallback**:
   ```typescript
   it('сохраняет ссылки на мемоизированные значения', () => {
     const results: any[] = [];

     const TestComponent = () => {
       const [, setCount] = useState(0);
       const memoizedValue = useMemo(() => ({ test: true }), []);
       const memoizedCallback = useCallback(() => {}, []);

       results.push({
         value: memoizedValue,
         callback: memoizedCallback
       });

       return (
         <button onClick={() => setCount(c => c + 1)}>
           Обновить
         </button>
       );
     };

     render(<TestComponent />);

     // Вызываем обновление
     fireEvent.click(screen.getByText('Обновить'));

     // Проверяем, что ссылки остались теми же
     expect(results[0].value).toBe(results[1].value);
     expect(results[0].callback).toBe(results[1].callback);
   });
   ```

### 7. Рекомендации

1. **Изолируйте тесты состояния**:
   ```typescript
   describe('Состояние компонента', () => {
     beforeEach(() => {
       // Сброс состояния перед каждым тестом
       vi.clearAllMocks();
     });

     it('тестирует одно изменение состояния', () => {
       // Один тест - одно изменение
     });
   });
   ```

2. **Используйте снимки состояния**:
   ```typescript
   it('корректно обновляет состояние', () => {
     const states: any[] = [];
     const TestComponent = () => {
       const state = useMyState();
       states.push({ ...state });
       return null;
     };

     render(<TestComponent />);

     // Проверяем все состояния
     expect(states).toMatchSnapshot();
   });
   ```

3. **Тестируйте граничные случаи**:
   ```typescript
   it('обрабатывает некорректные состояния', () => {
     // Проверка null
     render(<Component state={null} />);
     expect(screen.getByText('Нет данных')).toBeInTheDocument();

     // Проверка пустого объекта
     render(<Component state={{}} />);
     expect(screen.getByText('Некорректные данные')).toBeInTheDocument();

     // Проверка невалидных данных
     render(<Component state={{ invalid: true }} />);
     expect(screen.getByText('Ошибка данных')).toBeInTheDocument();
   });
   ```

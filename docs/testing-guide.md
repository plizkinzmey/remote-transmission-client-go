# Frontend Testing Guide

This guide describes the principles and practices for testing frontend components in the Transmission Client project. Following these rules will help maintain high code quality and simplify collaboration.

## Contents

- [Frontend Testing Guide](#frontend-testing-guide)
  - [Contents](#contents)
  - [Technology Stack](#technology-stack)
  - [Test Structure](#test-structure)
  - [Coverage Requirements](#coverage-requirements)
  - [Mocks and Stubs](#mocks-and-stubs)
    - [CSS Modules](#css-modules)
    - [External Dependencies](#external-dependencies)
    - [Wails API and Go Functions](#wails-api-and-go-functions)
  - [Test Naming](#test-naming)
    - [Язык описания тестов](#язык-описания-тестов)
  - [Selectors in Tests](#selectors-in-tests)
    - [Preferred selectors (in order of priority):](#preferred-selectors-in-order-of-priority)
    - [Avoid:](#avoid)
    - [Best Practices for data-testid](#best-practices-for-data-testid)
  - [Testing Components with Portals](#testing-components-with-portals)
    - [Finding Elements in Portals](#finding-elements-in-portals)
    - [Waiting for Portal Content](#waiting-for-portal-content)
    - [Mocking Portal Components](#mocking-portal-components)
    - [Testing Portal Events](#testing-portal-events)
    - [Common Issues](#common-issues)
    - [Example Test](#example-test)
    - [Best Practices](#best-practices)
  - [Style Testing](#style-testing)
  - [Running Tests](#running-tests)
    - [Running all tests:](#running-all-tests)
    - [Running tests with coverage report:](#running-tests-with-coverage-report)
    - [Running specific tests:](#running-specific-tests)
  - [Common Issues and Solutions](#common-issues-and-solutions)
    - [1. CSS Module Issues](#1-css-module-issues)
    - [2. Re-rendering Issues](#2-re-rendering-issues)
    - [3. React Context Issues](#3-react-context-issues)
  - [Testing File Operations](#testing-file-operations)
    - [Mocking FileReader](#mocking-filereader)
  - [Testing Browser APIs](#testing-browser-apis)
    - [Mocking ResizeObserver](#mocking-resizeobserver)
  - [Dealing with Asynchronous Tests](#dealing-with-asynchronous-tests)
    - [Proper use of waitFor](#proper-use-of-waitfor)
    - [Testing React useEffect hooks](#testing-react-useeffect-hooks)
  - [Achieving 100% Test Coverage](#achieving-100-test-coverage)
  - [Testing React.useState Mocking](#testing-reactusestate-mocking)
  - [Testing Components that use External Libraries](#testing-components-that-use-external-libraries)
  - [Testing Radix UI Components](#testing-radix-ui-components)
  - [Testing Complex Component Compositions](#testing-complex-component-compositions)
  - [Тестирование состояний загрузки и обработки ошибок](#тестирование-состояний-загрузки-и-обработки-ошибок)
  - [Управление состоянием в тестах](#управление-состоянием-в-тестах)

## Technology Stack

The following technologies are used for frontend testing:

- **Vitest** - main testing framework
- **React Testing Library** - library for testing React components
- **Jest DOM** - extensions for testing DOM elements

## Test Structure

All frontend component tests should be located in the `frontend/src/test/components` directory and correspond to the source code structure:

```
frontend/src/
  components/
    MyComponent.tsx
  test/
    components/
      MyComponent.test.tsx
```

Unit tests should check:
1. Proper component rendering
2. Correct handling of props
3. Component behavior under different conditions
4. User event handling (if applicable)
5. Correct usage of styles and CSS classes

## Coverage Requirements

The following test coverage requirements are established to ensure code quality:

- **Lines**: at least 70%
- **Functions**: at least 70%
- **Branches**: at least 70%
- **Statements**: at least 70%

For new components, it's recommended to aim for 100% code coverage.

## Mocks and Stubs

### CSS Modules

CSS modules should be mocked in the `setup-tests.ts` file using the format:

```typescript
vi.mock("../styles/ComponentName.module.css", () => ({
  default: {
    className1: "className1-mock",
    className2: "className2-mock",
    // ...
  }
}));
```

### External Dependencies

Third-party libraries and components (e.g., Radix UI components) should be mocked in test files:

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

### Wails API and Go Functions

Mocks for Wails functions and Go calls should be defined in `setup-tests.ts`:

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

## Test Naming

Use the following template for naming tests:

```typescript
describe('ComponentName', () => {
  it('action/behavior when condition', () => {
    // test code
  });
});
```

### Язык описания тестов

Все описания тестов должны быть написаны на русском языке для обеспечения согласованности и понятности для команды разработки:

```typescript
describe('КомпонентName', () => {
  it('отображает сообщение об ошибке при наличии ошибки', () => {
    // код теста
  });

  it('скрывает сообщение при отсутствии ошибок', () => {
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

## Selectors in Tests

### Preferred selectors (in order of priority):

1. **data-testid** - Always use `data-testid` attributes for key elements:

```typescript
// In component:
<div data-testid="status-container">...</div>

// In test:
const container = screen.getByTestId("status-container");
```

2. **Text queries**:

```typescript
screen.getByText("Error message")
```

3. **Role queries**:

```typescript
screen.getByRole("button", { name: "Save" })
```

### Avoid:

- CSS class selectors (except when checking for the presence of classes)
- Index-based selectors (`firstChild`, `childNodes[1]`, etc.)
- DOM structure selectors that might change
- Using `querySelector` directly on DOM elements (use RTL's methods instead)

### Best Practices for data-testid

When adding data-testid attributes to components, follow these guidelines:

1. **Be specific and descriptive**:
   ```jsx
   // GOOD
   <button data-testid="save-settings-button">Save</button>
   
   // TOO GENERIC
   <button data-testid="button">Save</button>
   ```

2. **Use consistent naming patterns**:
   ```jsx
   // Recommended pattern: [component]-[element]-[variant/state]
   <input data-testid="search-input-active" />
   <button data-testid="search-button-disabled" disabled />
   ```

3. **Add data-testid to library components**:
   For external UI libraries (like Radix UI, Material UI), wrap them or extend with data-testid:
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

4. **Add data-testid to dynamic components**:
   ```jsx
   {items.map((item, index) => (
     <li key={item.id} data-testid={`item-${item.id}`}>
       {item.name}
     </li>
   ))}
   ```

5. **Add data-testid for conditional rendering**:
   ```jsx
   {isLoading ? (
     <div data-testid="loading-state"><Spinner /></div>
   ) : (
     <div data-testid="loaded-state">{content}</div>
   )}
   ```

6. **Don't overuse**:
   Add data-testid only to elements you actually need to interact with or assert in tests.

7. **Add data-testid to forms**:
   Always add data-testid to forms to avoid using querySelector:
   ```jsx
   <form data-testid="add-item-form" onSubmit={handleSubmit}>
     {/* form content */}
   </form>
   ```

8. **Use data-testid for form submission tests**:
   When testing form submission, use the form's data-testid instead of targeting the submit button:
   ```typescript
   // GOOD
   const form = screen.getByTestId("add-item-form");
   fireEvent.submit(form);
   
   // AVOID (more brittle)
   const submitButton = screen.getByText("Submit");
   fireEvent.click(submitButton);
   ```

## Testing Components with Portals

Components that use portals (like modals, dialogs, or tooltips from Radix UI) render content outside the regular DOM hierarchy, which requires special testing approaches.

### Finding Elements in Portals

When testing components that use portals, use document-level selectors instead of component-scoped ones:

```typescript
// INCORRECT: This may not find elements in portals
const modal = screen.getByTestId("settings-modal");

// CORRECT: Use document-level queries
const modal = document.querySelector('[data-testid="settings-modal"]');

// OR use the within utility to search the entire document.body
import { within } from '@testing-library/react';
const modal = within(document.body).getByTestId("settings-modal");
```

### Waiting for Portal Content

When a portal is dynamically rendered (e.g., after clicking a button), wait for the content to appear:

```typescript
import { act } from '@testing-library/react';

// Click a button that opens a portal-based modal
fireEvent.click(openModalButton);

// Wait for portal content to render
await act(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
});

// Now test the portal content
const modal = document.querySelector('[data-testid="modal-content"]');
expect(modal).not.toBeNull();
```

### Mocking Portal Components

For components like Radix UI that use portals internally, you can mock them to simplify testing:

```typescript
// Mock Dialog.Portal component from Radix UI
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog');
  return {
    ...actual,
    DialogPortal: ({ children }) => <div data-testid="mocked-portal">{children}</div>,
  };
});
```

### Testing Portal Events

When testing events on elements inside portals:

1. Use `act()` to wrap state updates:

```typescript
await act(async () => {
  fireEvent.click(openModalButton);
});
```

2. Ensure events bubble correctly:

```typescript
// Add the bubbles: true option to ensure events propagate correctly
portalElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
// Or when using fireEvent:
fireEvent(element, new MouseEvent('click', { bubbles: true }));
```

### Common Issues

1. **Event Bubbling**: Events in portals need `bubbles: true` to propagate correctly

2. **State Updates**: Always wrap portal-related state changes in `act()`

3. **Cleanup**: Ensure portals are properly cleaned up after tests:

```typescript
afterEach(() => {
  cleanup(); // Will remove portal elements
});
```

### Example Test

Here's a complete example of testing a modal component that uses a portal:

```typescript
describe('Modal Component', () => {
  it('opens and closes correctly', async () => {
    render(<Modal />);
    
    // Open modal
    await act(async () => {
      fireEvent.click(screen.getByText('Open Modal'));
    });

    // Check modal content (in portal)
    const modalContent = within(document.body).getByTestId('modal-content');
    expect(modalContent).toBeInTheDocument();

    // Close modal
    await act(async () => {
      fireEvent.click(within(document.body).getByText('Close'));
    });

    expect(modalContent).not.toBeInTheDocument();
  });
});
```

### Best Practices

1. Always use `act()` when triggering state changes in portals
2. Use document-level queries to find portal content
3. Add proper cleanup in `afterEach`
4. Mock portal components when possible to simplify tests
5. Add proper test IDs to portal content

## Style Testing

To check style application, use:

```typescript
// Testing inline styles
expect(element).toHaveStyle("color: red");

// Testing CSS classes
expect(element).toHaveClass(styles.errorMessage);

// Testing attributes
expect(element).toHaveAttribute("width", "24px");
```

## Running Tests

### Running all tests:

```
npm run test
```

### Running tests with coverage report:

```
npm run test:coverage
```

### Running specific tests:

```
npm run test -- StatusMessage
```

## Common Issues and Solutions

### 1. CSS Module Issues

For errors like "Cannot read property 'className' of undefined":

- Make sure the CSS module is correctly mocked in `setup-tests.ts`
- Verify that the mock format matches the usage in the component (with or without a `default` object)

### 2. Re-rendering Issues

For errors related to component updates after actions:

- Use `rerender` from React Testing Library
- Ensure all state updates are wrapped in `act()`

### 3. React Context Issues

If your components use React Context (like ThemeContext or LocalizationContext), you need to create context wrappers for testing:

```typescript
// Create a mock file in src/test/mocks/localization-context-mock.tsx
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

Use this wrapper in tests:

```typescript
render(
  <MockLocalizationProvider>
    <ComponentToTest />
  </MockLocalizationProvider>
);
```

## Testing File Operations

### Mocking FileReader

When testing components that handle file uploads or drag-and-drop operations:

```typescript
// Store original FileReader implementation
const OriginalFileReader = window.FileReader;

// Set up mock before tests
beforeEach(() => {
  const fileReaderMock = {
    readAsDataURL: vi.fn(),
    onload: null as any,
    result: "data:application/x-bittorrent;base64,mockBase64Content"
  };
  
  // Replace global FileReader
  window.FileReader = vi.fn(() => fileReaderMock);
});

// Restore original after tests
afterEach(() => {
  window.FileReader = OriginalFileReader;
});

it('handles file selection', () => {
  // Create a mock file
  const file = new File(['content'], 'test.torrent', { type: 'application/x-bittorrent' });
  
  // Simulate file input change
  fireEvent.change(fileInput, { target: { files: [file] } });
  
  // Manually trigger onload event on the mock reader
  const mockReader = window.FileReader();
  if (mockReader.onload) {
    mockReader.onload({ target: mockReader } as any);
  }
  
  // Check result
  expect(onFileSelectMock).toHaveBeenCalledWith('test.torrent', 'mockBase64Content');
});
```

## Testing Browser APIs

### Mocking ResizeObserver

Many UI libraries like Radix UI use ResizeObserver which is not available in jsdom:

```typescript
// In setup-tests.ts or a dedicated mock file
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Add to global object before tests
window.ResizeObserver = MockResizeObserver;
```

## Dealing with Asynchronous Tests

### Proper use of waitFor

When testing components with asynchronous operations, always use `waitFor`:

```typescript
await waitFor(() => {
  expect(screen.getByText('Data loaded successfully')).toBeInTheDocument();
});
```

For operations that might take longer:

```typescript
await waitFor(() => {
  expect(mockOnPathChange).toHaveBeenCalled();
}, { timeout: 2000 });
```

### Testing React useEffect hooks

For components with multiple useEffect hooks:

```typescript
it('calls effect after render', async () => {
  const mockFunction = vi.fn();
  
  render(<Component onLoad={mockFunction} />);
  
  // Wait for all effects to complete
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

## Achieving 100% Test Coverage

To achieve 100% test coverage:

1. **Test all branches in conditional rendering**:
```typescript
it('renders loading state', () => {
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

2. **Test all possible React state combinations**:
   - Initial state
   - After user interaction
   - After data loading
   - Error states

3. **Mock all external dependencies**:
   - API calls
   - Context values
   - Browser APIs

4. **Test empty and edge cases**:
   - Empty arrays or collections
   - Boundary values
   - Invalid inputs

5. **Test cleanup functions in useEffect**:
```typescript
it('cleans up on unmount', () => {
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

## Testing React.useState Mocking

In some cases, you need to mock React.useState to test specific state conditions:

```typescript
it('returns null when loading', () => {
  const originalUseState = React.useState;
  
  // Mock useState to force loading state to true
  vi.spyOn(React, 'useState')
    .mockImplementationOnce(() => ["", vi.fn()]) // First useState call
    .mockImplementationOnce(() => [[], vi.fn()]) // Second useState call
    .mockImplementationOnce(() => [true, vi.fn()]); // isLoading state
  
  const { container } = render(<Component />);
  expect(container.firstChild).toBeNull();
  
  // Restore original
  React.useState = originalUseState;
});
```

## Testing Components that use External Libraries

When your component uses external libraries like Radix UI:

```typescript
// Create a wrapper for external library components
export const TestThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme="light" scaling="100%">
      <div>{children}</div>
    </ThemeProvider>
  );
};

// Use it in tests
render(
  <TestThemeProvider>
    <Component />
  </TestThemeProvider>
);
```

## Testing Radix UI Components

When testing components that use Radix UI, special attention needs to be paid to themes, portals, and component mocking.

### Mocking Radix UI Components

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

### Testing Theme Integration

When testing components that rely on Radix UI themes:

1. **Theme Provider Setup**:
```typescript
import { Theme as RadixTheme } from "@radix-ui/themes";

const TestThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RadixTheme appearance="dark" accentColor="blue" radius="medium">
    {children}
  </RadixTheme>
);
```

2. **Using Theme Provider in Tests**:
```typescript
describe('ComponentWithTheme', () => {
  it('renders correctly with theme', () => {
    render(
      <TestThemeProvider>
        <ComponentWithTheme />
      </TestThemeProvider>
    );
    // ... test assertions
  });
});
```

### Testing Theme Switches

When testing components that can switch themes:

1. **Mock Theme Context**:
```typescript
const mockSetTheme = vi.fn();
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light', // или 'dark', 'auto'
    setTheme: mockSetTheme,
  }),
}));
```

2. **Test Theme Changes**:
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

### Testing Styled Components

When testing components that use Radix UI styling system:

1. **Don't test implementation details** of Radix UI's styling system
2. **Focus on testing component behavior** and user interactions
3. **Use data-testid attributes** for selecting elements instead of style-based selectors

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

### Best Practices for Radix UI Testing

1. **Mock Portals Appropriately**:
   - Используйте простые div элементы вместо порталов в тестах
   - Добавляйте data-testid для удобного поиска элементов

2. **Handle Theme Changes**:
   - Тестируйте компонент в разных темах
   - Проверяйте корректность отображения контента при смене темы

3. **Test Accessibility**:
   - Проверяйте ARIA атрибуты
   - Тестируйте навигацию с клавиатуры

4. **Component Interaction**:
   - Тестируйте открытие/закрытие выпадающих меню
   - Проверяйте обработку событий клика и наведения

### Common Pitfalls

1. **Тестирование внутренней реализации Radix UI**:
   - Избегайте тестирования внутренних механизмов библиотеки
   - Фокусируйтесь на пользовательском взаимодействии

2. **Сложности с порталами**:
   - Используйте моки для порталов
   - Дожидайтесь рендеринга контента с помощью waitFor

3. **Проблемы с темами**:
   - Всегда оборачивайте компоненты в ThemeProvider
   - Учитывайте возможность автоматической смены темы

## Testing Complex Component Compositions

При тестировании сложных компонентов, разделенных на несколько подкомпонентов, следует применять особый подход:

### Тестирование на разных уровнях

1. **Тестирование корневого компонента**:
   - Проверяйте только общее поведение и интеграцию подкомпонентов
   - Мокируйте подкомпоненты при необходимости, избегая тестирования их внутренней логики
   - Сосредоточьтесь на проверке правильности передачи пропсов

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
   - Тестируйте подкомпоненты изолированно, с различными пропсами
   - Проверяйте все возможные состояния подкомпонентов
   - Фокусируйтесь на специфичной для подкомпонента логике

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

describe('useTorrentFiles хук', () => {
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
   - Проверяйте обновление компонента при изменении данных в хуке
   - Тестируйте пограничные случаи и обработку ошибок

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
   - Проверяйте, что изменения в одном компоненте отражаются в других
   - Тестируйте использование общих данных через контекст или пропсы

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
     fireEvent.click(screen.getByText('Load'));
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
           Update
         </button>
       );
     };

     render(<TestComponent />);
     
     // Вызываем обновление
     fireEvent.click(screen.getByText('Update'));
     
     // Проверяем, что ссылки остались теми же
     expect(results[0].value).toBe(results[1].value);
     expect(results[0].callback).toBe(results[1].callback);
   });
   ```

### 7. Рекомендации

1. **Изолируйте тесты состояния**:
   ```typescript
   describe('Component State', () => {
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
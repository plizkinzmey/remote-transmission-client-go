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
    - [Adhering to `exhaustive-deps`](#adhering-to-exhaustive-deps)
  - [Achieving 100% Test Coverage](#achieving-100-test-coverage)
  - [Testing React.useState Mocking](#testing-reactusestate-mocking)
  - [Testing Components that use External Libraries](#testing-components-that-use-external-libraries)
  - [Testing Radix UI Components](#testing-radix-ui-components)
    - [Best Practices for Radix UI Testing](#best-practices-for-radix-ui-testing)
  - [Testing Complex Component Compositions](#testing-complex-component-compositions)
  - [Testing Loading States and Error Handling](#testing-loading-states-and-error-handling)
  - [State Management in Tests](#state-management-in-tests)

## Technology Stack

The following technologies are used for frontend testing:

- **Vitest** - main testing framework
- **React Testing Library** - library for testing React components
- **Jest DOM** - extensions for testing DOM elements

## Test Structure

Tests for each component should be located in a `__tests__` subdirectory within the component's directory:

```
frontend/src/
  components/
    MyComponent/
      __tests__/
        MyComponent.test.tsx  # Tests for the main component
        index.test.tsx      # Tests for index.ts
      MyComponent.tsx
      index.ts
      MyComponent.module.css
      README.md
```

Unit tests should verify:
1. Correct rendering of the component (`MyComponent.test.tsx`)
2. Correct handling of props (`MyComponent.test.tsx`)
3. Component behavior under various conditions (`MyComponent.test.tsx`)
4. Handling of user events (if applicable) (`MyComponent.test.tsx`)
5. Correct use of styles and CSS classes (`MyComponent.test.tsx`)
6. **Correct re-export of the component and its types from `index.ts` (`index.test.tsx`)**:
   - Ensure that `index.ts` exports the main component.
   - Ensure that `index.ts` exports the component's props type (if it exists).

Example test for `index.ts`:
```typescript
// filepath: src/components/MyComponent/__tests__/index.test.tsx
import { describe, it, expect } from "vitest";
import { MyComponent } from "../index"; // Import from index.ts
import { MyComponent as OriginalComponent } from "../MyComponent"; // Import from the component file

describe("MyComponent index", () => {
  it("should export MyComponent component", () => {
    expect(MyComponent).toBeDefined();
    // Additionally check if it's the correct component
    expect(MyComponent).toBe(OriginalComponent);
  });

  // If types are exported, a check can be added (though harder in Jest/Vitest)
  // it("should export MyComponentProps type", () => {
  //   // Runtime type checking is difficult,
  //   // but importing without errors is a partial check
  //   expect(typeof MyComponentProps).toBe('undefined'); // Placeholder
  // });
});
```

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

Examples of correct test naming:
- `renders when attempting reconnection`
- `does not render when reconnection is not required`
- `applies correct styles`
- `calls onSubmit when form is submitted`
- `displays spinner during loading`

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

### Adhering to `exhaustive-deps`

- Always include all dependencies used inside `useEffect`, `useCallback`, `useMemo` in the hook's dependency array.
- This helps avoid stale closures and ensures predictable behavior.
- Use the `eslint-plugin-react-hooks` linter to automatically check the `exhaustive-deps` rule.

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

6. **Cover all functions, including inline and anonymous ones**:
   - Coverage tools might not always correctly track anonymous functions defined directly in JSX (e.g., `<Component onClick={() => doSomething()} />`).
   - If a test doesn't cover such a function, extract it into `useCallback`:
     ```typescript
     const handleClick = useCallback(() => {
       doSomething();
     }, [/* dependencies */]);
     
     return <Component onClick={handleClick} />;
     ```
   - This creates a stable function reference that coverage tools and tests can reliably track.

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

### Testing Styled Components

When testing components that use Radix UI styling system:

1. **Don't test implementation details** of Radix UI's styling system
2. **Focus on testing component behavior** and user interactions
3. **Use data-testid attributes** for selecting elements instead of style-based selectors

```typescript
// CORRECT: testing behavior
it('displays the correct icon for the current theme', () => {
  render(
    <TestThemeProvider>
      <ThemeToggle />
    </TestThemeProvider>
  );
  
  expect(screen.getByTestId('theme-icon-light')).toBeInTheDocument();
});

// INCORRECT: testing Radix UI styles
it('applies Radix UI styles', () => {
  render(<ThemeToggle />);
  expect(screen.getByRole('button')).toHaveStyle({ 
    backgroundColor: 'var(--accent-9)' 
  });
});
```

### Best Practices for Radix UI Testing

1. **Mock Portals Appropriately**:
   - Use simple div elements instead of portals in tests
   - Add data-testid for easy element finding

2. **Handle Theme Changes**:
   - Test the component in different themes
   - Check for correct content display when the theme changes

3. **Test Accessibility**:
   - Check ARIA attributes
   - Test keyboard navigation

4. **Component Interaction**:
   - Test opening/closing dropdown menus
   - Check handling of click and hover events

5. **Handle Event Callbacks Carefully**:
   - Some Radix event handlers (e.g., `onOpenChange` on `Dialog.Root`) might pass arguments to the callback.
   - If you pass your function directly (e.g., `onOpenChange={myHandler}`), ensure it can accept these arguments or that they won't cause issues.
   - It's safer to use a wrapper (`onOpenChange={() => myHandler()}`) or extract the handler into `useCallback` if the arguments are not needed or should be ignored.

### Common Pitfalls

1. **Testing Radix UI internal implementation**:
   - Avoid testing the library's internal mechanisms
   - Focus on user interaction

2. **Difficulties with portals**:
   - Use mocks for portals
   - Wait for content rendering using waitFor

3. **Problems with themes**:
   - Always wrap components in ThemeProvider
   - Consider the possibility of automatic theme switching

## Testing Complex Component Compositions

When testing complex components divided into multiple subcomponents, a specific approach should be applied:

### Testing at Different Levels

1. **Testing the Root Component**:
   - Check only the overall behavior and integration of subcomponents
   - Mock subcomponents if necessary, avoiding testing their internal logic
   - Focus on verifying the correct passing of props

```typescript
// Mock subcomponents for testing the root component
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

it('passes correct props to subcomponents', async () => {
  render(<TorrentContent id={123} name="Test" onClose={mockClose} />);

  await waitFor(() => {
    const fileNode = screen.getByTestId('file-node-mock-file1.txt');
    expect(fileNode).toHaveAttribute('data-path', 'file1.txt');
  });

  // Check interaction between components
  fireEvent.click(fileNode);
  expect(mockSetFilesWanted).toHaveBeenCalled();
});
```

2. **Testing Subcomponents**:
   - Test subcomponents in isolation with various props
   - Check all possible states of the subcomponents
   - Focus on logic specific to the subcomponent

### Testing Custom Hooks

For components that extract logic into custom hooks (e.g., `useTorrentFiles`, `useDownloadDirectory`):

1. **Isolated Hook Testing**:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTorrentFiles } from '../hooks/useTorrentFiles';
import { GetTorrentFiles, SetFilesWanted } from '../../wailsjs/go/main/App';

// Mock external dependencies
vi.mock('../../wailsjs/go/main/App', () => ({
  GetTorrentFiles: vi.fn(),
  SetFilesWanted: vi.fn()
}));

describe('useTorrentFiles hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads files on mount', async () => {
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

  it('toggles file selection', async () => {
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

2. **Testing Hook Integration with Components**:
   - Check component updates when data in the hook changes
   - Test edge cases and error handling

### Testing API Interactions

For components working with external APIs:

```typescript
it('correctly handles API errors', async () => {
  vi.mocked(GetTorrentFiles).mockRejectedValue(new Error('API error'));

  render(<TorrentContent id={123} name="Test" onClose={mockClose} />);

  await waitFor(() => {
    expect(screen.getByTestId('files-error')).toBeInTheDocument();
    expect(screen.getByTestId('files-error')).toHaveTextContent('errors.failedToLoadFiles');
  });
});
```

### Specifics of Testing Complex Interactions

1. **Checking the Effects of UI Actions on Data**:
```typescript
it('updates selection state when toggling files', async () => {
  // Set up initial state
  vi.mocked(GetTorrentFiles).mockResolvedValue([
    { ID: 1, Path: 'file1.txt', Size: 100, Progress: 50, Wanted: true },
    { ID: 2, Path: 'file2.txt', Size: 100, Progress: 50, Wanted: true }
  ]);

  render(<TorrentContent id={123} name="Test" onClose={mockClose} />);

  // Wait for files to load
  await waitFor(() => {
    expect(screen.getByTestId('file-node-file1.txt')).toBeInTheDocument();
  });

  // Simulate toggling selection of all files
  const toggleAll = screen.getByTestId('toggle-all-checkbox');
  fireEvent.click(toggleAll);

  // Check API call for deselecting
  expect(SetFilesWanted).toHaveBeenCalledWith(123, [1, 2], false);
});
```

2. **Testing Data Synchronization Between Components**:
   - Check that changes in one component are reflected in others
   - Test the use of shared data via context or props

## Testing Loading States and Error Handling

### 1. Loading States

1. **Initial Loading State**:
   ```typescript
   it('displays spinner on initial load', () => {
     render(<Component />);
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
   });
   ```

2. **Transition Between States**:
   ```typescript
   it('hides spinner after data loads', async () => {
     render(<Component />);

     // Check for spinner
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Wait for loading to complete
     await waitFor(() => {
       expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
     });
   });
   ```

3. **Multiple Loads**:
   ```typescript
   it('correctly handles parallel loads', async () => {
     render(<Component />);

     // Start multiple loads
     fireEvent.click(screen.getByTestId('load-item-1'));
     fireEvent.click(screen.getByTestId('load-item-2'));

     // Check spinner
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Wait for all loads to complete
     await waitFor(() => {
       expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
     });
   });
   ```

### 2. Error Handling

1. **Displaying Errors**:
   ```typescript
   it('displays error message on failed load', async () => {
     // Mock error
     vi.mocked(loadData).mockRejectedValue(new Error('Test error'));

     render(<Component />);

     await waitFor(() => {
       expect(screen.getByTestId('error-display'))
         .toHaveTextContent('Test error');
     });
   });
   ```

2. **Retries**:
   ```typescript
   it('allows retrying load after error', async () => {
     // First error, then success
     vi.mocked(loadData)
       .mockRejectedValueOnce(new Error('Error'))
       .mockResolvedValueOnce({ data: 'success' });

     render(<Component />);

     // Wait for error to appear
     await waitFor(() => {
       expect(screen.getByTestId('error-display')).toBeInTheDocument();
     });

     // Click retry button
     fireEvent.click(screen.getByTestId('error-retry-button'));

     // Check for successful load
     await waitFor(() => {
       expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
       expect(screen.getByText('success')).toBeInTheDocument();
     });
   });
   ```

### 3. State Combinations

1. **Transitions Between States**:
   ```typescript
   it('correctly switches between states', async () => {
     render(<Component />);

     // Initial load
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Successful load
     await waitFor(() => {
       expect(screen.getByTestId('content')).toBeInTheDocument();
     });

     // Start new load
     fireEvent.click(screen.getByTestId('refresh-button'));
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Error on update
     await waitFor(() => {
       expect(screen.getByTestId('error-display')).toBeInTheDocument();
     });
   });
   ```

2. **Recovery After Errors**:
   ```typescript
   it('restores previous state after error', async () => {
     const initialData = { value: 'initial' };
     const mockLoad = vi.mocked(loadData)
       .mockResolvedValueOnce(initialData)
       .mockRejectedValueOnce(new Error('Update error'));

     const { rerender } = render(<Component />);

     // Wait for initial load
     await waitFor(() => {
       expect(screen.getByText('initial')).toBeInTheDocument();
     });

     // Try to update with error
     fireEvent.click(screen.getByTestId('refresh-button'));

     await waitFor(() => {
       // Check for error
       expect(screen.getByTestId('error-display')).toBeInTheDocument();
       // Check that old data is still displayed
       expect(screen.getByText('initial')).toBeInTheDocument();
     });
   });
   ```

### 4. Canceling Loads

1. **Cancel on Unmount**:
   ```typescript
   it('cancels load on unmount', async () => {
     const mockAbort = vi.fn();
     const mockController = new AbortController();
     mockController.abort = mockAbort;
     vi.mocked(window.AbortController).mockImplementation(() => mockController);

     const { unmount } = render(<Component />);

     // Unmount component during load
     unmount();

     expect(mockAbort).toHaveBeenCalled();
   });
   ```

2. **User Cancellation**:
   ```typescript
   it('allows user to cancel load', async () => {
     render(<Component />);

     // Start load
     fireEvent.click(screen.getByTestId('start-load-button'));

     // Cancel load
     fireEvent.click(screen.getByTestId('cancel-button'));

     await waitFor(() => {
       // Check that load is canceled
       expect(screen.queryByTestId('loading-spinner'))
         .not.toBeInTheDocument();
       // Check cancellation message
       expect(screen.getByText('Load canceled'))
         .toBeInTheDocument();
     });
   });
   ```

### 5. Testing Timeouts

1. **Handling Timeouts**:
   ```typescript
   it('handles load timeout', async () => {
     // Mock load function that never resolves
     vi.mocked(loadData).mockImplementation(() => new Promise(() => {}));

     render(<Component timeout={1000} />);

     // Wait for timeout message
     await waitFor(() => {
       expect(screen.getByText('Request timed out'))
         .toBeInTheDocument();
     }, { timeout: 2000 });
   });
   ```

2. **Automatic Retries**:
   ```typescript
   it('automatically retries after timeout', async () => {
     // First request - timeout, second - success
     vi.mocked(loadData)
       .mockImplementationOnce(() => new Promise(() => {}))
       .mockResolvedValueOnce({ data: 'success' });

     render(<Component timeout={1000} retryCount={1} />);

     // Wait for successful load after retry
     await waitFor(() => {
       expect(screen.getByText('success')).toBeInTheDocument();
     }, { timeout: 3000 });

     // Check number of attempts
     expect(loadData).toHaveBeenCalledTimes(2);
   });
   ```

### 6. Testing Progress Indicators

1. **Load Progress**:
   ```typescript
   it('displays load progress', async () => {
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

2. **Status Indicators**:
   ```typescript
   it('correctly displays status indicators', async () => {
     render(<Component />);

     // Check initial state
     expect(screen.getByTestId('status-indicator'))
       .toHaveAttribute('data-status', 'idle');

     // Start load
     fireEvent.click(screen.getByTestId('start-button'));
     expect(screen.getByTestId('status-indicator'))
       .toHaveAttribute('data-status', 'loading');

     // Wait for completion
     await waitFor(() => {
       expect(screen.getByTestId('status-indicator'))
         .toHaveAttribute('data-status', 'success');
     });
   });
   ```

### 7. Recommendations

1. **Always test**:
   - Initial loading state
   - Successful load completion
   - Error handling
   - Retry capability
   - Load cancellation
   - Recovery after errors

2. **Use correct assertions**:
   ```typescript
   // ❌ Bad: unstable test
   await new Promise(resolve => setTimeout(resolve, 1000));
   expect(screen.getByTestId('content')).toBeInTheDocument();

   // ✅ Good: wait for state change
   await waitFor(() => {
     expect(screen.getByTestId('content')).toBeInTheDocument();
   });
   ```

3. **Test edge cases**:
   - Multiple parallel loads
   - Cancellation during load
   - Reloading when an error exists
   - Timeouts and network issues

4. **Simulate real scenarios**:
   - Slow connection
   - Loss of connection
   - Partial data loading
   - Unexpected response formats

5. **Keep tests clean**:
   - Reset mocks between tests
   - Clear timers
   - Restore initial state
   - Isolate tests from each other

## State Management in Tests

### 1. Preparing Initial State

1. **Using Data Factories**:
   ```typescript
   // test/factories/torrent.ts
   export const createTorrent = (override = {}) => ({
     id: 1,
     name: "test.torrent",
     progress: 0,
     status: "stopped",
     ...override
   });

   // In tests:
   it('displays torrent progress', () => {
     const torrent = createTorrent({ progress: 50 });
     render(<TorrentItem torrent={torrent} />);
     expect(screen.getByTestId('progress-bar')).toHaveAttribute('value', '50');
   });
   ```

2. **Mocking Global State**:
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

### 2. Testing Side Effects

1. **Checking Effect Calls**:
   ```typescript
   it('updates data when ID changes', () => {
     const loadData = vi.fn();
     const { rerender } = render(
       <Component id={1} onLoad={loadData} />
     );

     // Check initial load
     expect(loadData).toHaveBeenCalledWith(1);

     // Change props
     rerender(<Component id={2} onLoad={loadData} />);

     // Check recall with new ID
     expect(loadData).toHaveBeenCalledWith(2);
   });
   ```

2. **Testing Effect Cleanup**:
   ```typescript
   it('unsubscribes from events on unmount', () => {
     const unsubscribe = vi.fn();
     vi.mocked(subscribeToEvents).mockReturnValue(unsubscribe);

     const { unmount } = render(<Component />);
     unmount();

     expect(unsubscribe).toHaveBeenCalled();
   });
   ```

### 3. Testing State Changes

1. **Checking UI Updates**:
   ```typescript
   it('updates UI when data changes', async () => {
     const { rerender } = render(
       <TorrentList torrents={[createTorrent({ progress: 0 })]} />
     );

     // Check initial state
     expect(screen.getByTestId('progress-0')).toBeInTheDocument();

     // Update props
     rerender(
       <TorrentList torrents={[createTorrent({ progress: 50 })]} />
     );

     // Check UI update
     await waitFor(() => {
       expect(screen.getByTestId('progress-50')).toBeInTheDocument();
     });
   });
   ```

2. **Testing Conditional Rendering**:
   ```typescript
   it('shows different components depending on state', () => {
     const { rerender } = render(
       <StatusDisplay status="loading" />
     );

     // Check loading state
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

     // Change state
     rerender(<StatusDisplay status="error" />);

     // Check error display
     expect(screen.getByTestId('error-message')).toBeInTheDocument();
   });
   ```

### 4. Working with Asynchronous State

1. **Testing Intermediate States**:
   ```typescript
   it('displays all loading stages', async () => {
     render(<DataLoader />);

     // Initial state
     expect(screen.getByTestId('initial-state')).toBeInTheDocument();

     // Loading state
     fireEvent.click(screen.getByText('Load'));
     expect(screen.getByTestId('loading-state')).toBeInTheDocument();

     // Final state
     await waitFor(() => {
       expect(screen.getByTestId('loaded-state')).toBeInTheDocument();
     });
   });
   ```

2. **Handling Race Conditions**:
   ```typescript
   it('handles race conditions correctly', async () => {
     // Create a Promise that resolves later
     const slowData = new Promise(resolve =>
       setTimeout(() => resolve('slow'), 100)
     );

     // Create a Promise that resolves earlier
     const fastData = Promise.resolve('fast');

     // First request (slow)
     vi.mocked(loadData).mockResolvedValueOnce(slowData);

     const { rerender } = render(<Component id={1} />);

     // Second request (fast)
     vi.mocked(loadData).mockResolvedValueOnce(fastData);
     rerender(<Component id={2} />);

     // Check that data from the last request is displayed
     await waitFor(() => {
       expect(screen.getByText('fast')).toBeInTheDocument();
     });
   });
   ```

### 5. Testing Caching

1. **Checking Caching Mechanism**:
   ```typescript
   it('uses cached data on subsequent renders', async () => {
     const loadData = vi.fn().mockResolvedValue({ data: 'test' });

     const { rerender } = render(
       <CachedComponent id={1} loadData={loadData} />
     );

     // Wait for first load
     await waitFor(() => {
       expect(screen.getByText('test')).toBeInTheDocument();
     });

     // Rerender with same props
     rerender(<CachedComponent id={1} loadData={loadData} />);

     // Check that no reload occurred
     expect(loadData).toHaveBeenCalledTimes(1);
   });
   ```

2. **Testing Cache Invalidation**:
   ```typescript
   it('invalidates cache when necessary', async () => {
     const loadData = vi.fn()
       .mockResolvedValueOnce({ data: 'old' })
       .mockResolvedValueOnce({ data: 'new' });

     const { rerender } = render(
       <CachedComponent id={1} version={1} loadData={loadData} />
     );

     // Wait for first load
     await waitFor(() => {
       expect(screen.getByText('old')).toBeInTheDocument();
     });

     // Change version to invalidate cache
     rerender(<CachedComponent id={1} version={2} loadData={loadData} />);

     // Check data reload
     await waitFor(() => {
       expect(screen.getByText('new')).toBeInTheDocument();
     });
     expect(loadData).toHaveBeenCalledTimes(2);
   });
   ```

### 6. Testing Performance Optimizations

1. **Checking Memoization**:
   ```typescript
   it('does not rerender optimized components', () => {
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

     // First render
     expect(renderSpy).toHaveBeenCalledTimes(1);

     // Updating parent should not cause child rerender
     rerender(
       <Parent>
         <OptimizedChild />
       </Parent>
     );

     expect(renderSpy).toHaveBeenCalledTimes(1);
   });
   ```

2. **Testing useMemo and useCallback**:
   ```typescript
   it('preserves references to memoized values', () => {
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

     // Trigger update
     fireEvent.click(screen.getByText('Update'));

     // Check that references remained the same
     expect(results[0].value).toBe(results[1].value);
     expect(results[0].callback).toBe(results[1].callback);
   });
   ```

### 7. Recommendations

1. **Isolate State Tests**:
   ```typescript
   describe('Component State', () => {
     beforeEach(() => {
       // Reset state before each test
       vi.clearAllMocks();
     });

     it('tests one state change', () => {
       // One test - one change
     });
   });
   ```

2. **Use State Snapshots**:
   ```typescript
   it('correctly updates state', () => {
     const states: any[] = [];
     const TestComponent = () => {
       const state = useMyState();
       states.push({ ...state });
       return null;
     };

     render(<TestComponent />);

     // Check all states
     expect(states).toMatchSnapshot();
   });
   ```

3. **Test Edge Cases**:
   ```typescript
   it('handles invalid states', () => {
     // Check null
     render(<Component state={null} />);
     expect(screen.getByText('No data')).toBeInTheDocument();

     // Check empty object
     render(<Component state={{}} />);
     expect(screen.getByText('Invalid data')).toBeInTheDocument();

     // Check invalid data
     render(<Component state={{ invalid: true }} />);
     expect(screen.getByText('Data error')).toBeInTheDocument();
   });
   ```
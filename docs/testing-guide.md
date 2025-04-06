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

Examples:
- `it('renders with default props')`
- `it('displays error message when status is error')`
- `it('calls onSubmit when form is submitted')`

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
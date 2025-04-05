# Frontend Testing Guide

This guide describes the principles and practices for testing frontend components in the Transmission Client project. Following these rules will help maintain high code quality and simplify collaboration.

## Contents

- [Technology Stack](#technology-stack)
- [Test Structure](#test-structure)
- [Coverage Requirements](#coverage-requirements)
- [Mocks and Stubs](#mocks-and-stubs)
- [Test Naming](#test-naming)
- [Selectors in Tests](#selectors-in-tests)
- [Style Testing](#style-testing)
- [Running Tests](#running-tests)
- [Common Issues and Solutions](#common-issues-and-solutions)

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
```
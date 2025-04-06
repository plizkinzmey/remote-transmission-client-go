## Testing Components with Portals

When testing components that use portals (like modals, dialogs, or tooltips), some special considerations are needed since the portal content is rendered outside the regular DOM hierarchy. Here's how to properly test these components:

### Finding Elements in Portals

Since portal content is rendered at a different DOM location, you need to use document-level queries:

```typescript
// Incorrect - won't find elements in portals
const element = screen.getByTestId('modal-content');

// Correct - will find elements anywhere in the document
const element = document.querySelector('[data-testid="modal-content"]');

// Alternative using within()
const element = within(document.body).getByTestId('modal-content');
```

### Mocking Portal Components

For components like Radix UI that use portals internally, you can mock them to simplify testing:

```typescript
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
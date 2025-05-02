# Transmission Client Development Guidelines

This document outlines the key guidelines, principles and best practices for developing and maintaining the Transmission Client project. Following these guidelines ensures consistent code quality, reduces common errors, and helps maintain the architectural integrity of the application.

## Core Development Principles

1. **Clean Architecture Adherence**
   - Strictly maintain separation between layers (domain, application, infrastructure, UI)
   - Dependencies always point inward (UI → Application → Domain)
   - Domain layer must remain free of external dependencies

2. **Error Handling**
   - Define errors as variables (`var ErrSomething = errors.New("description")`) instead of string constants
   - Use `errors.Is()` and `errors.As()` for error checking rather than string comparison
   - Wrap errors with context when passing them up the call stack (`fmt.Errorf("context: %w", err)`)
   - Return meaningful, actionable error messages

3. **Configuration Management**
   - Always check if configuration is initialized before using it
   - Provide sensible defaults for optional configuration values
   - Validate configuration values early
   - Use strong typing for configuration objects

4. **Code Organization**
   - Keep files focused on a single responsibility
   - Group related functionality into packages
   - Follow Go and React naming conventions consistently
   - Use meaningful, descriptive names for functions, variables, and types

5. **State Management**
   - Minimize global state
   - Use dependency injection to manage dependencies
   - Make state changes explicit and traceable
   - Consider immutability patterns where appropriate

## Go Specific Guidelines

### Error Handling

```go
// ❌ Avoid: Using string constants for errors
const ErrMessageNotFound = "message not found"

// ...
if err != nil {
    return errors.New(ErrMessageNotFound) // Creates new error instances each time
}

// ✅ Do: Define errors as variables
var ErrMessageNotFound = errors.New("message not found")

// ...
if err != nil {
    return ErrMessageNotFound // Returns the same error instance
}

// ✅ Even Better: Wrap errors with context
if err != nil {
    return fmt.Errorf("failed to process message %s: %w", msgID, ErrMessageNotFound)
}
```

### Function Design

```go
// ❌ Avoid: Mixed responsibilities
func ProcessAndSaveTorrent(t *domain.Torrent) error {
    // Process torrent
    // Save to database
    // Update UI state
}

// ✅ Do: Single responsibility
func ProcessTorrent(t *domain.Torrent) (*domain.ProcessedTorrent, error) {
    // Only process torrent
}

func SaveTorrent(t *domain.ProcessedTorrent) error {
    // Only save torrent
}
```

### Dependency Management

```go
// ❌ Avoid: Direct instantiation of dependencies
func NewTorrentService() *TorrentService {
    repo := transmission.NewTransmissionClient() // Hard-coded dependency
    return &TorrentService{repo: repo}
}

// ✅ Do: Dependency injection
func NewTorrentService(repo domain.TorrentRepository) *TorrentService {
    return &TorrentService{repo: repo}
}
```

## React/TypeScript Specific Guidelines

### Component Structure

```tsx
// ❌ Avoid: Mixing logic and UI
function TorrentList() {
    const [torrents, setTorrents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Complex fetch logic
    // Complex data transformations
    // Complex error handling
    
    return (
        <div>
            {/* UI rendering */}
        </div>
    );
}

// ✅ Do: Separate logic with custom hooks
function useTorrents() {
    const [torrents, setTorrents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // All the complex logic
    
    return { torrents, loading, error };
}

function TorrentList() {
    const { torrents, loading, error } = useTorrents();
    
    // Only UI rendering logic
    return (
        <div>
            {/* UI rendering */}
        </div>
    );
}
```

### Error Handling in React

```tsx
// ❌ Avoid: Inconsistent error handling
function Component1() {
    // Error handling approach 1
}

function Component2() {
    // Different error handling approach
}

// ✅ Do: Use consistent error handling hooks
function Component1() {
    const { error, setError, clearError } = useError();
    // Consistent error handling approach
}

function Component2() {
    const { error, setError, clearError } = useError();
    // Same error handling approach
}
```

### Type Safety

```tsx
// ❌ Avoid: Loose typing
const handleSubmit = async (e) => {
    // Implicitly returns Promise<void> or Promise<boolean>
    const isValid = await validatePath(path);
    if (!isValid) return;
    await savePath(path);
    return true;
};

// ✅ Do: Explicit typing
const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    const isValid = await validatePath(path);
    if (!isValid) return false;
    await savePath(path);
    return true;
};
```

## Testing Guidelines

Refer to the comprehensive testing guides:
- [Go Testing Best Practices](./go-testing-best-practices.md)
- [Frontend Testing Guide](./testing-guide.md)

## Refactoring Guidelines

Refer to the refactoring guides:
- [Component Refactoring Guide](./refactoring-guide.md)

## Common Pitfalls and Solutions

### 1. Configuration Not Initialized

**Problem**: Using configuration before it's initialized leads to nil pointer dereferences.

**Solution**: 
- Always check if configuration is initialized (`if config == nil { return ErrConfigNotInited }`)
- Use initialization patterns (e.g., singleton or factory) to ensure configuration is set up before use
- Consider using a `MustInit()` pattern for critical components

### 2. Inconsistent Error Handling

**Problem**: Different parts of the code handle errors differently, making it hard to debug and maintain.

**Solution**:
- Define standardized error types for common errors
- Use consistent error wrapping patterns
- Implement centralized error handling at boundaries between layers
- Log errors with appropriate context at the correct level

### 3. Race Conditions in State Management

**Problem**: Concurrent access to shared state leads to race conditions and unpredictable behavior.

**Solution**:
- Use mutex locks for shared state in Go
- Leverage React's state management to avoid direct state manipulation
- Consider immutable data patterns
- Use atomic operations where appropriate

### 4. Callback Dependencies in React

**Problem**: Missing dependencies in useEffect and useCallback lead to stale closures.

**Solution**:
- Always verify the dependency arrays in React hooks
- Use ESLint's exhaustive-deps rule
- Consider using useReducer for complex state logic
- Use callback ref pattern for DOM references

## Continuous Integration Practices

1. **Automated Testing**
   - All tests must pass before merging
   - Maintain code coverage above agreed thresholds
   - Include both unit and integration tests

2. **Code Quality Checks**
   - Run linters and formatters (golangci-lint, ESLint, Prettier)
   - Enforce consistent code style
   - Check for common anti-patterns

3. **Pull Request Workflow**
   - Require code reviews before merging
   - Keep PRs focused on a single concern
   - Include relevant tests with code changes
   - Update documentation along with code changes

## Documentation Standards

1. **Code Documentation**
   - Document all exported functions, types, and methods
   - Include examples for complex or non-obvious usage
   - Comment non-obvious implementation details

2. **Architecture Documentation**
   - Keep high-level architecture diagrams up-to-date
   - Document key design decisions and trade-offs
   - Maintain clear descriptions of component interactions

3. **User Documentation**
   - Update user guides when adding or changing features
   - Include screenshots or diagrams for visual clarity
   - Provide troubleshooting guides for common issues

## Conclusion

Following these guidelines will help maintain code quality, improve maintainability, and reduce the likelihood of common errors in the Transmission Client project. Regular reviews of these guidelines are encouraged to keep them relevant as the project evolves.
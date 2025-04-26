# Component Refactoring Guide

## Refactoring Principles

1. **Directory Structure**
   - Each component should reside in its own directory.
   - The directory name should match the component name.
   - Component directory structure:
     ```
     ComponentName/
     ├── __tests__/             # Directory for tests
     │   ├── ComponentName.test.tsx # Tests for the main component
     │   └── index.test.tsx       # Tests for index.ts
     ├── ComponentName.tsx      # Main component file
     ├── ComponentName.module.css # Component's CSS module
     ├── index.ts               # File for re-exporting the component and types
     ├── README.md              # Component documentation (English)
     └── README.ru.md           # Component documentation (Russian)
     ```

2. **Component Documentation (README.md & README.ru.md)**
   - Brief description of the component and its purpose
   - Usage examples
   - Description of props and their types
   - Implementation details and important notes
   - Component dependencies
   - Code examples
   - **Maintain documentation in both English (`README.md`) and Russian (`README.ru.md`).**

3. **Styles**
   - Each component should have its own CSS module
   - Styles should be local to the component
   - Class names should be semantic
   - Global styles should be minimized

4. **Testing**
   - Tests should be located in the `__tests__` folder
   - Test descriptions should be in English
   - Minimum coverage required:
     - Lines: 70%
     - Functions: 70%
     - Branches: 70%
     - Statements: 70%
   - Use data-testid for key elements
   - **Refer to `testing-guide.md` for detailed frontend testing practices.**
   - **Refer to `go-testing-best-practices.md` for Go testing practices.**

## Component Refactoring Plan

1. **Preparation**
   ```bash
   # Create directory structure
   mkdir -p src/components/ComponentName/__tests__
   # Create hooks directory if logic extraction is anticipated
   # mkdir -p src/components/ComponentName/hooks
   ```

2. **File Migration**
   - Move the component file (`ComponentName.tsx`) to `src/components/ComponentName/`.
   - Create `index.ts` to export the component and its types in `src/components/ComponentName/`.
   - Move or create the style file (`ComponentName.module.css`) in `src/components/ComponentName/`.
   - Move or create the main test file (`ComponentName.test.tsx`) to `src/components/ComponentName/__tests__/`.
   - Create the test file for `index.ts` (`index.test.tsx`) in `src/components/ComponentName/__tests__/`.
   - Create the `README.md` file in `src/components/ComponentName/`.
   - **Create the `README.ru.md` file in `src/components/ComponentName/`.**

3. **Component Refactoring**
   - Add JSDoc documentation
   - Define and type props
   - Add data-testid attributes
   - Update imports
   - **Check `useEffect` dependencies against the `exhaustive-deps` rule (see `testing-guide.md`).**
   - **Consider extracting complex logic into custom hooks (see "Decomposing Complex Components" section).**

4. **Style Refactoring**
   - Move styles to the .module.css file
   - Use CSS modules
   - Update style imports in the component

5. **Writing Tests**
   - Create main test cases for `ComponentName.test.tsx`.
   - Create a test to check re-exports in `index.test.tsx`.
   - Ensure mocks are working.
   - Check code coverage (including `index.ts`).
   - **Follow practices outlined in `testing-guide.md`.**

6. **Import Verification**
   - Update all imports in other files
   - Check for cyclic dependencies
   - Update index files

7. **Documentation**
   - Fill `README.md` (English).
   - Fill `README.ru.md` (Russian).

## Example index.ts
```typescript
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## Example Component Structure
```typescript
/**
 * @description Component description
 * @param {ComponentNameProps} props - Component props
 */
export interface ComponentNameProps {
  /** Prop description */
  prop1: string;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ prop1 }) => {
  // ... component logic ...

  // Example useEffect check
  // useEffect(() => {
  //   console.log(prop1);
  // }, [prop1]); // Ensure prop1 is in dependency array if used

  return (
    <div
      className={styles.container}
      data-testid="component-container"
    >
      {prop1}
    </div>
  );
};
```

## Example Test
```typescript
describe('ComponentName', () => {
  it('renders correctly with provided props', () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByTestId('component-container')).toBeInTheDocument();
  });
});
```

## Working with Radix UI Components

When refactoring components using Radix UI, follow these guidelines:

### Theme Integration

1. **Use Radix UI's built-in theme system**:
   ```tsx
   // ThemeProvider.tsx
   <RadixTheme
     appearance={currentTheme === "light" ? "light" : "dark"}
     scaling="100%"
     data-theme={currentTheme}
   >
     {children}
   </RadixTheme>
   ```

2. **Avoid style duplication**:
   - Do not override Radix UI's base colors and themes
   - Use Radix UI's CSS variables instead of custom ones
   - Limit CSS modules to animations and positioning

3. **Proper Style Structure**:
   ```css
   /* ✅ Correct: only specific styles */
   .container {
     position: relative;
   }

   .toggleButton {
     transition: all 0.2s ease;
   }

   /* ❌ Incorrect: duplicating Radix UI themes */
   .menuItem {
     color: var(--custom-text-color);
     background: var(--custom-bg-color);
   }
   ```

### Components and Accessibility

1. **Use built-in components correctly**:
   ```tsx
   // ✅ Correct: use built-in components
   <DropdownMenu.Item>
     <Flex gap="2" align="center">
       <Icon />
       <Text>Label</Text>
     </Flex>
   </DropdownMenu.Item>

   // ❌ Incorrect: implement the same manually
   <div role="menuitem" onClick={handler}>
     <div style={{ display: 'flex', gap: '8px' }}>
       <Icon />
       <span>Label</span>
     </div>
   </div>
   ```

2. **ARIA Attributes**:
   - Use Radix UI's built-in ARIA attributes
   - Add additional attributes only when necessary

### Component Organization

1. **File Structure**:
   ```
   ComponentName/
   ├── index.ts
   ├── ComponentName.tsx
   ├── ComponentName.module.css
   ├── README.md
   └── README.ru.md
   └── __tests__/
       └── ComponentName.test.tsx
   ```

2. **Component Documentation**:
   ```md
   # ComponentName

   ## Features
   - Integration with Radix UI's theme system
   - Support for dark/light/auto modes
   - Accessibility via ARIA

   ## Dependencies
   - @radix-ui/themes
   - Other dependencies...

   ## API
   Description of props and usage examples...
   ```

### Performance

1. **Callback Memoization**:
   ```tsx
   const handleThemeChange = useCallback((theme: ThemeType) => {
     setTheme(theme);
   }, [setTheme]);
   ```

2. **Conditional Rendering**:
   ```tsx
   // ✅ Correct: minimal re-renders
   <DropdownMenu.Root open={isOpen}>
     <DropdownMenu.Trigger />
     {isOpen && <DropdownMenu.Content />}
   </DropdownMenu.Root>
   ```

### Testing

1. **Component Mocks**:
   ```tsx
   vi.mock('@radix-ui/themes', () => ({
     DropdownMenu: {
       Root: ({ children }) => <div>{children}</div>,
       // ...other parts
     },
     // ...other components
   }));
   ```

2. **Theme Testing**:
   ```tsx
   it('applies the correct theme', () => {
     render(
       <ThemeProvider theme="dark">
         <Component />
       </ThemeProvider>
     );
     // Test behavior, not styles
   });
   ```

### Common Mistakes

1. **❌ Overriding the theme system**:
   - Do not create your own theme system
   - Use Radix UI's built-in themes
   - Extend only when absolutely necessary

2. **❌ Ignoring accessibility**:
   - Do not remove ARIA attributes
   - Do not change the semantic structure of components
   - Maintain keyboard navigation support

3. **❌ Incorrect state handling**:
   - Do not alter the base behavior of components
   - Maintain consistency with other components
   - Support all standard states (hover, focus, active)

## Decomposing Complex Components

When working with complex components that perform multiple functions, follow this approach:

### 1. Analysis and Planning

1. **Define Responsibilities**:
   - Identify key functional blocks
   - Determine UI components that can be extracted
   - Identify logic that can be isolated into hooks

2. **Migration Plan**:
   ```
   ComponentName/
   ├── index.ts                    # Public API of the component
   ├── ComponentName.tsx           # Main component
   ├── ComponentName.module.css    # Styles for the main component
   ├── hooks/                      # Isolated business logic
   │   ├── useComponentData.ts     # Data handling
   │   └── useComponentState.ts    # State management
   ├── components/                 # Subcomponents
   │   ├── SubComponent1/
   │   └── SubComponent2/
   ├── README.md                  # Documentation
   ├── README.ru.md               # Documentation (Russian)
   └── __tests__/                 # Tests for all parts
   ```

### 2. Extracting Business Logic into Hooks

1. **Criteria for Hook Extraction**:
   ```typescript
   // ❌ Before: Logic mixed with rendering
   const Component = () => {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);
     
     useEffect(() => {
       const loadData = async () => {
         setLoading(true);
         try {
           const result = await fetchData();
           setData(result);
         } catch (err) {
           setError(err);
         } finally {
           setLoading(false);
         }
       };
       loadData();
     }, []);
     
     // More logic...
   };

   // ✅ After: Logic in a separate hook
   const useComponentData = () => {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);
     
     useEffect(() => {
       const loadData = async () => {
         setLoading(true);
         try {
           const result = await fetchData();
           setData(result);
         } catch (err) {
           setError(err);
         } finally {
           setLoading(false);
         }
       };
       loadData();
     }, []);
     
     return { data, loading, error };
   };

   const Component = () => {
     const { data, loading, error } = useComponentData();
     // Only rendering logic...
   };
   ```

2. **Hook Extraction Rules**:
   - One hook = one responsibility
   - Hook should be reusable
   - Error handling should be encapsulated
   - Method names should reflect business logic

### 3. Creating Subcomponents

1. **Criteria for Subcomponent Extraction**:
   - Code reuse
   - Complex internal logic
   - Independent UI block
   - Large code size (over 100-150 lines)

2. **Subcomponent Structure**:
   ```typescript
   // SubComponent1/SubComponent1.tsx
   export interface SubComponent1Props {
     /** Data for rendering */
     data: ComponentData;
     /** Change handler */
     onChange: (data: ComponentData) => void;
   }

   export const SubComponent1: React.FC<SubComponent1Props> = ({
     data,
     onChange
   }) => {
     // Local logic of the subcomponent...
     return (
       <div data-testid="sub-component-1">
         {/* Rendering... */}
       </div>
     );
   };
   ```

### 4. Maintaining Backward Compatibility

1. **Preserving Public API**:
   ```typescript
   // index.ts
   export { ComponentName } from './ComponentName';
   export type { ComponentNameProps } from './ComponentName';
   
   // Do not export internal components and hooks
   // export { SubComponent1 } from './components/SubComponent1';
   ```

2. **Gradual Migration**:
   ```typescript
   // Step 1: Create new structure
   // Step 2: Move code in parts
   // Step 3: Test each change
   // Step 4: Remove old code
   ```

### 5. State Management

1. **State Distribution Rules**:
   ```typescript
   // ✅ State in the parent component
   const ParentComponent = () => {
     const [sharedState, setSharedState] = useState();
     return (
       <>
         <SubComponent1 
           state={sharedState}
           onChange={setSharedState}
         />
         <SubComponent2
           state={sharedState}
         />
       </>
     );
   };

   // ✅ Local state in the subcomponent
   const SubComponent = () => {
     const [localState, setLocalState] = useState();
     return (/* use localState */);
   };
   ```

2. **Using Context**:
   ```typescript
   // For shared data between components
   const ComponentContext = createContext<ComponentContextType | null>(null);

   export const useComponentContext = () => {
     const context = useContext(ComponentContext);
     if (!context) {
       throw new Error('useComponentContext must be used within ComponentProvider');
     }
     return context;
   };
   ```

### 6. Organizing Tests

1. **Test Structure**:
   ```
   __tests__/
   ├── ComponentName.test.tsx      # Tests for the main component
   ├── hooks/                      # Tests for hooks
   │   ├── useComponentData.test.ts
   │   └── useComponentState.test.ts
   └── components/                 # Tests for subcomponents
       ├── SubComponent1.test.tsx
       └── SubComponent2.test.tsx
   ```

2. **Integration Testing**:
   ```typescript
   describe('component integration', () => {
     it('correctly passes data between components', async () => {
       render(<ComponentName />);
       
       // Action in one component
       fireEvent.click(screen.getByTestId('sub1-button'));
       
       // Check effect in another component
       await waitFor(() => {
         expect(screen.getByTestId('sub2-content'))
           .toHaveTextContent('updated data');
       });
     });
   });
   ```

### 7. Refactoring Documentation

In the component's README.md, add:

```markdown
## Architecture

### Components
- ComponentName - main component
  - SubComponent1 - subcomponent for ...
  - SubComponent2 - subcomponent for ...

### Hooks
- useComponentData - data loading and management
- useComponentState - UI state management

### Data Flows
1. Data loading via useComponentData
2. Processing in the main component
3. Distribution to subcomponents

### Component Interaction
- Component interaction diagram
- Description of data passing
- Event handling
```

### 8. Decomposition Results Verification

- [ ] Each component has a clear responsibility
- [ ] Business logic is isolated in hooks
- - [ ] Subcomponents are independent and reusable
- [ ] Tests cover both individual parts and their interaction
- [ ] Documentation reflects the new structure
- [ ] Public API of the component is preserved
- [ ] Code maintainability is improved

## Error Handling and Loading States

When refactoring components, pay special attention to error handling and loading state management.

### 1. Consistent Error Handling

1. **Defining Error Types**:
   ```typescript
   type ApiError = {
     code: string;
     message: string;
     details?: Record<string, unknown>;
   };

   // In the component:
   const [error, setError] = useState<ApiError | null>(null);
   ```

2. **Error Display Component**:
   ```typescript
   interface ErrorDisplayProps {
     error: ApiError | null;
     onRetry?: () => void;
     className?: string;
   }

   export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
     error,
     onRetry,
     className
   }) => {
     if (!error) return null;

     return (
       <div 
         className={cn(styles.errorContainer, className)}
         data-testid="error-display"
       >
         <Text color="red" size="2">
           {error.message}
         </Text>
         {onRetry && (
           <Button 
             size="1" 
             variant="soft" 
             onClick={onRetry}
             data-testid="error-retry-button"
           >
             Retry
           </Button>
         )}
       </div>
     );
   };
   ```

3. **Error Handling Hook**:
   ```typescript
   interface ErrorState {
     error: ApiError | null;
     setError: (error: ApiError | null) => void;
     clearError: () => void;
     hasError: boolean;
   }

   const useError = (): ErrorState => {
     const [error, setError] = useState<ApiError | null>(null);

     const clearError = useCallback(() => {
       setError(null);
     }, []);

     return {
       error,
       setError,
       clearError,
       hasError: error !== null
     };
   };
   ```

### 2. Managing Loading States

1. **Loading State Hook**:
   ```typescript
   interface LoadingState {
     isLoading: boolean;
     startLoading: () => void;
     stopLoading: () => void;
   }

   const useLoading = (initialState = false): LoadingState => {
     const [isLoading, setIsLoading] = useState(initialState);

     const startLoading = useCallback(() => {
       setIsLoading(true);
     }, []);

     const stopLoading = useCallback(() => {
       setIsLoading(false);
     }, []);

     return { isLoading, startLoading, stopLoading };
   };
   ```

2. **Loading Spinner Component**:
   ```typescript
   interface LoadingSpinnerProps {
     size?: 'small' | 'medium' | 'large';
     fullScreen?: boolean;
     className?: string;
   }

   export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
     size = 'medium',
     fullScreen,
     className
   }) => {
     return (
       <div 
         className={cn(
           styles.spinner,
           styles[size],
           { [styles.fullScreen]: fullScreen },
           className
         )}
         data-testid="loading-spinner"
       >
         {/* Spinner content */}
       </div>
     );
   };
   ```

### 3. Integration into Components

1. **Usage in Components**:
   ```typescript
   const Component: React.FC = () => {
     const { error, setError, clearError } = useError();
     const { isLoading, startLoading, stopLoading } = useLoading();

     const handleDataLoad = async () => {
       clearError();
       startLoading();
       try {
         const data = await loadData();
         // Process data
       } catch (e) {
         setError({
           code: 'DATA_LOAD_ERROR',
           message: 'Failed to load data'
         });
       } finally {
         stopLoading();
       }
     };

     if (isLoading) {
       return <LoadingSpinner />;
     }

     return (
       <div>
         <ErrorDisplay 
           error={error}
           onRetry={handleDataLoad}
         />
         {/* Main content */}
       </div>
     );
   };
   ```

2. **Testing Error Handling**:
   ```typescript
   describe('Component', () => {
     it('displays error on failed data load', async () => {
       // Mock data load error
       vi.mocked(loadData).mockRejectedValue(new Error('API Error'));

       render(<Component />);

       // Check spinner appearance
       expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

       // Wait for error handling
       await waitFor(() => {
         expect(screen.getByTestId('error-display')).toBeInTheDocument();
         expect(screen.getByText('Failed to load data')).toBeInTheDocument();
       });

       // Check retry functionality
       const retryButton = screen.getByTestId('error-retry-button');
       fireEvent.click(retryButton);

       // Verify retry attempt
       expect(loadData).toHaveBeenCalledTimes(2);
     });
   });
   ```

### 4. Performance Optimization

1. **Callback Memoization**:
   ```typescript
   const handleRetry = useCallback(async () => {
     await handleDataLoad();
   }, [handleDataLoad]);
   ```

2. **Preventing Excessive Renders**:
   ```typescript
   // Extract states into a separate component
   const LoadingErrorWrapper: React.FC<{
     children: React.ReactNode;
   }> = ({ children }) => {
     const { error, setError } = useError();
     const { isLoading } = useLoading();

     if (isLoading) {
       return <LoadingSpinner />;
     }

     if (error) {
       return <ErrorDisplay error={error} />;
     }

     return <>{children}</>;
   };
   ```

### 5. Grouping States and Handlers

1. **Combining Related States**:
   ```typescript
   interface ComponentState {
     loading: boolean;
     error: ApiError | null;
     data: DataType | null;
   }

   const useComponentState = (initialData?: DataType): ComponentState => {
     const [state, setState] = useState<ComponentState>({
       loading: false,
       error: null,
       data: initialData ?? null
     });

     const setLoading = useCallback((loading: boolean) => {
       setState(prev => ({ ...prev, loading }));
     }, []);

     const setError = useCallback((error: ApiError | null) => {
       setState(prev => ({ ...prev, error, loading: false }));
     }, []);

     const setData = useCallback((data: DataType) => {
       setState({ loading: false, error: null, data });
     }, []);

     return {
       state,
       setLoading,
       setError,
       setData
     };
   };
   ```

### 6. Handling Multiple Loads

1. **Tracking Active Loads**:
   ```typescript
   const useLoadingQueue = () => {
     const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

     const startTask = useCallback((taskId: string) => {
       setLoadingTasks(prev => new Set(prev).add(taskId));
     }, []);

     const finishTask = useCallback((taskId: string) => {
       setLoadingTasks(prev => {
         const next = new Set(prev);
         next.delete(taskId);
         return next;
       });
     }, []);

     return {
       isLoading: loadingTasks.size > 0,
       startTask,
       finishTask,
       activeTasks: loadingTasks
     };
   };
   ```

2. **Usage in Component**:
   ```typescript
   const Component: React.FC = () => {
     const { isLoading, startTask, finishTask } = useLoadingQueue();
     
     const loadDataItem = async (id: string) => {
       startTask(`load-item-${id}`);
       try {
         await loadItem(id);
       } finally {
         finishTask(`load-item-${id}`);
       }
     };

     return (
       <div>
         {isLoading && <LoadingSpinner />}
         {/* Content */}
       </div>
     );
   };
   ```

### 7. Error Handling Refactoring Recommendations

1. **Identify Error Points**:
   - Network requests
   - Data processing
   - User input

2. **Create Error Hierarchy**:
   - Critical (require reload)
   - Warnings (can continue working)
   - Informational messages

3. **Standardize Handling**:
   - Unified error format
   - Common display components
   - Unified handlers

4. **Add Recovery Options**:
   - Automatic retries
   - Manual operation retries
   - State preservation

5. **Improve UX on Errors**:
   - Clear messages
   - Specific instructions
   - Cancel/rollback options

## Organizing Contexts and Global State

### 1. Context Structure

1. **Basic Organization**:
   ```typescript
   // contexts/ThemeContext/ThemeContext.tsx
   interface ThemeContextType {
     theme: Theme;
     setTheme: (theme: Theme) => void;
     isLoading: boolean;
   }

   export const ThemeContext = createContext<ThemeContextType | null>(null);

   export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
     children 
   }) => {
     const [theme, setTheme] = useState<Theme>('light');
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
       // Theme initialization
       setIsLoading(false);
     }, []);

     return (
       <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
         {children}
       </ThemeContext.Provider>
     );
   };
   ```

2. **Hook for Context Usage**:
   ```typescript
   export const useTheme = () => {
     const context = useContext(ThemeContext);
     if (!context) {
       throw new Error('useTheme must be used within ThemeProvider');
     }
     return context;
   };
   ```

### 2. Provider Composition

1. **Organizing Multiple Contexts**:
   ```typescript
   const AppProviders: React.FC<{ children: React.ReactNode }> = ({ 
     children 
   }) => {
     return (
       <ErrorBoundary>
         <ThemeProvider>
           <LocalizationProvider>
             <SettingsProvider>
               {children}
             </SettingsProvider>
           </LocalizationProvider>
         </ThemeProvider>
       </ErrorBoundary>
     );
   };
   ```

2. **Provider Order**:
   - Start with global providers (theme, localization)
   - Then business logic providers
   - Finally UI-specific providers

### 3. Managing Global State

1. **Creating Store**:
   ```typescript
   interface AppState {
     isConnected: boolean;
     connectionError: string | null;
     lastSyncTime: Date | null;
   }

   const useAppStore = create<AppState>((set) => ({
     isConnected: false,
     connectionError: null,
     lastSyncTime: null,
     setConnectionStatus: (status: boolean) => 
       set({ isConnected: status, connectionError: null }),
     setError: (error: string) => 
       set({ isConnected: false, connectionError: error }),
     updateSyncTime: () => 
       set({ lastSyncTime: new Date() })
   }));
   ```

2. **Selectors for Data**:
   ```typescript
   const useConnectionStatus = () => {
     const isConnected = useAppStore(state => state.isConnected);
     const error = useAppStore(state => state.connectionError);
     return { isConnected, error };
   };
   ```

### 4. Integration with Components

1. **Usage in Components**:
   ```typescript
   const ConnectionStatus: React.FC = () => {
     const { isConnected, error } = useConnectionStatus();
     const { theme } = useTheme();

     return (
       <div 
         className={cn(styles.status, {
           [styles.connected]: isConnected,
           [styles.error]: !!error
         })}
         data-theme={theme}
       >
         {error || (isConnected ? 'Connected' : 'Disconnected')}
       </div>
     );
   };
   ```

### 5. Handling Side Effects

1. **Effects in Contexts**:
   ```typescript
   const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ 
     children 
   }) => {
     useEffect(() => {
       // Subscribe to settings changes
       const unsubscribe = subscribeToSettings((newSettings) => {
         updateSettings(newSettings);
       });

       return () => {
         unsubscribe();
       };
     }, []);

     return (/* ... */);
   };
   ```

2. **State Synchronization**:
   ```typescript
   const useSyncSettings = () => {
     const { settings, updateSettings } = useSettings();
     const { isConnected } = useConnectionStatus();

     useEffect(() => {
       if (isConnected) {
         syncSettingsWithServer(settings).catch(handleError);
       }
     }, [isConnected, settings]);
   };
   ```

### 6. Testing Contexts

1. **Test Wrappers**:
   ```typescript
   const renderWithProviders = (
     ui: React.ReactElement,
     options: RenderOptions = {}
   ) => {
     return render(ui, {
       wrapper: ({ children }) => (
         <AppProviders>{children}</AppProviders>
       ),
       ...options,
     });
   };
   ```

2. **Testing Hooks**:
   ```typescript
   describe('useTheme', () => {
     it('throws error outside provider', () => {
       const { result } = renderHook(() => useTheme());
       expect(result.error).toMatch(/useTheme must be used/);
     });

     it('returns current theme', () => {
       const { result } = renderHook(() => useTheme(), {
         wrapper: ThemeProvider,
       });
       expect(result.current.theme).toBe('light');
     });
   });
   ```

### 7. Migrating Existing Code

1. **Migration Plan**:
   - Identify global states
   - Create corresponding contexts
   - Gradually migrate components to use contexts
   - Test each step

2. **Migration Example**:
   ```typescript
   // Before: global variables or props
   const App = () => {
     const [theme, setTheme] = useState('light');
     return (
       <div>
         <Header theme={theme} onThemeChange={setTheme} />
         <Content theme={theme} />
         <Footer theme={theme} />
       </div>
     );
   };

   // After: using context
   const App = () => {
     return (
       <ThemeProvider>
         <Header />
         <Content />
         <Footer />
       </ThemeProvider>
     );
   };
   ```

### 8. Usage Recommendations

1. **When to Use Context**:
   - Global settings (theme, localization)
   - Authentication state
   - Application-wide settings
   - Data required in many components

2. **When to Use Props**:
   - Local component data
   - Data used in 1-2 component levels
   - Component-specific settings

## Common Mistakes and Recommendations

### 1. Typing Issues

1. **Loose Type Usage**:
   ```typescript
   // ❌ Bad: type not explicitly defined
   const validatePathAndHandleError = async (path: string) => {
     // may return undefined
     return;
   };

   // ✅ Good: explicit return type definition
   const validatePathAndHandleError = async (path: string): Promise<boolean> => {
     return false; // explicit boolean return
   };
   ```

2. **Importance of Explicit Return Types**:
   ```typescript
   // ❌ Bad: implicit return type
   const handleSubmit = async (e) => {
     await validatePath(downloadPath);
   };

   // ✅ Good: explicit return type
   const handleSubmit = async (e: React.FormEvent): Promise<void> => {
     await validatePath(downloadPath);
   };
   ```

### 2. Naming Issues

1. **Overly Long Names**:
   ```typescript
   // ❌ Bad: long, redundant name
   const validatePathAndHandleErrorAndUpdateUI = async () => {};

   // ✅ Good: concise, yet informative name
   const handlePathValidation = async () => {};
   ```

2. **Inconsistent Naming**:
   ```typescript
   // ❌ Bad: different naming styles
   const handle_submit = () => {};
   const processData = () => {};
   const ValidatePath = () => {};

   // ✅ Good: consistent style
   const handleSubmit = () => {};
   const handleDataProcess = () => {};
   const handlePathValidation = () => {};
   ```

### 3. Dependency Issues

1. **Unstable Dependencies in useCallback/useEffect**:
   ```typescript
   // ❌ Bad: missing ValidateDownloadPath dependency
   const validatePath = useCallback(async () => {
     await ValidateDownloadPath(path);
   }, [path]);

   // ✅ Good: all dependencies specified (exhaustive-deps rule)
   const validatePath = useCallback(async () => {
     await ValidateDownloadPath(path);
   }, [path, ValidateDownloadPath]); // <--- Added dependency
   ```
   - **Always** include all variables and functions from the outer scope used inside the hook in the dependency array. This prevents bugs related to stale values in closures.

### 4. DOM Selector Issues in Tests

1. **Unstable Selectors**:
   ```typescript
   // ❌ Bad: using querySelector
   const form = screen.getByRole("dialog").querySelector("form");

   // ✅ Good: using data-testid
   const form = screen.getByTestId("add-torrent-form");
   ```

2. **Element Search**:
   ```typescript
   // ❌ Bad: searching by classes or DOM structure
   const button = container.querySelector('.submit-button');

   // ✅ Good: searching by role or data-testid
   const button = screen.getByRole('button', { name: 'Submit' });
   // or
   const button = screen.getByTestId('submit-button');
   ```

### 5. Optimization Recommendations

1. **Component Memoization**:
   ```typescript
   // ❌ Bad: excessive memoization
   const SimpleText = memo(({ text }: { text: string }) => <span>{text}</span>);

   // ✅ Good: memoization of complex components
   const ComplexComponent = memo(({ data, onUpdate }: ComplexProps) => (
     // complex rendering logic
   ));
   ```

2. **Render Optimization**:
   ```typescript
   // ❌ Bad: creating functions on every render
   const Component = ({ onAction }) => {
     const handleClick = () => {
       // handler
       onAction();
     };
     return <button onClick={handleClick}>Click</button>;
   };

   // ✅ Good: using useCallback for handlers
   const Component = ({ onAction }) => {
     const handleClick = useCallback(() => {
       // handler
       onAction();
     }, [onAction]); // <--- Dependency onAction
     return <button onClick={handleClick}>Click</button>;
   };
   ```
   - Use `useCallback` for event handlers, especially if they are passed to child components or used in `useEffect`. This also helps test coverage tools correctly track functions.
   - **Handlers for libraries (e.g., Radix UI):** If you pass a callback to a library component (e.g., `onOpenChange`), it is often useful to wrap it in `useCallback` for stability and better testability.
     ```typescript
     const handleOpenChange = useCallback(() => {
       onClose(); // onClose from props
     }, [onClose]);
     
     return <Dialog.Root onOpenChange={handleOpenChange}>...</Dialog.Root>;
     ```

### 6. Testing Recommendations

1. **Test Support**:
   ```typescript
   // ❌ Bad: fragile tests
   test('renders correctly', () => {
     const { container } = render(<Component />);
     expect(container.querySelector('div > span')).toBeInTheDocument();
   });

   // ✅ Good: reliable tests
   test('renders content correctly', () => {
     render(<Component />);
     expect(screen.getByTestId('content-container')).toBeInTheDocument();
   });
   ```

2. **Test Descriptions**:
   ```typescript
   // ❌ Bad: uninformative descriptions
   it('works', () => {});
   it('should work', () => {});

   // ✅ Good: clear descriptions of actions and expected results
   it('displays error message on failed validation', () => {});
   it('clears form after successful submission', () => {});
   ```

### 7. Architecture Recommendations

1. **Responsibility Separation**:
   ```typescript
   // ❌ Bad: mixing logic and presentation
   const Component = () => {
     const [data, setData] = useState([]);
     const loadData = async () => {
       // API request
       // data processing
       // UI update
     };
   };

   // ✅ Good: extracting logic into a hook
   const useDataLoader = () => {
     const [data, setData] = useState([]);
     const loadData = useCallback(async () => {
       // API request
       // data processing
     }, []);
     return { data, loadData };
   };

   const Component = () => {
     const { data, loadData } = useDataLoader();
     // only rendering logic
   };
   ```

2. **Code Reuse**:
   ```typescript
   // ❌ Bad: duplicated logic
   const ComponentA = () => {
     const handleError = (error) => {
       // error handling
     };
   };

   const ComponentB = () => {
     const handleError = (error) => {
       // same error handling logic
     };
   };

   // ✅ Good: extracting common logic
   const useErrorHandler = () => {
     const handleError = useCallback((error) => {
       // common error handling logic
     }, []);
     return { handleError };
   };

   const ComponentA = () => {
     const { handleError } = useErrorHandler();
   };

   const ComponentB = () => {
     const { handleError } = useErrorHandler();
   };
   ```

### 8. Documentation Recommendations

1. **Code Comments**:
   ```typescript
   // ❌ Bad: obvious comments
   // Create state
   const [state, setState] = useState();

   // ❌ Bad: excessive comments for simple logic
   // (activeTab === "url" && !url.trim()) || // Branch 1 (&&) + Branch 2 (||)
   // (activeTab === "file" && !selectedFileData) // Branch 3 (&&)

   // ✅ Good: explanation of complex logic or *reason* for a specific decision
   // Validate path and clear errors for empty path
   const handlePathValidation = async (path: string): Promise<boolean> => { ... };

   // ✅ Good: explanation of non-obvious behavior or workaround
   // Remove "Error: " prefix for cleaner UI display
   setPathError(String(error).replace(/^Error:\s*/, ""));
   ```
   - Comments should explain *why*, not *what* the code does, if it is not obvious. Remove comments that simply repeat the code.

2. **JSDoc Documentation**:
   ```typescript
   // ❌ Bad: incomplete documentation
   /** Validation handler */
   const handleValidation = () => {};

   // ✅ Good: complete documentation
   /**
    * Validates the path and updates error state
    * @param path - Path to validate
    * @returns Promise<boolean> - true if the path is valid, false otherwise
    * @throws {ValidationError} If validation error occurs
    */
   const handlePathValidation = async (path: string): Promise<boolean> => {};
   ```

## Results Verification

1. **Structure**
   - [ ] Component resides in a separate directory
   - [ ] index.ts file created
   - [ ] Styles in a separate module
   - [ ] Tests in the __tests__ folder
   - [ ] README.md file created and filled
   - [ ] **README.ru.md file created and filled**

2. **Code**
   - [ ] JSDoc documentation
   - [ ] Props typing
   - [ ] Data-testid attributes
   - [ ] Correct imports
   - [ ] **`useEffect` dependencies checked (`exhaustive-deps`)**

3. **Tests**
   - [ ] Tests in English
   - [ ] Sufficient coverage
   - [ ] All cases tested
   - [ ] Mocks work correctly

4. **Styles**
   - [ ] Local styles in the module
   - [ ] Semantic class names
   - [ ] No global styles

5. **Documentation**
   - [ ] README.md contains component description
   - [ ] README.ru.md contains component description (Russian)
   - [ ] Usage examples
   - [ ] Props description and their types
   - [ ] Implementation details

## Potential Issues

1. **Cyclic Dependencies**
   - Check imports for cyclic dependencies
   - Use index files for exports

2. **Style Conflicts**
   - Use unique class names
   - Check selector specificity

3. **Test Issues**
   - Verify mock correctness
   - Monitor asynchronous operations
   - Properly use act() and waitFor()

## Conclusion

After refactoring, ensure that:
1. The component is isolated and reusable
2. Tests cover the main functionality
3. Styles are localized and do not affect other components
4. Documentation is up-to-date and clear
5. Code adheres to project standards
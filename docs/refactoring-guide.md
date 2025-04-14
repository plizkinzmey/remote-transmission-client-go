# Руководство по рефакторингу компонентов

## Принципы рефакторинга

1. **Структура каталогов**
   - Каждый компонент должен находиться в собственном каталоге
   - Название каталога должно совпадать с названием компонента
   - Структура каталога компонента:
     ```
     ComponentName/
     ├── README.md
     ├── index.ts
     ├── ComponentName.tsx
     ├── ComponentName.module.css
     └── __tests__/
         └── ComponentName.test.tsx
     ```

2. **Документация компонента (README.md)**
   - Краткое описание компонента и его назначения
   - Примеры использования
   - Описание пропсов и их типов
   - Особенности реализации и важные замечания
   - Зависимости компонента
   - Примеры кода

3. **Стили**
   - Каждый компонент должен иметь свой CSS-модуль
   - Стили должны быть локальными для компонента
   - Имена классов должны быть семантическими
   - Глобальные стили должны быть минимизированы

4. **Тестирование**
   - Тесты должны находиться в папке `__tests__`
   - Описания тестов должны быть на русском языке
   - Необходимо обеспечить минимальное покрытие:
     - Lines: 70%
     - Functions: 70%
     - Branches: 70%
     - Statements: 70%
   - Использовать data-testid для ключевых элементов

## План рефакторинга компонента

1. **Подготовка**
   ```bash
   # Создать структуру каталогов
   mkdir -p src/components/ComponentName/__tests__
   ```

2. **Перенос файлов**
   - Создать index.ts для экспорта
   - Перенести компонент в новый каталог
   - Создать файл стилей
   - Создать тестовый файл
   - Создать README.md файл

3. **Рефакторинг компонента**
   - Добавить JSDoc документацию
   - Определить и типизировать пропсы
   - Добавить data-testid атрибуты
   - Обновить импорты

4. **Рефакторинг стилей**
   - Перенести стили в .module.css файл
   - Использовать CSS модули
   - Обновить импорты стилей в компоненте

5. **Написание тестов**
   - Создать основные тест-кейсы
   - Убедиться в работе моков
   - Проверить покрытие кода

6. **Проверка импортов**
   - Обновить все импорты в других файлах
   - Проверить циклические зависимости
   - Обновить индексные файлы

## Пример index.ts
```typescript
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## Пример структуры компонента
```typescript
/**
 * @description Описание компонента
 */
export interface ComponentNameProps {
  /** Описание пропса */
  prop1: string;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ prop1 }) => {
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

## Пример теста
```typescript
describe('ComponentName', () => {
  it('отображается корректно с переданными пропсами', () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByTestId('component-container')).toBeInTheDocument();
  });
});
```

## Работа с компонентами Radix UI

При рефакторинге компонентов, использующих Radix UI, следуйте этим рекомендациям:

### Интеграция с системой тем

1. **Используйте встроенную систему тем Radix UI**:
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

2. **Избегайте дублирования стилей**:
   - Не переопределяйте базовые цвета и темы Radix UI
   - Используйте CSS переменные Radix UI вместо своих
   - Ограничьте CSS модули анимациями и позиционированием

3. **Правильная структура стилей**:
   ```css
   /* ✅ Правильно: только специфичные стили */
   .container {
     position: relative;
   }

   .toggleButton {
     transition: all 0.2s ease;
   }

   /* ❌ Неправильно: дублирование тем Radix UI */
   .menuItem {
     color: var(--custom-text-color);
     background: var(--custom-bg-color);
   }
   ```

### Компоненты и доступность

1. **Используйте готовые компоненты правильно**:
   ```tsx
   // ✅ Правильно: используем встроенные компоненты
   <DropdownMenu.Item>
     <Flex gap="2" align="center">
       <Icon />
       <Text>Label</Text>
     </Flex>
   </DropdownMenu.Item>

   // ❌ Неправильно: реализуем то же самое вручную
   <div role="menuitem" onClick={handler}>
     <div style={{ display: 'flex', gap: '8px' }}>
       <Icon />
       <span>Label</span>
     </div>
   </div>
   ```

2. **ARIA атрибуты**:
   - Используйте встроенные ARIA атрибуты Radix UI
   - Добавляйте дополнительные атрибуты только при необходимости

### Организация компонента

1. **Структура файлов**:
   ```
   ComponentName/
   ├── index.ts
   ├── ComponentName.tsx
   ├── ComponentName.module.css
   ├── README.md
   └── __tests__/
       └── ComponentName.test.tsx
   ```

2. **Документация компонента**:
   ```md
   # ComponentName

   ## Особенности
   - Интеграция с системой тем Radix UI
   - Поддержка dark/light/auto режимов
   - Доступность через ARIA

   ## Зависимости
   - @radix-ui/themes
   - Другие зависимости...

   ## API
   Описание пропсов и примеры использования...
   ```

### Производительность

1. **Мемоизация колбэков**:
   ```tsx
   const handleThemeChange = useCallback((theme: ThemeType) => {
     setTheme(theme);
   }, [setTheme]);
   ```

2. **Условный рендеринг**:
   ```tsx
   // ✅ Правильно: минимальное количество перерисовок
   <DropdownMenu.Root open={isOpen}>
     <DropdownMenu.Trigger />
     {isOpen && <DropdownMenu.Content />}
   </DropdownMenu.Root>
   ```

### Тестирование

1. **Моки компонентов**:
   ```tsx
   vi.mock('@radix-ui/themes', () => ({
     DropdownMenu: {
       Root: ({ children }) => <div>{children}</div>,
       // ...остальные части
     },
     // ...другие компоненты
   }));
   ```

2. **Тестирование тем**:
   ```tsx
   it('применяет правильную тему', () => {
     render(
       <ThemeProvider theme="dark">
         <Component />
       </ThemeProvider>
     );
     // Проверяем поведение, а не стили
   });
   ```

### Распространенные ошибки

1. **❌ Переопределение системы тем**:
   - Не создавайте собственную систему тем
   - Используйте встроенные темы Radix UI
   - Расширяйте только при крайней необходимости

2. **❌ Игнорирование доступности**:
   - Не удаляйте ARIA атрибуты
   - Не меняйте семантическую структуру компонентов
   - Сохраняйте поддержку клавиатурной навигации

3. **❌ Неправильная обработка состояний**:
   - Не изменяйте базовое поведение компонентов
   - Сохраняйте консистентность с другими компонентами
   - Поддерживайте все стандартные состояния (hover, focus, active)

## Декомпозиция сложных компонентов

При работе со сложными компонентами, которые выполняют множество функций, следует придерживаться следующего подхода:

### 1. Анализ и планирование

1. **Определение зон ответственности**:
   - Выделите основные функциональные блоки
   - Определите UI-компоненты, которые можно вынести
   - Выявите логику, которую можно изолировать в хуки

2. **План миграции**:
   ```
   ComponentName/
   ├── index.ts                    # Публичный API компонента
   ├── ComponentName.tsx           # Основной компонент
   ├── ComponentName.module.css    # Стили основного компонента
   ├── hooks/                      # Выделенная бизнес-логика
   │   ├── useComponentData.ts     # Работа с данными
   │   └── useComponentState.ts    # Управление состоянием
   ├── components/                 # Подкомпоненты
   │   ├── SubComponent1/
   │   └── SubComponent2/
   ├── README.md                  # Документация
   └── __tests__/                 # Тесты всех частей
   ```

### 2. Выделение бизнес-логики в хуки

1. **Критерии для выделения в хук**:
   ```typescript
   // ❌ До: Логика смешана с отображением
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
     
     // Еще много логики...
   };

   // ✅ После: Логика в отдельном хуке
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
     // Только логика отображения...
   };
   ```

2. **Правила выделения хуков**:
   - Один хук = одна зона ответственности
   - Хук должен быть универсальным
   - Обработка ошибок должна быть инкапсулирована
   - Названия методов должны отражать бизнес-логику

### 3. Создание подкомпонентов

1. **Критерии для выделения подкомпонента**:
   - Повторное использование кода
   - Сложная внутренняя логика
   - Независимый блок UI
   - Большой размер кода (более 100-150 строк)

2. **Структура подкомпонента**:
   ```typescript
   // SubComponent1/SubComponent1.tsx
   export interface SubComponent1Props {
     /** Данные для отображения */
     data: ComponentData;
     /** Обработчик изменений */
     onChange: (data: ComponentData) => void;
   }

   export const SubComponent1: React.FC<SubComponent1Props> = ({
     data,
     onChange
   }) => {
     // Локальная логика подкомпонента...
     return (
       <div data-testid="sub-component-1">
         {/* Отображение... */}
       </div>
     );
   };
   ```

### 4. Сохранение обратной совместимости

1. **Сохранение публичного API**:
   ```typescript
   // index.ts
   export { ComponentName } from './ComponentName';
   export type { ComponentNameProps } from './ComponentName';
   
   // Не экспортируем внутренние компоненты и хуки
   // export { SubComponent1 } from './components/SubComponent1';
   ```

2. **Постепенная миграция**:
   ```typescript
   // Step 1: Создаем новую структуру
   // Step 2: Переносим код частями
   // Step 3: Тестируем каждое изменение
   // Step 4: Удаляем старый код
   ```

### 5. Управление состоянием

1. **Правила распределения состояния**:
   ```typescript
   // ✅ Состояние в родительском компоненте
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

   // ✅ Локальное состояние в подкомпоненте
   const SubComponent = () => {
     const [localState, setLocalState] = useState();
     return (/* использование localState */);
   };
   ```

2. **Использование контекста**:
   ```typescript
   // Для общих данных между компонентами
   const ComponentContext = createContext<ComponentContextType | null>(null);

   export const useComponentContext = () => {
     const context = useContext(ComponentContext);
     if (!context) {
       throw new Error('useComponentContext must be used within ComponentProvider');
     }
     return context;
   };
   ```

### 6. Организация тестов

1. **Структура тестов**:
   ```
   __tests__/
   ├── ComponentName.test.tsx      # Тесты основного компонента
   ├── hooks/                      # Тесты хуков
   │   ├── useComponentData.test.ts
   │   └── useComponentState.test.ts
   └── components/                 # Тесты подкомпонентов
       ├── SubComponent1.test.tsx
       └── SubComponent2.test.tsx
   ```

2. **Тестирование интеграции**:
   ```typescript
   describe('интеграция компонентов', () => {
     it('корректно передает данные между компонентами', async () => {
       render(<ComponentName />);
       
       // Действие в одном компоненте
       fireEvent.click(screen.getByTestId('sub1-button'));
       
       // Проверка эффекта в другом компоненте
       await waitFor(() => {
         expect(screen.getByTestId('sub2-content'))
           .toHaveTextContent('обновленные данные');
       });
     });
   });
   ```

### 7. Документация рефакторинга

В README.md компонента следует добавить:

```markdown
## Архитектура

### Компоненты
- ComponentName - основной компонент
  - SubComponent1 - подкомпонент для ...
  - SubComponent2 - подкомпонент для ...

### Хуки
- useComponentData - загрузка и управление данными
- useComponentState - управление состоянием UI

### Потоки данных
1. Загрузка данных через useComponentData
2. Обработка в основном компоненте
3. Распределение по подкомпонентам

### Взаимодействие компонентов
- Схема взаимодействия компонентов
- Описание передачи данных
- Обработка событий
```

### 8. Проверка результатов декомпозиции

- [ ] Каждый компонент имеет четкую зону ответственности
- [ ] Бизнес-логика изолирована в хуках
- [ ] Подкомпоненты независимы и переиспользуемы
- [ ] Тесты покрывают как отдельные части, так и их взаимодействие
- [ ] Документация отражает новую структуру
- [ ] Сохранен публичный API компонента
- [ ] Улучшена поддерживаемость кода

## Обработка ошибок и состояний загрузки

При рефакторинге компонентов важно уделить особое внимание обработке ошибок и управлению состояниями загрузки.

### 1. Единообразная обработка ошибок

1. **Определение типов ошибок**:
   ```typescript
   type ApiError = {
     code: string;
     message: string;
     details?: Record<string, unknown>;
   };

   // В компоненте:
   const [error, setError] = useState<ApiError | null>(null);
   ```

2. **Компонент для отображения ошибок**:
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
             Повторить
           </Button>
         )}
       </div>
     );
   };
   ```

3. **Хук для обработки ошибок**:
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

### 2. Управление состоянием загрузки

1. **Хук для управления загрузкой**:
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

2. **Компонент индикатора загрузки**:
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
         {/* Содержимое спиннера */}
       </div>
     );
   };
   ```

### 3. Интеграция в компоненты

1. **Использование в компонентах**:
   ```typescript
   const Component: React.FC = () => {
     const { error, setError, clearError } = useError();
     const { isLoading, startLoading, stopLoading } = useLoading();

     const handleDataLoad = async () => {
       clearError();
       startLoading();
       try {
         const data = await loadData();
         // Обработка данных
       } catch (e) {
         setError({
           code: 'DATA_LOAD_ERROR',
           message: 'Не удалось загрузить данные'
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
         {/* Основной контент */}
       </div>
     );
   };
   ```

2. **Тестирование обработки ошибок**:
   ```typescript
   describe('Component', () => {
     it('отображает ошибку при неудачной загрузке данных', async () => {
       // Мокируем ошибку загрузки
       vi.mocked(loadData).mockRejectedValue(new Error('API Error'));

       render(<Component />);

       // Проверяем появление спиннера
       expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

       // Ждем обработки ошибки
       await waitFor(() => {
         expect(screen.getByTestId('error-display')).toBeInTheDocument();
         expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument();
       });

       // Проверяем возможность повторной загрузки
       const retryButton = screen.getByTestId('error-retry-button');
       fireEvent.click(retryButton);

       // Проверяем, что попытка загрузки повторилась
       expect(loadData).toHaveBeenCalledTimes(2);
     });
   });
   ```

### 4. Оптимизация производительности

1. **Мемоизация обработчиков**:
   ```typescript
   const handleRetry = useCallback(async () => {
     await handleDataLoad();
   }, [handleDataLoad]);
   ```

2. **Предотвращение лишних рендеров**:
   ```typescript
   // Выносим состояния в отдельный компонент
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

### 5. Группирование состояний и обработчиков

1. **Объединение связанных состояний**:
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

### 6. Обработка множественных загрузок

1. **Отслеживание активных загрузок**:
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

2. **Применение в компоненте**:
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
         {/* Контент */}
       </div>
     );
   };
   ```

### 7. Рекомендации по рефакторингу обработки ошибок

1. **Определить точки возникновения ошибок**:
   - Сетевые запросы
   - Обработка данных
   - Пользовательский ввод

2. **Создать иерархию ошибок**:
   - Критические (требуют перезагрузки)
   - Предупреждения (можно продолжить работу)
   - Информационные сообщения

3. **Стандартизировать обработку**:
   - Единый формат ошибок
   - Общие компоненты отображения
   - Унифицированные обработчики

4. **Добавить восстановление**:
   - Автоматические повторные попытки
   - Ручной повтор операций
   - Сохранение состояния

5. **Улучшить UX при ошибках**:
   - Понятные сообщения
   - Четкие инструкции
   - Возможность отмены/отката

## Организация контекстов и глобального состояния

### 1. Структура контекстов

1. **Базовая организация**:
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
       // Инициализация темы
       setIsLoading(false);
     }, []);

     return (
       <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
         {children}
       </ThemeContext.Provider>
     );
   };
   ```

2. **Хук для работы с контекстом**:
   ```typescript
   export const useTheme = () => {
     const context = useContext(ThemeContext);
     if (!context) {
       throw new Error('useTheme должен использоваться внутри ThemeProvider');
     }
     return context;
   };
   ```

### 2. Композиция провайдеров

1. **Организация нескольких контекстов**:
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

2. **Порядок провайдеров**:
   - Сначала глобальные провайдеры (тема, локализация)
   - Затем провайдеры с бизнес-логикой
   - В конце UI-специфичные провайдеры

### 3. Управление глобальным состоянием

1. **Создание стора**:
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

2. **Селекторы для данных**:
   ```typescript
   const useConnectionStatus = () => {
     const isConnected = useAppStore(state => state.isConnected);
     const error = useAppStore(state => state.connectionError);
     return { isConnected, error };
   };
   ```

### 4. Интеграция с компонентами

1. **Использование в компонентах**:
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
         {error || (isConnected ? 'Подключено' : 'Отключено')}
       </div>
     );
   };
   ```

### 5. Обработка побочных эффектов

1. **Эффекты в контекстах**:
   ```typescript
   const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ 
     children 
   }) => {
     useEffect(() => {
       // Подписка на изменения настроек
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

2. **Синхронизация состояний**:
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

### 6. Тестирование контекстов

1. **Тестовые обертки**:
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

2. **Тестирование хуков**:
   ```typescript
   describe('useTheme', () => {
     it('выбрасывает ошибку вне провайдера', () => {
       const { result } = renderHook(() => useTheme());
       expect(result.error).toMatch(/useTheme должен использоваться/);
     });

     it('возвращает текущую тему', () => {
       const { result } = renderHook(() => useTheme(), {
         wrapper: ThemeProvider,
       });
       expect(result.current.theme).toBe('light');
     });
   });
   ```

### 7. Миграция существующего кода

1. **План миграции**:
   - Идентифицировать глобальные состояния
   - Создать соответствующие контексты
   - Постепенно переводить компоненты на использование контекстов
   - Тестировать каждый шаг

2. **Пример миграции**:
   ```typescript
   // До: глобальные переменные или пропсы
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

   // После: использование контекста
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

### 8. Рекомендации по использованию

1. **Когда использовать контекст**:
   - Глобальные настройки (тема, локализация)
   - Состояние аутентификации
   - Общие настройки приложения
   - Данные, требуемые во многих компонентах

2. **Когда использовать пропсы**:
   - Локальные данные компонента
   - Данные, используемые в 1-2 уровнях компонентов
   - Специфичные настройки компонента

## Типовые ошибки и рекомендации

### 1. Проблемы с типизацией

1. **Нестрогое использование типов**:
   ```typescript
   // ❌ Плохо: тип не определен явно
   const validatePathAndHandleError = async (path: string) => {
     // может вернуть undefined
     return;
   };

   // ✅ Хорошо: явное определение возвращаемого типа
   const validatePathAndHandleError = async (path: string): Promise<boolean> => {
     return false; // явный возврат boolean
   };
   ```

2. **Важность явных типов возврата**:
   ```typescript
   // ❌ Плохо: неявный тип возврата
   const handleSubmit = async (e) => {
     await validatePath(downloadPath);
   };

   // ✅ Хорошо: явный тип возврата
   const handleSubmit = async (e: React.FormEvent): Promise<void> => {
     await validatePath(downloadPath);
   };
   ```

### 2. Проблемы с именованием

1. **Слишком длинные имена**:
   ```typescript
   // ❌ Плохо: длинное, избыточное имя
   const validatePathAndHandleErrorAndUpdateUI = async () => {};

   // ✅ Хорошо: краткое, но информативное имя
   const handlePathValidation = async () => {};
   ```

2. **Непоследовательные имена**:
   ```typescript
   // ❌ Плохо: разные стили именования
   const handle_submit = () => {};
   const processData = () => {};
   const ValidatePath = () => {};

   // ✅ Хорошо: единый стиль
   const handleSubmit = () => {};
   const handleDataProcess = () => {};
   const handlePathValidation = () => {};
   ```

### 3. Проблемы с зависимостями

1. **Нестабильные зависимости в useCallback**:
   ```typescript
   // ❌ Плохо: пропущена зависимость ValidateDownloadPath
   const validatePath = useCallback(async () => {
     await ValidateDownloadPath(path);
   }, [path]);

   // ✅ Хорошо: все зависимости указаны
   const validatePath = useCallback(async () => {
     await ValidateDownloadPath(path);
   }, [path, ValidateDownloadPath]);
   ```

2. **Неправильное использование хуков**:
   ```typescript
   // ❌ Плохо: хуки внутри условий
   if (isEnabled) {
     useEffect(() => {
       // код эффекта
     }, []);
   }

   // ✅ Хорошо: условие внутри хука
   useEffect(() => {
     if (isEnabled) {
       // код эффекта
     }
   }, [isEnabled]);
   ```

### 4. Проблемы с DOM-селекторами в тестах

1. **Нестабильные селекторы**:
   ```typescript
   // ❌ Плохо: использование querySelector
   const form = screen.getByRole("dialog").querySelector("form");

   // ✅ Хорошо: использование data-testid
   const form = screen.getByTestId("add-torrent-form");
   ```

2. **Поиск элементов**:
   ```typescript
   // ❌ Плохо: поиск по классам или структуре DOM
   const button = container.querySelector('.submit-button');

   // ✅ Хорошо: поиск по роли или data-testid
   const button = screen.getByRole('button', { name: 'Submit' });
   // или
   const button = screen.getByTestId('submit-button');
   ```

### 5. Рекомендации по оптимизации

1. **Мемоизация компонентов**:
   ```typescript
   // ❌ Плохо: избыточная мемоизация
   const SimpleText = memo(({ text }: { text: string }) => <span>{text}</span>);

   // ✅ Хорошо: мемоизация сложных компонентов
   const ComplexComponent = memo(({ data, onUpdate }: ComplexProps) => (
     // сложная логика рендеринга
   ));
   ```

2. **Оптимизация ререндеров**:
   ```typescript
   // ❌ Плохо: создание функций при каждом рендере
   const Component = () => {
     const handleClick = () => {
       // обработчик
     };
     return <button onClick={handleClick}>Click</button>;
   };

   // ✅ Хорошо: использование useCallback
   const Component = () => {
     const handleClick = useCallback(() => {
       // обработчик
     }, []);
     return <button onClick={handleClick}>Click</button>;
   };
   ```

### 6. Рекомендации по тестированию

1. **Поддержка тестов**:
   ```typescript
   // ❌ Плохо: хрупкие тесты
   test('renders correctly', () => {
     const { container } = render(<Component />);
     expect(container.querySelector('div > span')).toBeInTheDocument();
   });

   // ✅ Хорошо: надежные тесты
   test('отображает контент корректно', () => {
     render(<Component />);
     expect(screen.getByTestId('content-container')).toBeInTheDocument();
   });
   ```

2. **Описание тестов**:
   ```typescript
   // ❌ Плохо: неинформативные описания
   it('works', () => {});
   it('should work', () => {});

   // ✅ Хорошо: понятные описания действий и ожидаемого результата
   it('отображает сообщение об ошибке при неудачной валидации', () => {});
   it('очищает форму после успешной отправки', () => {});
   ```

### 7. Рекомендации по архитектуре

1. **Разделение ответственности**:
   ```typescript
   // ❌ Плохо: смешивание логики и представления
   const Component = () => {
     const [data, setData] = useState([]);
     const loadData = async () => {
       // запрос к API
       // обработка данных
       // обновление UI
     };
   };

   // ✅ Хорошо: выделение логики в хук
   const useDataLoader = () => {
     const [data, setData] = useState([]);
     const loadData = useCallback(async () => {
       // запрос к API
       // обработка данных
     }, []);
     return { data, loadData };
   };

   const Component = () => {
     const { data, loadData } = useDataLoader();
     // только логика отображения
   };
   ```

2. **Переиспользование кода**:
   ```typescript
   // ❌ Плохо: дублирование логики
   const ComponentA = () => {
     const handleError = (error) => {
       // обработка ошибки
     };
   };

   const ComponentB = () => {
     const handleError = (error) => {
       // та же логика обработки ошибки
     };
   };

   // ✅ Хорошо: вынесение общей логики
   const useErrorHandler = () => {
     const handleError = useCallback((error) => {
       // общая логика обработки ошибки
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

### 8. Рекомендации по документации

1. **Комментарии к коду**:
   ```typescript
   // ❌ Плохо: очевидные комментарии
   // Создаем состояние
   const [state, setState] = useState();

   // ✅ Хорошо: объяснение сложной логики или важных деталей
   // Проверяем путь на валидность и очищаем ошибки при пустом пути
   const handlePathValidation = async (path: string): Promise<boolean> => {
     if (!path) {
       setPathError("");
       return false;
     }
     // ...остальная логика
   };
   ```

2. **JSDoc документация**:
   ```typescript
   // ❌ Плохо: неполная документация
   /** Обработчик валидации */
   const handleValidation = () => {};

   // ✅ Хорошо: полная документация
   /**
    * Проверяет валидность пути и обновляет состояние ошибки
    * @param path - Путь для проверки
    * @returns Promise<boolean> - true если путь валидный, false в противном случае
    * @throws {ValidationError} Если произошла ошибка валидации
    */
   const handlePathValidation = async (path: string): Promise<boolean> => {};
   ```

## Проверка результатов

1. **Структура**
   - [ ] Компонент находится в отдельном каталоге
   - [ ] Создан index.ts файл
   - [ ] Стили в отдельном модуле
   - [ ] Тесты в папке __tests__
   - [ ] README.md файл создан и заполнен

2. **Код**
   - [ ] Документация JSDoc
   - [ ] Типизация пропсов
   - [ ] Data-testid атрибуты
   - [ ] Корректные импорты

3. **Тесты**
   - [ ] Тесты на русском языке
   - [ ] Достаточное покрытие
   - [ ] Все кейсы протестированы
   - [ ] Корректная работа моков

4. **Стили**
   - [ ] Локальные стили в модуле
   - [ ] Семантические имена классов
   - [ ] Отсутствие глобальных стилей

5. **Документация**
   - [ ] README.md содержит описание компонента
   - [ ] Примеры использования
   - [ ] Описание пропсов и их типов
   - [ ] Особенности реализации

## Возможные проблемы

1. **Циклические зависимости**
   - Проверять импорты на циклические зависимости
   - Использовать индексные файлы для экспорта

2. **Конфликты стилей**
   - Использовать уникальные имена классов
   - Проверять специфичность селекторов

3. **Проблемы с тестами**
   - Проверять корректность моков
   - Следить за асинхронными операциями
   - Правильно использовать act() и waitFor()

## Заключение

После рефакторинга убедитесь, что:
1. Компонент изолирован и переиспользуем
2. Тесты покрывают основную функциональность
3. Стили локализованы и не влияют на другие компоненты
4. Документация актуальна и понятна
5. Код соответствует общим стандартам проекта
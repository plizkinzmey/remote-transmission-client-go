# Руководство по рефакторингу компонентов

## Принципы рефакторинга

1. **Структура каталогов**
   - Каждый компонент должен находиться в собственном каталоге.
   - Название каталога должно совпадать с названием компонента.
   - Структура каталога компонента:
     ```
     ComponentName/
     ├── __tests__/             # Каталог для тестов
     │   ├── ComponentName.test.tsx # Тесты для основного компонента
     │   └── index.test.tsx       # Тесты для index.ts
     ├── ComponentName.tsx      # Файл основного компонента
     ├── ComponentName.module.css # CSS-модуль компонента
     ├── index.ts               # Файл для реэкспорта компонента и типов
     └── README.md              # Документация компонента
     ```

2. **Документация компонента (README.md)**
   - Краткое описание компонента и его назначения
   - Примеры использования
   - Описание пропсов и их типов
   - Детали реализации и важные замечания
   - Зависимости компонента
   - Примеры кода

3. **Стили**
   - Каждый компонент должен иметь свой CSS-модуль
   - Стили должны быть локальными для компонента
   - Имена классов должны быть семантическими
   - Глобальные стили должны быть минимизированы

4. **Тестирование**
   - Тесты должны располагаться в папке `__tests__`
   - Описания тестов должны быть на русском языке
   - Требуемое минимальное покрытие:
     - Строки: 70%
     - Инструкции: 70%
   - Используйте data-testid для ключевых элементов
   - **См. `testing-guide.ru.md` для подробных практик тестирования фронтенда.**
   - **См. `go-testing-best-practices.ru.md` для практик тестирования Go.**

## План рефакторинга компонента

1. **Подготовка**
   ```bash
   # Создать структуру каталогов
   mkdir -p src/components/ComponentName/__tests__
   ```

2. **Перенос файлов**
   - Перенести файл компонента (`ComponentName.tsx`) в `src/components/ComponentName/`.
   - Создать `index.ts` для экспорта компонента и его типов в `src/components/ComponentName/`.
   - Перенести или создать файл стилей (`ComponentName.module.css`) в `src/components/ComponentName/`.
   - Перенести или создать основной тестовый файл (`ComponentName.test.tsx`) в `src/components/ComponentName/__tests__/`.
   - Создать тестовый файл для `index.ts` (`index.test.tsx`) в `src/components/ComponentName/__tests__/`.
   - Создать `README.md` файл в `src/components/ComponentName/`.

3. **Рефакторинг компонента**
   - Добавить документацию JSDoc
   - Определить и типизировать пропсы
   - Добавить атрибуты data-testid
   - Обновить импорты

4. **Рефакторинг стилей**
   - Перенести стили в файл .module.css
   - Использовать CSS-модули
   - Обновить импорты стилей в компоненте

5. **Написание тестов**
   - Создать основные тест-кейсы для `ComponentName.test.tsx`.
   - Создать тест для проверки реэкспорта в `index.test.tsx`.
   - Убедиться в работе моков.
   - Проверить покрытие кода (включая `index.ts`).

6. **Проверка импортов**
   - Обновить все импорты в других файлах
   - Проверить на циклические зависимости
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
    <div data-testid="component-container">
      {/* Содержимое компонента */}
    </div>
  );
};
```

## Пример теста
```typescript
describe('КомпонентName', () => {
  it('рендерится корректно с переданными пропсами', () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByTestId('component-container')).toBeInTheDocument();
  });
});
```

## Работа с компонентами Radix UI

При рефакторинге компонентов, использующих Radix UI, следуйте этим рекомендациям:

### Интеграция тем

1. **Используйте встроенную систему тем Radix UI**:
   ```tsx
   // ThemeProvider.tsx
   <RadixTheme
     appearance={currentTheme === "light" ? "light" : "dark"}
     data-theme={currentTheme}
   >
     {children}
   </RadixTheme>
   ```

2. **Избегайте дублирования стилей**:
   - Не переопределяйте базовые цвета и темы Radix UI
   - Используйте CSS-переменные Radix UI вместо пользовательских
   - Ограничьте CSS-модули анимациями и позиционированием

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

1. **Используйте встроенные компоненты правильно**:
   ```tsx
   // ✅ Правильно: используйте встроенные компоненты
   <DropdownMenu.Item>
     <Flex gap="2" align="center">
       {/* ... */}
     </Flex>
   </DropdownMenu.Item>

   // ❌ Неправильно: реализуйте то же самое вручную
   <div role="menuitem" onClick={handler}>
     <div style={{ display: 'flex', gap: '8px' }}>
       {/* ... */}
     </div>
   </div>
   ```

2. **ARIA Атрибуты**:
   - Используйте встроенные ARIA атрибуты Radix UI
   - Добавляйте дополнительные атрибуты только при необходимости

### Организация компонентов

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
   - Поддержка темных/светлых/автоматических режимов
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
   // ✅ Правильно: минимальные перерисовки
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
       Trigger: ({ children }) => <button>{children}</button>,
       Content: ({ children }) => <div>{children}</div>,
       Item: ({ children, ...props }) => <button {...props}>{children}</button>,
     },
     // ...другие компоненты
   }));
   ```

2. **Тестирование тем**:
   ```tsx
   it('применяет правильную тему', () => {
     render(
       <TestThemeProvider>
         <ComponentWithTheme />
       </TestThemeProvider>
     );
     // Тестируйте поведение, а не стили
   });
   ```

### Распространенные ошибки

1. **❌ Переопределение системы тем**:
   - Не создавайте свою собственную систему тем
   - Используйте встроенные темы Radix UI
   - Расширяйте только при крайней необходимости

2. **❌ Игнорирование доступности**:
   - Не удаляйте ARIA атрибуты
   - Не изменяйте семантическую структуру компонентов
   - Поддерживайте навигацию с клавиатуры

3. **❌ Неправильная обработка состояния**:
   - Не изменяйте базовое поведение компонентов
   - Поддерживайте согласованность с другими компонентами
   - Поддерживайте все стандартные состояния (hover, focus, active)

## Декомпозиция сложных компонентов

При работе со сложными компонентами, выполняющими несколько функций, следуйте этому подходу:

### 1. Анализ и планирование

1. **Определение обязанностей**:
   - Выделите ключевые функциональные блоки
   - Определите UI-компоненты, которые можно вынести
   - Определите логику, которую можно изолировать в хуки

2. **План миграции**:
   ```
   ComponentName/
   ├── index.ts                    # Публичный API компонента
   ├── ComponentName.tsx           # Основной компонент
   ├── ComponentName.module.css    # Стили для основного компонента
   ├── hooks/                      # Изолированная бизнес-логика
   │   ├── useComponentData.ts     # Обработка данных
   │   └── useComponentState.ts    # Управление состоянием
   ├── components/                 # Подкомпоненты
   │   ├── SubComponent1/
   │   └── SubComponent2/
   ├── README.md                  # Документация
   └── __tests__/                 # Тесты для всех частей
   ```

### 2. Вынесение бизнес-логики в хуки

1. **Критерии для вынесения хука**:
   ```typescript
   // ❌ До: Логика смешана с рендерингом
   const Component = () => {
     const [data, setData] = useState([]);
     // Еще логика...
     return (/* ... */);
   };

   // ✅ После: Логика в отдельном хуке
   const useComponentData = () => {
     const [data, setData] = useState([]);
     // ...
     return { data, loading, error };
   };

   const Component = () => {
     const { data, loading, error } = useComponentData();
     // Только логика рендеринга...
     return (/* ... */);
   };
   ```

2. **Правила вынесения хуков**:
   - Один хук = одна ответственность
   - Хук должен быть переиспользуемым
   - Обработка ошибок должна быть инкапсулирована
   - Имена методов должны отражать бизнес-логику

### 3. Создание подкомпонентов

1. **Критерии для вынесения подкомпонента**:
   - Повторное использование кода
   - Сложная внутренняя логика
   - Независимый блок UI
   - Большой размер кода (более 100-150 строк)

2. **Структура подкомпонента**:
   ```typescript
   // SubComponent1/SubComponent1.tsx
   export interface SubComponent1Props {
     /** Данные для рендеринга */
     data: ComponentData;
     /** Обработчик изменений */
     onChange: (data: ComponentData) => void;
   }

   export const SubComponent1: React.FC<SubComponent1Props> = ({
     data,
     onChange
   }) => {
     // Локальная логика подкомпонента...
     return (/* ... */);
   };
   ```

### 4. Сохранение обратной совместимости

1. **Сохранение публичного API**:
   ```typescript
   // index.ts
   export { ComponentName } from './ComponentName';
   export type { ComponentNameProps } from './ComponentName';

   // Не экспортируйте внутренние компоненты и хуки
   // export { SubComponent1 } from './components/SubComponent1';
   ```

2. **Постепенная миграция**:
   ```typescript
   // Шаг 1: Создать новую структуру
   // Шаг 2: Перенести код по частям
   // Шаг 3: Протестировать каждое изменение
   // Шаг 4: Удалить старый код
   ```

### 5. Управление состоянием

1. **Правила распределения состояния**:
   ```typescript
   // ✅ Состояние в родительском компоненте
   const ParentComponent = () => {
     const [sharedState, setSharedState] = useState();
     return (
       <SubComponent1 state={sharedState} onChange={setSharedState} />
     );
   };

   // ✅ Локальное состояние в подкомпоненте
   const SubComponent = () => {
     const [localState, setLocalState] = useState();
     return (/* использовать localState */);
   };
   ```

2. **Использование контекста**:
   ```typescript
   // Для общих данных между компонентами
   const ComponentContext = createContext<ComponentContextType | null>(null);

   export const useComponentContext = () => {
     const context = useContext(ComponentContext);
     if (!context) {
       throw new Error('useComponentContext must be used within a ComponentProvider');
     }
     return context;
   };
   ```

### 6. Организация тестов

1. **Структура тестов**:
   ```
   __tests__/
   ├── ComponentName.test.tsx      # Тесты для основного компонента
   ├── hooks/                      # Тесты для хуков
   │   ├── useComponentData.test.ts
   │   └── useComponentState.test.ts
   └── components/                 # Тесты для подкомпонентов
       ├── SubComponent1.test.tsx
       └── SubComponent2.test.tsx
   ```

2. **Интеграционное тестирование**:
   ```typescript
   describe('интеграция компонентов', () => {
     it('корректно передает данные между компонентами', async () => {
       // Тест взаимодействия основного компонента, хуков и подкомпонентов
     });
   });
   ```

### 7. Рефакторинг документации

В README.md компонента добавьте:

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
- Диаграмма взаимодействия компонентов
- Описание передачи данных
- Обработка событий
```

### 8. Проверка результатов декомпозиции

- [ ] Каждый компонент имеет четкую ответственность
- [ ] Бизнес-логика изолирована в хуках
- [ ] Подкомпоненты независимы и переиспользуемы
- [ ] Тесты покрывают как отдельные части, так и их взаимодействие
- [ ] Документация отражает новую структуру
- [ ] Публичный API компонента сохранен
- [ ] Поддерживаемость кода улучшена

## Обработка ошибок и состояния загрузки

При рефакторинге компонентов уделите особое внимание обработке ошибок и управлению состояниями загрузки.

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

2. **Компонент отображения ошибок**:
   ```typescript
   interface ErrorDisplayProps {
     error: ApiError | null;
     className?: string;
   }

   export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
     error,
     className
   }) => {
     if (!error) return null;
     return (
       <div className={className} data-testid="error-display">
         {error.message}
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
     const clearError = useCallback(() => setError(null), []);
     const hasError = error !== null;
     return { error, setError, clearError, hasError };
   };
   ```

### 2. Управление состояниями загрузки

1. **Хук состояния загрузки**:
   ```typescript
   interface LoadingState {
     isLoading: boolean;
     startLoading: () => void;
     stopLoading: () => void;
   }

   const useLoading = (initialState = false): LoadingState => {
     const [isLoading, setIsLoading] = useState(initialState);
     const startLoading = useCallback(() => setIsLoading(true), []);
     const stopLoading = useCallback(() => setIsLoading(false), []);
     return { isLoading, startLoading, stopLoading };
   };
   ```

2. **Компонент спиннера загрузки**:
   ```typescript
   interface LoadingSpinnerProps {
     size?: 'small' | 'medium' | 'large';
     className?: string;
   }

   export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
     size = 'medium',
     className
   }) => {
     return (
       <div className={className} data-testid="loading-spinner">
         {/* Иконка спиннера */}
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
       startLoading();
       clearError();
       try {
         // Загрузка данных...
       } catch (err) {
         setError({ code: 'LOAD_FAILED', message: 'Ошибка загрузки' });
       } finally {
         stopLoading();
       }
     };

     return (
       <div>
         {isLoading && <LoadingSpinner />}
         <ErrorDisplay error={error} />
         {/* ... */}
       </div>
     );
   };
   ```

2. **Тестирование обработки ошибок**:
   ```typescript
   describe('Компонент', () => {
     it('отображает ошибку при неудачной загрузке данных', async () => {
       // Мокируем API для возврата ошибки
       render(<Component />);
       // Вызываем загрузку данных
       await waitFor(() => {
         expect(screen.getByTestId('error-display')).toBeInTheDocument();
       });
     });
   });
   ```

### 4. Оптимизация производительности

1. **Мемоизация колбэков**:
   ```typescript
   const handleRetry = useCallback(async () => {
     clearError();
     await handleDataLoad();
   }, [handleDataLoad, clearError]);
   ```

2. **Предотвращение лишних рендеров**:
   ```typescript
   // Вынесите состояния в отдельный компонент-обертку, если это необходимо
   const LoadingErrorWrapper: React.FC<{
     isLoading: boolean;
     error: ApiError | null;
     children: React.ReactNode;
   }> = ({ isLoading, error, children }) => {
     if (isLoading) return <LoadingSpinner />;
     if (error) return <ErrorDisplay error={error} />;
     return <>{children}</>;
   };
   ```

### 5. Группировка состояний и обработчиков

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
       data: initialData || null,
     });
     // ... методы для обновления состояния
     return state;
   };
   ```

### 6. Обработка множественных загрузок

1. **Отслеживание активных загрузок**:
   ```typescript
   const useLoadingQueue = () => {
     const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
     const isLoading = loadingTasks.size > 0;

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

     return { isLoading, startTask, finishTask };
   };
   ```

2. **Использование в компоненте**:
   ```typescript
   const Component: React.FC = () => {
     const { isLoading, startTask, finishTask } = useLoadingQueue();

     const loadItem = async (itemId: string) => {
       startTask(itemId);
       try {
         // Загрузка...
       } finally {
         finishTask(itemId);
       }
     };

     return (
       <div>
         {isLoading && <LoadingSpinner />}
         {/* ... */}
       </div>
     );
   };
   ```

### 7. Рекомендации по рефакторингу обработки ошибок

1. **Определите точки возникновения ошибок**:
   - Сетевые запросы
   - Обработка данных
   - Пользовательский ввод

2. **Создайте иерархию ошибок**:
   - Критические (требуют перезагрузки)
   - Предупреждения (можно продолжить работу)
   - Информационные сообщения

3. **Стандартизируйте обработку**:
   - Единый формат ошибок
   - Общие компоненты отображения
   - Единые обработчики

4. **Добавьте возможности восстановления**:
   - Автоматические повторные попытки
   - Ручной повтор операции
   - Сохранение состояния

5. **Улучшите UX при ошибках**:
   - Понятные сообщения
   - Конкретные инструкции
   - Возможность отмены/отката

## Организация контекстов и глобального состояния

### 1. Структура контекста

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
     // ... логика загрузки темы
     const value = { theme, setTheme, isLoading };
     return (
       <ThemeContext.Provider value={value}>
         {children}
       </ThemeContext.Provider>
     );
   };
   ```

2. **Хук для использования контекста**:
   ```typescript
   export const useTheme = () => {
     const context = useContext(ThemeContext);
     if (!context) {
       throw new Error('useTheme must be used within a ThemeProvider');
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
       <ThemeProvider>
         <LocalizationProvider>
           <AuthProvider>
             {children}
           </AuthProvider>
         </LocalizationProvider>
       </ThemeProvider>
     );
   };
   ```

2. **Порядок провайдеров**:
   - Начинайте с глобальных провайдеров (тема, локализация)
   - Затем провайдеры бизнес-логики
   - В конце UI-специфичные провайдеры

### 3. Управление глобальным состоянием (например, с Zustand)

1. **Создание хранилища**:
   ```typescript
   import { create } from 'zustand';

   interface AppState {
     isConnected: boolean;
     lastSyncTime: Date | null;
     setConnected: (status: boolean) => void;
     updateSyncTime: () => void;
   }

   const useAppStore = create<AppState>((set) => ({
     isConnected: false,
     lastSyncTime: null,
     setConnected: (status) => set({ isConnected: status }),
     updateSyncTime: () => set({ lastSyncTime: new Date() }),
   }));
   ```

2. **Селекторы для данных**:
   ```typescript
   const useConnectionStatus = () => {
     const isConnected = useAppStore(state => state.isConnected);
     const error = useAppStore(state => state.connectionError); // Пример
     return { isConnected, error };
   };
   ```

### 4. Интеграция с компонентами

1. **Использование в компонентах**:
   ```typescript
   const ConnectionStatus: React.FC = () => {
     const { isConnected, error } = useConnectionStatus();
     if (error) return <div>Ошибка соединения</div>;
     return <div>Статус: {isConnected ? 'Подключено' : 'Отключено'}</div>;
   };
   ```

### 5. Обработка побочных эффектов

1. **Эффекты в контекстах**:
   ```typescript
   const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
     children
   }) => {
     useEffect(() => {
       // Загрузка настроек при монтировании
       loadSettings();
     }, []);
     // ...
     return (/* ... */);
   };
   ```

2. **Синхронизация состояния**:
   ```typescript
   const useSyncSettings = () => {
     const { settings, updateSettings } = useSettings();
     const isConnected = useAppStore(state => state.isConnected);

     useEffect(() => {
       if (isConnected) {
         // Синхронизировать настройки с сервером при подключении
         syncSettingsWithServer(settings);
       }
     }, [isConnected, settings]);
   };
   ```

### 6. Тестирование контекстов

1. **Тестовые обертки**:
   ```typescript
   import { render, RenderOptions } from '@testing-library/react';

   const AllTheProviders: React.FC<{children: React.ReactNode}> = ({ children }) => {
     return (
       <ThemeProvider>
         <LocalizationProvider>
           {children}
         </LocalizationProvider>
       </ThemeProvider>
     );
   };

   const renderWithProviders = (
     ui: React.ReactElement,
     options?: Omit<RenderOptions, 'wrapper'>
   ) => render(ui, { wrapper: AllTheProviders, ...options });

   // Использование:
   renderWithProviders(<MyComponent />);
   ```

2. **Тестирование хуков**:
   ```typescript
   import { renderHook } from '@testing-library/react-hooks';

   describe('useTheme', () => {
     it('выбрасывает ошибку вне провайдера', () => {
       const { result } = renderHook(() => useTheme());
       expect(result.error).toEqual(new Error('useTheme must be used within a ThemeProvider'));
     });

     it('возвращает значения темы внутри провайдера', () => {
       const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
       const { result } = renderHook(() => useTheme(), { wrapper });
       expect(result.current.theme).toBeDefined();
     });
   });
   ```

### 7. Миграция существующего кода

1. **План миграции**:
   - Определите глобальные состояния
   - Создайте соответствующие контексты
   - Постепенно мигрируйте компоненты на использование контекстов
   - Тестируйте каждый шаг

2. **Пример миграции**:
   ```typescript
   // До: глобальные переменные или пропсы
   const App = () => {
     const [theme, setTheme] = useState('light');
     return <ChildComponent theme={theme} setTheme={setTheme} />;
   };

   // После: использование контекста
   const App = () => {
     return (
       <ThemeProvider>
         <ChildComponent />
       </ThemeProvider>
     );
   };

   const ChildComponent = () => {
     const { theme, setTheme } = useTheme();
     // ...
   };
   ```

### 8. Рекомендации по использованию

1. **Когда использовать контекст**:
   - Глобальные настройки (тема, локализация)
   - Состояние аутентификации
   - Настройки всего приложения
   - Данные, необходимые во многих компонентах

2. **Когда использовать пропсы**:
   - Локальные данные компонента
   - Данные, используемые на 1-2 уровнях компонентов
   - Специфичные для компонента настройки

## Распространенные ошибки и рекомендации

### 1. Проблемы с типизацией

1. **Нестрогое использование типов**:
   ```typescript
   // ❌ Плохо: тип не определен явно
   const validatePathAndHandleError = async (path: string) => {
     try {
       await ValidateDownloadPath(path);
       // может вернуть undefined
     } catch (error) {
       // ...
     }
     return; // Неявный undefined
   };

   // ✅ Хорошо: явное определение возвращаемого типа
   const validatePathAndHandleError = async (path: string): Promise<boolean> => {
     try {
       await ValidateDownloadPath(path);
       return true;
     } catch (error) {
       // ...
       return false; // Явный возврат boolean
     }
   };
   ```

2. **Важность явных возвращаемых типов**:
   ```typescript
   // ❌ Плохо: неявный возвращаемый тип (может быть Promise<void> или Promise<boolean>)
   const handleSubmit = async (e) => {
     e.preventDefault();
     const isValid = await validatePath(downloadPath);
     if (!isValid) return;
     // ...
   };

   // ✅ Хорошо: явный возвращаемый тип
   const handleSubmit = async (e: React.FormEvent): Promise<void> => {
     e.preventDefault();
     const isValid = await validatePath(downloadPath);
     if (!isValid) return;
     // ...
   };
   ```

### 2. Проблемы с именованием

1. **Слишком длинные имена**:
   ```typescript
   // ❌ Плохо: длинное, избыточное имя
   const validatePathAndHandleErrorAndUpdateUI = async () => {};

   // ✅ Хорошо: разбить на более мелкие функции
   const validatePath = async (path: string): Promise<boolean> => { /* ... */ };
   const updateUIWithError = (error: string) => { /* ... */ };
   const handlePathValidation = async (path: string) => {
     if (!await validatePath(path)) {
       updateUIWithError("Invalid path");
     }
   };
   ```

2. **Непоследовательное именование**:
   ```typescript
   // ❌ Плохо: разные стили (handlePathChange, pathChangedHandler)
   const handlePathChange = (newPath: string) => {};
   const pathChangedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {};

   // ✅ Хорошо: единый стиль (handle...)
   const handlePathChange = (newPath: string) => {};
   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {};
   ```

### 3. Проблемы с зависимостями

1. **Нестабильные зависимости в useCallback/useEffect**:
   ```typescript
   const Component = ({ options }) => {
     const [data, setData] = useState(null);

     // ❌ Плохо: options - объект, будет меняться при каждом рендере родителя
     const fetchData = useCallback(async () => {
       // ... использует options
     }, [options]); // fetchData будет создаваться заново при каждом рендере

     // ✅ Хорошо: используйте примитивные значения или мемоизируйте объект в родителе
     const fetchData = useCallback(async () => {
       // ... использует options.url, options.method
     }, [options.url, options.method]); // Зависит только от нужных полей

     // ✅ Или: мемоизируйте options в родительском компоненте с useMemo
     const memoizedOptions = useMemo(() => ({ url: '/api', method: 'GET' }), []);
     // ... передать memoizedOptions в Component
   };
   ```
   - **Всегда** включайте все переменные и функции из внешней области видимости, используемые внутри хука, в массив зависимостей. Это предотвращает ошибки, связанные с устаревшими значениями в замыканиях.

### 4. Проблемы с селекторами DOM в тестах

1. **Нестабильные селекторы**:
   ```typescript
   // ❌ Плохо: зависит от структуры DOM или текста, который может измениться
   const button = container.querySelector('div > button.primary');
   const title = screen.getByText('Добро пожаловать!');

   // ✅ Хорошо: используйте data-testid или role
   const button = screen.getByTestId('submit-button');
   const title = screen.getByRole('heading', { name: /welcome/i });
   ```

2. **Поиск элементов**:
   ```typescript
   // ❌ Плохо: querySelector может вернуть null, что приведет к ошибке при взаимодействии
   const input = container.querySelector('input[name="email"]');
   fireEvent.change(input, { target: { value: 'test' } }); // Ошибка, если input === null

   // ✅ Хорошо: используйте getBy*, findBy* или queryBy* из RTL
   const input = screen.getByLabelText('Email'); // Выбросит ошибку, если не найден
   fireEvent.change(input, { target: { value: 'test' } });

   const optionalElement = screen.queryByTestId('optional-element'); // Вернет null, если не найден
   if (optionalElement) {
     // ...
   }
   ```

### 5. Рекомендации по оптимизации

1. **Мемоизация компонентов**:
   ```typescript
   // ❌ Плохо: компонент перерисовывается при каждом рендере родителя
   const ChildComponent = ({ data }) => { /* ... */ };

   // ✅ Хорошо: используйте React.memo для предотвращения ненужных рендеров
   import React, { memo } from 'react';
   const ChildComponent = memo(({ data }) => { /* ... */ });
   ```
   - Используйте `React.memo` для компонентов, которые получают сложные пропсы (объекты, массивы) и не должны перерисовываться, если эти пропсы не изменились по ссылке.

2. **Оптимизация рендеров**:
   ```typescript
   // ❌ Плохо: создание новой функции при каждом рендере
   <button onClick={() => console.log('Clicked')}>Click</button>

   // ✅ Хорошо: используйте useCallback для мемоизации колбэков
   const handleClick = useCallback(() => {
     console.log('Clicked');
   }, []);
   <button onClick={handleClick}>Click</button>
   ```
   - Используйте `useCallback` для колбэков, передаваемых в мемоизированные дочерние компоненты, чтобы предотвратить их ненужные перерисовки.
   - Используйте `useMemo` для мемоизации результатов сложных вычислений.

### 6. Рекомендации по тестированию

1. **Поддержка тестов**:
   ```typescript
   // ❌ Плохо: тест зависит от внутренней реализации
   expect(componentInstance.state.isLoading).toBe(true);

   // ✅ Хорошо: тест проверяет видимый результат
   expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
   ```
   - Тестируйте поведение компонента с точки зрения пользователя, а не его внутреннюю реализацию.

2. **Описания тестов**:
   ```typescript
   // ❌ Плохо: непонятное описание
   it('test 1', () => {});

   // ✅ Хорошо: четкое описание на русском языке
   it('должен отображать сообщение об ошибке при неверном пароле', () => {});
   ```

### 7. Рекомендации по архитектуре

1. **Разделение ответственности**:
   ```typescript
   // ❌ Плохо: компонент делает слишком много (загрузка данных, обработка формы, отображение)
   const MegaComponent = () => { /* ... */ };

   // ✅ Хорошо: разбить на хук для данных, компонент формы, компонент отображения
   const useData = () => { /* ... */ };
   const FormComponent = () => { /* ... */ };
   const DisplayComponent = () => { /* ... */ };
   const ParentComponent = () => {
     const data = useData();
     return <> <FormComponent /> <DisplayComponent data={data} /> </>;
   };
   ```
   - Следуйте принципу единственной ответственности (Single Responsibility Principle).

2. **Переиспользование кода**:
   ```typescript
   // ❌ Плохо: дублирование логики в нескольких компонентах
   // ✅ Хорошо: вынести общую логику в кастомный хук или утилитарную функцию
   const useSharedLogic = () => { /* ... */ };
   ```

### 8. Рекомендации по документации

1. **Комментарии в коде**:
   ```typescript
   // ❌ Плохо: комментарий повторяет код
   // Установить значение count в 0
   setCount(0);

   // ✅ Хорошо: комментарий объясняет причину
   // Сбросить счетчик при смене пользователя, чтобы избежать показа старых данных
   setCount(0);
   ```
   - Комментарии должны объяснять *почему*, а не *что* делает код, если это не очевидно. Удаляйте комментарии, которые просто повторяют код.

2. **Документация JSDoc**:
   ```typescript
   /**
    * Загружает данные пользователя по его ID.
    * @param userId - Идентификатор пользователя.
    * @returns Промис, который разрешается с данными пользователя или отклоняется с ошибкой.
    * @throws {Error} Если пользователь не найден или произошла ошибка сети.
    */
   const fetchUserData = async (userId: string): Promise<UserData> => {
     // ...
   };
   ```
   - Документируйте публичные функции, компоненты и хуки с помощью JSDoc, описывая их назначение, параметры, возвращаемые значения и возможные ошибки.

## Проверка результатов

1. **Структура**
   - [ ] Компонент находится в отдельном каталоге
   - [ ] Файл README.md создан и заполнен
   - [ ] Структура соответствует гайду (`__tests__`, `index.ts` и т.д.)

2. **Код**
   - [ ] Документация JSDoc для компонента и пропсов
   - [ ] Корректные импорты (относительные пути, импорт из `index.ts` соседних компонентов)
   - [ ] Типизация пропсов и состояний
   - [ ] Атрибуты `data-testid` для ключевых элементов

3. **Тесты**
   - [ ] Тесты находятся в `__tests__`
   - [ ] Описания тестов на русском языке
   - [ ] Моки работают корректно
   - [ ] Покрытие соответствует требованиям (минимум 70%)
   - [ ] Тест для `index.ts` присутствует и проходит

4. **Стили**
   - [ ] Локальные стили в `.module.css`
   - [ ] Нет глобальных стилей или конфликтов
   - [ ] Используются CSS-переменные темы, где это применимо

5. **Документация**
   - [ ] README.md содержит описание компонента, пропсов, примеры использования
   - [ ] Описаны детали реализации, если необходимо

## Потенциальные проблемы

1. **Циклические зависимости**
   - Проверьте импорты на циклические зависимости с помощью инструментов анализа или вручную.
   - Используйте `index.ts` файлы для экспорта, чтобы упростить структуру импортов.

2. **Конфликты стилей**
   - Убедитесь, что имена классов в CSS-модулях уникальны и не конфликтуют.
   - Проверьте специфичность селекторов, если стили не применяются.

3. **Проблемы с тестами**
   - Убедитесь в правильности моков, особенно для асинхронных функций и API Wails.
   - Используйте `act()` и `waitFor()` правильно для обработки асинхронных обновлений состояния и рендеринга.

## Заключение

После рефакторинга убедитесь, что:
1. Компонент изолирован и переиспользуем
2. Тесты покрывают основную функциональность
3. Стили локализованы и не влияют на другие компоненты
4. Документация актуальна и понятна
5. Код соответствует стандартам проекта
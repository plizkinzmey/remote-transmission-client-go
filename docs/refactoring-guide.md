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
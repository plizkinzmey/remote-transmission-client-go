# Руководство по рефакторингу компонентов

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
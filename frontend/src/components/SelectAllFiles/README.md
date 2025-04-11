# SelectAllFiles

Компонент для выбора или отмены выбора всех файлов в дереве торрента.

## Особенности
- Управление массовым выбором файлов
- Поддержка трёх состояний чекбокса: выбрано всё, не выбрано ничего, выбрано частично
- Визуальное представление промежуточного состояния (indeterminate)
- Интеграция с системой тем Radix UI
- Полная доступность для управления с клавиатуры и скринридеров

## API

### Props

| Prop | Тип | Описание |
|------|-----|----------|
| `allChecked` | `boolean` | Флаг, указывающий что все файлы выбраны |
| `indeterminate` | `boolean` | Флаг, указывающий что выбраны не все файлы (промежуточное состояние) |
| `onToggleAll` | `() => void` | Обработчик переключения выбора всех файлов |

## Примеры использования

```tsx
import { SelectAllFiles } from '../SelectAllFiles';

// Все файлы выбраны
<SelectAllFiles 
  allChecked={true}
  indeterminate={false}
  onToggleAll={() => console.log('Toggle all files')}
/>

// Некоторые файлы выбраны (промежуточное состояние)
<SelectAllFiles 
  allChecked={false}
  indeterminate={true}
  onToggleAll={() => console.log('Toggle all files')}
/>

// Нет выбранных файлов
<SelectAllFiles 
  allChecked={false}
  indeterminate={false}
  onToggleAll={() => console.log('Toggle all files')}
/>
```

## Зависимости
- @radix-ui/themes (Text, Checkbox)
- Локализация через useLocalization

## Стилевые особенности
- Светлый фон для визуального выделения среди других элементов интерфейса
- Закругленные углы для визуального отделения
- Отступ снизу для отделения от списка файлов
- Специальные стили для промежуточного состояния чекбокса

## Примечания
- Компонент применяет цвет фона из переменных темы (--background-secondary)
- Локализация текста "Выбрать все" через систему локализации
- При промежуточном состоянии (indeterminate=true) к чекбоксу добавляется класс indeterminate-checkbox
- Используется ReactRef для управления DOM-свойством indeterminate чекбокса
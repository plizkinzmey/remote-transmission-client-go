# FileNode

Компонент для отображения узла в дереве файлов торрента.

## Особенности
- Отображение файла или директории с соответствующей иконкой
- Управление состоянием выбора файла (чекбокс)
- Поддержка промежуточного состояния чекбокса (indeterminate)
- Показ прогресса загрузки файла или директории
- Показ размера файла или директории
- Возможность сворачивания/разворачивания директорий
- Рекурсивное отображение дочерних узлов
- Интеграция с Radix UI

## API

### Props

| Prop | Тип | Описание |
|------|-----|----------|
| `node` | `FileNode` | Данные узла для отображения |
| `depth` | `number` | (optional) Уровень вложенности узла, по умолчанию 0 |
| `onToggleWanted` | `(node: FileNode, wanted: boolean) => void` | Обработчик переключения состояния выбора узла |
| `onToggleExpand` | `(node: FileNode) => void` | Обработчик переключения свёрнутости узла |

### Тип FileNode

```typescript
interface FileNode {
  ID: number;             // ID файла
  Name: string;           // Имя файла
  Path: string;           // Путь к файлу
  Size: number;           // Размер файла в байтах
  Progress: number;       // Прогресс загрузки (0-100)
  Wanted: boolean;        // Выбран ли файл для загрузки
  isDirectory?: boolean;  // Является ли узел директорией
  children?: FileNode[];  // Дочерние узлы (для директорий)
  expanded?: boolean;     // Развернут ли узел
  indeterminate?: boolean; // Промежуточное состояние чекбокса
}
```

## Примеры использования

```tsx
import { FileNode } from '../FileNode';
import { FileNode as FileNodeType } from '../../types/FileTree';

// Пример данных узла
const node: FileNodeType = {
  ID: 1,
  Name: "example.txt",
  Path: "folder/example.txt",
  Size: 1024,
  Progress: 45,
  Wanted: true,
  isDirectory: false
};

// Обработчики событий
const handleToggleWanted = (node: FileNodeType, wanted: boolean) => {
  console.log(`Node ${node.Path} wanted state changed to ${wanted}`);
};

const handleToggleExpand = (node: FileNodeType) => {
  console.log(`Node ${node.Path} expanded state changed`);
};

// Использование компонента
<FileNode 
  node={node} 
  onToggleWanted={handleToggleWanted}
  onToggleExpand={handleToggleExpand}
/>
```

## Зависимости
- @radix-ui/themes
- @heroicons/react/24/outline
- Внутренние утилиты для форматирования размера файла

## Примечания
- Компонент рекурсивно отображает все дочерние узлы директорий
- Поддерживает промежуточное состояние чекбокса для директорий, когда выбраны не все файлы
- Интеграция с библиотекой стилей Radix UI для тем и компонентов
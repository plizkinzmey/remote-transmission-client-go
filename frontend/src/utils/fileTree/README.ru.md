# Утилиты для работы с деревом файлов

Этот модуль предоставляет набор служебных функций для построения, манипуляции и анализа структуры дерева файлов торрентов в пользовательском интерфейсе клиента Transmission.

## Обзор

Основная функциональность модуля сосредоточена на преобразовании плоского списка файлов, полученных от бэкенда, в иерархическую древовидную структуру (`FileNode[]`), подходящую для отображения и взаимодействия в UI (например, в компоненте `TorrentContent`).

## Ключевые функции

- **`buildFileTree(files: TorrentFile[]): FileNode[]`**:
    Основная функция для построения дерева файлов. Она принимает массив объектов `TorrentFile`, сортирует их по пути, создаёт экземпляры `FileNode` для директорий и файлов, устанавливает связи родитель-потомок и рассчитывает начальную статистику директорий. Использует функции `createNodeForPath`, `addNodeToParent` и `calculateDirStats`.

- **`calculateDirStats(node: FileNode): DirStats`**:
    Рекурсивно вычисляет агрегированную статистику (общий размер, средний прогресс, общее количество файлов и статусы `Wanted`/`indeterminate`) для узла директории на основе его потомков. Обновляет свойства директории `Size`, `Progress`, `Wanted` и `indeterminate`.

- **`updateNodesWanted(nodes: FileNode[], targetNode: FileNode, wanted: boolean, fileIds: number[]): FileNode[]`**:
    Обновляет статус `Wanted` для целевого узла и его потомков, рекурсивно обновляя родительские узлы для поддержания согласованности состояния. Собирает и возвращает массив ID файлов, которые требуют обновления на бэкенде.

## Использование

```typescript
// Импорт необходимых функций
import { buildFileTree, updateNodesWanted } from '../utils/fileTree';

// Пример использования для построения дерева файлов торрента
const torrentFiles = await GetTorrentFiles(torrentId);
const fileTree = buildFileTree(torrentFiles);

// Обновление статуса выбранных файлов
const handleToggleWanted = (node: FileNode, wanted: boolean) => {
  // Создание глубокой копии для сохранения иммутабельности
  const updatedTree = [...fileTree];
  // Получение идентификаторов файлов, требующих обновления
  const fileIds = [];
  // Обновление узлов и получение идентификаторов затронутых файлов
  updateNodesWanted(updatedTree, node, wanted, fileIds);
  
  // Обновление статусов файлов на бэкенде
  if (fileIds.length > 0) {
    await SetFilesWanted(torrentId, fileIds, wanted);
  }
  
  // Обновление состояния дерева файлов в компоненте
  setFileTree(updatedTree);
};
```

## Структура данных

### TorrentFile (входные данные из бэкенда)

```typescript
interface TorrentFile {
  Id: number;            // Уникальный ID файла
  Path: string;          // Полный путь файла включая имя
  Name: string;          // Имя файла
  Size: number;          // Размер файла в байтах
  Progress: number;      // Прогресс загрузки (0-1)
  Wanted: boolean;       // Выбран ли файл для загрузки
}
```

### FileNode (внутренняя структура представления дерева)

```typescript
interface FileNode {
  Id?: number;           // ID файла (только для файлов, не для директорий)
  Path: string;          // Полный путь узла
  Name: string;          // Имя файла или директории
  Size?: number;         // Размер файла или суммарный размер директории
  Progress?: number;     // Прогресс загрузки файла или средний прогресс директории
  Wanted: boolean;       // Статус выбора для загрузки
  indeterminate?: boolean; // Промежуточное состояние (для директорий)
  isDirectory: boolean;  // Является ли узел директорией
  children?: FileNode[]; // Дочерние узлы для директорий
  parent?: FileNode;     // Ссылка на родительский узел
}
```

### DirStats (внутренняя структура для агрегированных данных директорий)

```typescript
interface DirStats {
  size: number;          // Общий размер
  progressSum: number;   // Взвешенная сумма прогресса
  count: number;         // Количество файлов
  allWanted: boolean;    // Выбраны ли все файлы
  anyWanted: boolean;    // Выбран ли хотя бы один файл
}
```

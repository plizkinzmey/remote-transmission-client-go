# Утилиты для дерева файлов

Этот модуль предоставляет набор вспомогательных функций для построения, манипулирования и анализа древовидной структуры файлов торрентов во фронтенде Transmission Client.

## Обзор

Основная функциональность заключается в преобразовании плоского списка файлов, полученного от бэкенда, в иерархическую древовидную структуру (`FileNode[]`), подходящую для отображения и взаимодействия в пользовательском интерфейсе (например, в компоненте `TorrentContent`).

## Ключевые функции

-   **`buildFileTree(files: TorrentFile[]): FileNode[]`**:
    Основная функция для построения дерева файлов. Принимает массив объектов `TorrentFile`, сортирует их по пути, создает экземпляры `FileNode` для директорий и файлов, устанавливает связи родитель-потомок и вычисляет начальную статистику для директорий. Использует `createNodeForPath`, `addNodeToParent` и `calculateDirStats`.

-   **`calculateDirStats(node: FileNode): DirStats`**:
    Рекурсивно вычисляет агрегированную статистику (общий размер, средний прогресс, общее количество файлов и статус `Wanted`/`indeterminate`) для узла директории на основе его дочерних элементов. Обновляет свойства `Size`, `Progress`, `Wanted` и `indeterminate` узла директории.

-   **`updateNodesWanted(nodes: FileNode[], targetNode: FileNode, wanted: boolean, fileIds: number[]): FileNode[]`**:
    Рекурсивно обновляет статус `Wanted` целевого узла и всех его потомков (если это директория) или конкретных узлов файлов на основе предоставленных ID. Возвращает *новый* массив узлов с обновленными статусами. Также пересчитывает статус `Wanted` и `indeterminate` для родительских директорий, затронутых изменением.

-   **`collectFileIds(node: FileNode): number[]`**:
    Рекурсивно собирает идентификаторы (ID) всех *файлов* внутри данного узла (и его дочерних элементов, если это директория).

-   **`formatFileSize(size: number | undefined): string`**:
    Форматирует размер файла (в байтах) в человекочитаемую строку с использованием двоичных префиксов (B, KiB, MiB, GiB, TiB) с двумя знаками после запятой. Корректно обрабатывает `undefined` или неположительные значения.

-   **`createNodeForPath(file: TorrentFile, partName: string, fullPath: string, isFile: boolean): FileNode`**:
    Вспомогательная функция, используемая `buildFileTree` для создания одного экземпляра `FileNode`, инициализируя его свойства в зависимости от того, представляет ли он файл или директорию.

-   **`addNodeToParent(root: { [path: string]: FileNode }, node: FileNode, parentPath: string): void`**:
    Вспомогательная функция, используемая `buildFileTree` для добавления вновь созданного узла в массив `children` его родительского узла внутри объекта поиска `root`.

## Использование

Эти утилиты в основном используются компонентами, отвечающими за отображение содержимого торрента, такими как `TorrentContent`, для построения дерева файлов и обработки взаимодействий пользователя, таких как выбор/отмена выбора файлов для загрузки.

```typescript
import { buildFileTree, updateNodesWanted, collectFileIds, TorrentFile, FileNode } from './index'; // Предполагая импорт из index этого каталога

// Пример: Построение дерева
const filesFromBackend: TorrentFile[] = [/* ... массив объектов TorrentFile ... */];
let fileTree: FileNode[] = buildFileTree(filesFromBackend);

// Пример: Обработка переключения статуса 'Wanted' узла пользователем
const handleToggleWanted = (nodeToToggle: FileNode) => {
  const newWantedStatus = !nodeToToggle.Wanted;
  const idsToUpdate = collectFileIds(nodeToToggle); // Получаем ID затронутых файлов

  // Обновляем состояние дерева (предполагая, что 'fileTree' управляется состоянием React)
  const updatedTree = updateNodesWanted(fileTree, nodeToToggle, newWantedStatus, idsToUpdate);
  // setFileTree(updatedTree); // Обновляем состояние React

  // Отправляем обновленные ID файлов и их статус 'wanted' на бэкенд...
};
```

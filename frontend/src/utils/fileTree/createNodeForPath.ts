import { FileNode, TorrentFile } from "../../types/FileTree";

/**
 * Создает новый узел `FileNode` для дерева файлов на основе информации из `TorrentFile`.
 * Определяет, является ли узел файлом или директорией, и инициализирует соответствующие поля.
 *
 * @param {TorrentFile} file - Исходный объект файла торрента, содержащий данные (ID, Size, Progress, Wanted).
 * @param {string} partName - Имя текущей части пути (имя файла или директории).
 * @param {string} fullPath - Полный путь к создаваемому узлу.
 * @param {boolean} isFile - Флаг, указывающий, является ли создаваемый узел файлом (`true`) или директорией (`false`).
 * @returns {FileNode} Новый объект узла дерева файлов с инициализированными свойствами.
 *                     Для директорий `ID` устанавливается в -1, `Size` и `Progress` в 0, `Wanted` в `false`, `children` в пустой массив, `expanded` в `false`.
 *                     Для файлов используются значения из `file`, `children` устанавливается в `undefined`.
 */
export const createNodeForPath = (
  file: TorrentFile,
  partName: string,
  fullPath: string,
  isFile: boolean
): FileNode => {
  return {
    ID: isFile ? file.ID : -1,
    Name: partName,
    Path: fullPath,
    Size: isFile ? file.Size : 0,
    Progress: isFile ? file.Progress : 0,
    Wanted: isFile ? file.Wanted : false, // Директории по умолчанию не выбраны
    isDirectory: !isFile,
    children: !isFile ? [] : undefined,
    expanded: false, // Директории по умолчанию свернуты
  };
};

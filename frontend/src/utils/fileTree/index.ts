/**
 * Этот модуль предоставляет утилиты для работы с древовидной структурой файлов торрента.
 * Он включает функции для построения дерева, вычисления статистики директорий,
 * форматирования размера файлов и манипулирования состоянием выбора файлов (`Wanted`).
 */

// Реэкспорт типов, используемых утилитами
export type { FileNode, TorrentFile, DirStats } from "../../types/FileTree";

// Реэкспорт функций утилит
export { addNodeToParent } from "./addNodeToParent";
export { buildFileTree } from "./buildFileTree";
export { calculateDirStats } from "./calculateDirStats";
export { collectFileIds } from "./collectFileIds";
export { createNodeForPath } from "./createNodeForPath";
export { formatFileSize } from "./formatFileSize";
export { updateNodesWanted } from "./updateNodesWanted";

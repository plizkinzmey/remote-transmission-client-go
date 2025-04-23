import { useState, useCallback } from "react";

/**
 * Хук для управления состоянием выбора торрентов в списке.
 */
export function useTorrentSelection() {
  const [selectedTorrents, setSelectedTorrents] = useState<Set<number>>(
    new Set()
  );

  const handleTorrentSelect = useCallback((id: number) => {
    setSelectedTorrents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((torrentsWithId: { ID: number }[]) => {
    setSelectedTorrents((prev) => {
      if (prev.size === torrentsWithId.length && torrentsWithId.length > 0) {
        // Если все видимые выбраны - снимаем выделение
        return new Set();
      } else {
        // Иначе выбираем все видимые
        return new Set(torrentsWithId.map((t) => t.ID));
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTorrents(new Set());
  }, []);

  const hasSelectedTorrents = selectedTorrents.size > 0;

  return {
    selectedTorrents,
    hasSelectedTorrents,
    handleTorrentSelect,
    handleSelectAll,
    clearSelection, // Добавлено для сброса выделения при необходимости
  };
}

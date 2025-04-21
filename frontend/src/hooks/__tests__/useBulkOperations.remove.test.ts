import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");
import { useBulkOperations } from "../useBulkOperations"; // Импортируем хук ПОСЛЕ моков
import {
  mockTorrentsBase,
  mockConfig,
  setupMocks,
  mockRemoveTorrent, // Импортируем нужный мок
  mockUseLocalization, // Импортируем для проверки t()
} from "./mocks/useBulkOperations.mocks"; // Импорт общих моков

describe("useBulkOperations - handleRemoveSelected", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks(); // Используем общую функцию настройки
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not remove if already removing", async () => {
    // ...existing code...
  });

  it("should not remove if no torrents selected", async () => {
    // ...existing code...
  });

  it("should call RemoveTorrent for each selected ID without deleting data", async () => {
    // ...existing code...
  });

  it("should call RemoveTorrent for each selected ID with deleting data", async () => {
    // ...existing code...
  });

  it("should set error on RemoveTorrent failure but continue", async () => {
    // ...existing code...
  });

  it("should reset remove flag even if some removals fail", async () => {
    // ...existing code...
  });

  it("should continue removing other torrents if one RemoveTorrent call fails", async () => {
    const selected = new Set([1, 2]); // Выбираем два торрента
    const errorId = 1;
    const successId = 2;
    const errorMessage = "Failed to remove T1";

    // Мокируем ошибку только для первого ID
    mockRemoveTorrent.mockImplementation(async (id: number) => {
      if (id === errorId) {
        throw new Error(errorMessage);
      }
      return Promise.resolve(); // Успех для остальных
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {}); // Подавляем вывод ошибки в консоль

    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase, // Не важно для этого теста
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleRemoveSelected(false);
    });

    // Проверяем, что RemoveTorrent был вызван для обоих ID
    expect(mockRemoveTorrent).toHaveBeenCalledWith(errorId, false);
    expect(mockRemoveTorrent).toHaveBeenCalledWith(successId, false);
    expect(mockRemoveTorrent).toHaveBeenCalledTimes(2);

    // Проверяем, что ошибка была залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Failed to remove torrent ${errorId}:`,
      expect.any(Error)
    );

    // Проверяем, что refreshTorrents был вызван после цикла
    expect(mockRefreshTorrents).toHaveBeenCalledTimes(1);

    // Проверяем, что флаг сброшен в finally
    expect(result.current.bulkOperations.remove).toBe(false);
    // Ошибка уровня хука не должна устанавливаться для ошибки внутри цикла
    expect(result.current.error).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it("should set error if refreshTorrents fails after successful removals", async () => {
    const selected = new Set([1]);
    const refreshError = "Refresh failed";
    mockRemoveTorrent.mockResolvedValue(undefined); // Удаление успешно
    mockRefreshTorrents.mockRejectedValue(new Error(refreshError)); // Ошибка при обновлении
    const mockT = vi.fn((key) => key); // Мокируем функцию t
    mockUseLocalization.mockReturnValue({ t: mockT });

    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleRemoveSelected(false);
    });

    // Проверяем вызовы
    expect(mockRemoveTorrent).toHaveBeenCalledWith(1, false);
    expect(mockRefreshTorrents).toHaveBeenCalledTimes(1);

    // Проверяем установку ошибки из внешнего catch
    expect(result.current.error).toContain("errors.failedToRemoveTorrents");
    expect(mockT).toHaveBeenCalledWith(
      "errors.failedToRemoveTorrents",
      expect.stringContaining(refreshError)
    );

    // Проверяем сброс флага в finally
    expect(result.current.bulkOperations.remove).toBe(false);
  });
});

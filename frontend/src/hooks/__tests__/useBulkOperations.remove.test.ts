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
});

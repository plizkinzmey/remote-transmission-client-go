import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TorrentData } from "@/components/TorrentList";
// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");
import { useBulkOperations } from "../useBulkOperations"; // Импортируем хук ПОСЛЕ моков
import {
  mockTorrentsBase,
  mockConfig,
  setupMocks,
  mockStopTorrents, // Импортируем нужный мок
} from "./mocks/useBulkOperations.mocks"; // Импорт общих моков

describe("useBulkOperations - handleStopSelected", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks(); // Используем общую функцию настройки
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not stop if already stopping", async () => {
    // ...existing code...
  });

  it("should not stop if no torrents selected", async () => {
    // ...existing code...
  });

  it("should not stop if no selected torrents are running", async () => {
    // ...existing code...
  });

  it("should call StopTorrents with correct IDs and refresh", async () => {
    // ...existing code...
  });

  it("should set error and reset state on StopTorrents failure", async () => {
    // ...existing code...
  });
});

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
  mockStartTorrents,
} from "./mocks/useBulkOperations.mocks";

describe("useBulkOperations - handleStartSelected", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks();
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not start if already starting", async () => {
    // ...existing code...
  });

  it("should not start if no torrents selected", async () => {
    // ...existing code...
  });

  it("should not start if no selected torrents are stopped or completed", async () => {
    // ...existing code...
  });

  it("should call StartTorrents with correct IDs and refresh", async () => {
    // ...existing code...
  });

  it("should set error and reset state on StartTorrents failure", async () => {
    // ...existing code...
  });
});

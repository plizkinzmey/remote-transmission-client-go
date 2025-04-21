import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook } from "@testing-library/react";
// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");
import { useBulkOperations } from "../useBulkOperations"; // Импортируем хук ПОСЛЕ моков
import { mockConfig, setupMocks } from "./mocks/useBulkOperations.mocks";

describe("useBulkOperations - Initial State", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks();
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      useBulkOperations(
        [], // initial torrents
        new Set<number>(), // initial selected torrents
        mockRefreshTorrents,
        mockConfig
      )
    );

    expect(result.current.bulkOperations).toEqual({
      start: false,
      stop: false,
      remove: false,
      speedLimit: false,
    });
    expect(result.current.error).toBeNull();
  });
});

import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePathsManagement } from "../usePathsManagement";

// Общие моки Wails и локализации
const mockGetDownloadPaths = vi.fn();
const mockGetDefaultDownloadDir = vi.fn();
const mockValidateDownloadPath = vi.fn();
const mockSavePathsChanges = vi.fn();
const mockGetPathsState = vi.fn();
const mockT = vi.fn((key) => key);

vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({ t: mockT }),
}));
vi.mock("../../../../../../wailsjs/go/main/App", () => ({
  GetDownloadPaths: () => mockGetDownloadPaths(),
  GetDefaultDownloadDir: () => mockGetDefaultDownloadDir(),
  ValidateDownloadPath: (path: string) => mockValidateDownloadPath(path),
  SavePathsChanges: (a: string[], b: string[], c: string) =>
    mockSavePathsChanges(a, b, c),
  GetPathsState: () => mockGetPathsState(),
}));

describe("usePathsManagement - Loading", () => {
  const initialPaths = ["/downloads/movies", "/downloads/music"];
  const initialDefault = "/downloads";
  const systemDefault = "/downloads";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDefaultDownloadDir.mockResolvedValue(systemDefault);
    mockGetDownloadPaths.mockResolvedValue(initialPaths);
    mockValidateDownloadPath.mockResolvedValue(undefined);
    mockSavePathsChanges.mockResolvedValue(undefined);
    mockGetPathsState.mockResolvedValue({
      paths: initialPaths,
      defaultPath: initialDefault,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("инициализируется и загружает пути", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});
    expect(mockGetDefaultDownloadDir).toHaveBeenCalledTimes(1);
    expect(mockGetDownloadPaths).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("обрабатывает ошибку загрузки", async () => {
    const error = new Error("fail");
    mockGetDownloadPaths.mockRejectedValue(error);
    console.error = vi.fn();
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});
    expect(result.current.paths).toEqual([]);
    expect(result.current.defaultPath).toBe("");
    expect(console.error).toHaveBeenCalled();
  });
});

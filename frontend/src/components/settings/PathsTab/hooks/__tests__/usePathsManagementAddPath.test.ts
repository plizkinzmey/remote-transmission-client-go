import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePathsManagement } from "../usePathsManagement";

// Моки Wails и локализации
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

describe("usePathsManagement - Add Path", () => {
  const initialPaths = ["/downloads/movies", "/downloads/music"];
  const initialDefault = "/downloads";
  const systemDefault = "/downloads";

  beforeEach(async () => {
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

  it("должен добавить новый валидный путь", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const newPath = "/new/path";
    act(() => result.current.setNewPathValue(newPath));
    await act(async () => result.current.handleAddPath());

    expect(mockValidateDownloadPath).toHaveBeenCalledWith(newPath);
    expect(result.current.paths).toContain(newPath);
    expect(result.current.getPathChanges().pathsToAdd).toEqual([newPath]);
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
  });

  it("не должен добавлять дубликат пути", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const dup = initialPaths[0];
    act(() => result.current.setNewPathValue(dup));
    // Используем фейковые таймеры перед вызовом handleAddPath
    vi.useFakeTimers();
    await act(async () => result.current.handleAddPath());

    expect(mockValidateDownloadPath).not.toHaveBeenCalled();
    expect(result.current.isDuplicatePath).toBe(true);
    expect(result.current.showDuplicateTooltip).toBe(true);
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
    expect(onPathsChanged).toHaveBeenCalledWith(false);
    // сброс тултипа по истечении времени
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.showDuplicateTooltip).toBe(false);
    vi.useRealTimers();
  });

  it("не должен добавлять невалидный путь", async () => {
    mockValidateDownloadPath.mockRejectedValue(new Error("Bad"));
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const bad = "/bad";
    act(() => result.current.setNewPathValue(bad));
    await act(async () => result.current.handleAddPath());

    expect(mockValidateDownloadPath).toHaveBeenCalledWith(bad);
    expect(result.current.pathError).toBe("Bad");
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
  });
});

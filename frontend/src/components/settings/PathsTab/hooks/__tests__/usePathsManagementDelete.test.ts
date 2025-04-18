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

describe("usePathsManagement - Delete Path", () => {
  const initialPaths = ["/a", "/b"];
  const initialDefault = "/a";
  const systemDefault = "/a";

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

  it("должен установить запрос на удаление и отменить его", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => result.current.handleDeletePathRequest(initialPaths[0]));
    expect(result.current.pathWithConfirmDelete).toBe(initialPaths[0]);

    act(() => result.current.cancelDelete());
    expect(result.current.pathWithConfirmDelete).toBeNull();
  });

  it("должен подтвердить удаление существующего пути", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const toRemove = initialPaths[0];
    act(() => result.current.handleDeletePathRequest(toRemove));
    await act(async () => result.current.handleConfirmInlineDelete(toRemove));

    expect(result.current.paths).toEqual([initialPaths[1]]);
    expect(result.current.getPathChanges().pathsToRemove).toEqual([toRemove]);
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
  });

  it("должен отменить добавленный путь при удалении до сохранения", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const newPath = "/new";
    act(() => result.current.setNewPathValue(newPath));
    await act(async () => result.current.handleAddPath());
    expect(result.current.getPathChanges().pathsToAdd).toEqual([newPath]);

    act(() => result.current.handleDeletePathRequest(newPath));
    await act(async () => result.current.handleConfirmInlineDelete(newPath));

    expect(result.current.paths).toEqual(initialPaths);
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
    expect(result.current.getPathChanges().pathsToRemove).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(onPathsChanged).toHaveBeenCalledWith(false);
  });
});

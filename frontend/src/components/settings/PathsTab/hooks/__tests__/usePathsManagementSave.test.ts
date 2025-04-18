import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
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
  ValidateDownloadPath: (p: string) => mockValidateDownloadPath(p),
  SavePathsChanges: (a: string[], b: string[], c: string) =>
    mockSavePathsChanges(a, b, c),
  GetPathsState: () => mockGetPathsState(),
}));

describe("usePathsManagement - Save Changes", () => {
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

  it("должен успешно сохранить изменения", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const toAdd = "/new/path";
    const toRemove = initialPaths[0];
    const newDef = initialPaths[1];

    // Стадирование изменений
    act(() => result.current.setNewPathValue(toAdd));
    await act(async () => result.current.handleAddPath());
    act(() => result.current.handleDeletePathRequest(toRemove));
    await act(async () => result.current.handleConfirmInlineDelete(toRemove));
    act(() => result.current.handleSetDefaultPath(newDef));

    // Подготовка состояния после сохранения
    const finalPaths = [initialPaths[1], toAdd];
    mockGetPathsState.mockResolvedValue({
      paths: finalPaths,
      defaultPath: newDef,
    });

    await act(async () => {
      await result.current.saveChanges();
    });

    expect(mockSavePathsChanges).toHaveBeenCalledWith(
      [toAdd],
      [toRemove],
      newDef
    );
    expect(mockGetPathsState).toHaveBeenCalled();
    expect(result.current.paths).toEqual(finalPaths);
    expect(result.current.defaultPath).toBe(newDef);
    expect(result.current.hasChanges).toBe(false);
    expect(onPathsChanged).toHaveBeenLastCalledWith(false);
  });

  it("обрабатывает ошибку при сохранении", async () => {
    const saveError = new Error("Fail save");
    mockSavePathsChanges.mockRejectedValue(saveError);
    console.error = vi.fn();

    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    // Стадирование
    act(() => result.current.setNewPathValue("/err"));
    await act(async () => result.current.handleAddPath());
    expect(result.current.hasChanges).toBe(true);

    // Попытка сохранить
    await expect(
      act(async () => {
        await result.current.saveChanges();
      })
    ).rejects.toThrow("Fail save");

    expect(mockSavePathsChanges).toHaveBeenCalled();
    expect(mockGetPathsState).not.toHaveBeenCalled();
    expect(result.current.hasChanges).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      "Hook: Ошибка при сохранении изменений путей:",
      saveError
    );
  });
});

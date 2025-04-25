import { renderHook, act } from "@testing-library/react";
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  MockInstance,
} from "vitest";
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
  let consoleErrorMock: MockInstance; // For console.error
  let consoleLogMock: MockInstance; // For console.log

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock console methods globally for the describe block
    consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleLogMock = vi.spyOn(console, "log").mockImplementation(() => {});

    mockGetDefaultDownloadDir.mockResolvedValue(systemDefault);
    mockGetDownloadPaths.mockResolvedValue([...initialPaths]); // Use spread to avoid mutation issues
    mockValidateDownloadPath.mockResolvedValue(undefined); // Corrected mock setup
    mockSavePathsChanges.mockResolvedValue(undefined);
    mockGetPathsState.mockResolvedValue({
      paths: initialPaths,
      defaultPath: initialDefault,
    });
  });

  // Restore console mocks
  afterEach(() => {
    consoleErrorMock.mockRestore();
    consoleLogMock.mockRestore();
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

  it("обрабатывает ошибку при сохранении (ошибка SavePathsChanges)", async () => {
    const saveError = new Error("Fail save");
    mockSavePathsChanges.mockRejectedValue(saveError);

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
    expect(result.current.isLoading).toBe(false); // Загрузка должна завершиться
    expect(result.current.hasChanges).toBe(true);
    expect(consoleErrorMock).toHaveBeenCalledWith(
      // Check the global mock
      "Hook: Ошибка при сохранении изменений путей:",
      saveError
    );
  });

  // Падающий тест (переименован для ясности)
  it("обрабатывает ошибку при получении состояния после сохранения (GetPathsState returns null)", async () => {
    // Локальный spy не нужен, используем глобальный consoleErrorMock

    mockSavePathsChanges.mockResolvedValue(undefined);
    mockGetPathsState.mockResolvedValue(null); // Simulate backend returning null

    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => result.current.setNewPathValue("/new"));
    await act(async () => result.current.handleAddPath());

    await expect(
      act(async () => {
        await result.current.saveChanges();
      })
    ).rejects.toThrow("Hook: Failed to get paths state after save");

    expect(mockSavePathsChanges).toHaveBeenCalled();
    expect(mockGetPathsState).toHaveBeenCalled();
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Не проверяем вызов console.error
  });

  // Новый тест: GetPathsState отклоняет промис
  it("обрабатывает ошибку при получении состояния после сохранения (GetPathsState REJECTS)", async () => {
    // Локальный spy не нужен, используем глобальный consoleErrorMock

    const getPathsStateError = new Error("Backend GetPathsState failed");
    mockSavePathsChanges.mockResolvedValue(undefined); // Save succeeds
    mockGetPathsState.mockRejectedValue(getPathsStateError); // GetPathsState fails

    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => result.current.setNewPathValue("/new-reject"));
    await act(async () => result.current.handleAddPath());
    expect(result.current.hasChanges).toBe(true);

    // Ожидаем ошибку, которую вернул GetPathsState
    await expect(
      act(async () => {
        await result.current.saveChanges();
      })
    ).rejects.toThrow("Backend GetPathsState failed");

    expect(mockSavePathsChanges).toHaveBeenCalled();
    expect(mockGetPathsState).toHaveBeenCalled();
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Не проверяем вызов console.error
  });

  it("должен сбросить все изменения к начальному состоянию", async () => {
    const onPathsChanged = vi.fn();

    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );

    // Ждем завершения начальной загрузки
    await act(async () => {
      rerender();
    });
    await act(async () => {}); // Дополнительный тик для useEffect

    expect(result.current.isLoading).toBe(false);
    expect(result.current.paths).toEqual(initialPaths);
    expect(result.current.defaultPath).toBe(initialDefault);

    // Вносим изменения
    const newPathToAdd = "/c";
    const pathToRemove = initialPaths[0]; // "/downloads/movies"
    const newDefaultPath = initialPaths[1]; // "/downloads/music"

    act(() => result.current.setNewPathValue(newPathToAdd));
    await act(async () => result.current.handleAddPath());
    act(() => result.current.handleDeletePathRequest(pathToRemove));
    await act(async () =>
      result.current.handleConfirmInlineDelete(pathToRemove)
    );
    act(() => result.current.handleSetDefaultPath(newDefaultPath));

    // Проверяем, что изменения есть
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
    // Установим также ошибку и запрос на удаление для проверки их сброса
    act(() => result.current.setNewPathValue("invalid path"));
    act(() => {
      result.current.pathError = "Some error";
    }); // Имитируем ошибку
    act(() => result.current.handleDeletePathRequest(newDefaultPath)); // Имитируем запрос на удаление

    // Выполняем сброс
    act(() => result.current.resetChanges());

    // Проверяем, что все вернулось к исходному состоянию
    expect(result.current.paths).toEqual(initialPaths);
    expect(result.current.defaultPath).toBe(initialDefault);
    expect(result.current.newPath).toBe("");
    expect(result.current.pathError).toBe("");
    expect(result.current.pathWithConfirmDelete).toBeNull();
    expect(result.current.isDuplicatePath).toBe(false);
    expect(result.current.showDuplicateTooltip).toBe(false);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.getPathChanges()).toEqual({
      pathsToAdd: [],
      pathsToRemove: [],
      defaultPath: null,
    });
    expect(onPathsChanged).toHaveBeenLastCalledWith(false);
    expect(consoleLogMock).toHaveBeenCalledWith(
      // Check the global mock
      "Hook: Изменения сброшены к начальному состоянию"
    );
  });

  it("не должен изменять состояние, если пытаться установить текущий default path снова", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );

    // Wait for initial load and the first call to onPathsChanged(false)
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    // Check that onPathsChanged was called exactly once during initialization
    expect(onPathsChanged).toHaveBeenCalledTimes(1);
    expect(onPathsChanged).toHaveBeenLastCalledWith(false);

    const currentDefault = result.current.defaultPath;
    const initialPendingChanges = result.current.getPathChanges();

    // Attempt to set the current default path again
    act(() => result.current.handleSetDefaultPath(currentDefault));

    // Verify state hasn't changed and onPathsChanged wasn't called again
    expect(result.current.defaultPath).toBe(currentDefault);
    expect(result.current.getPathChanges()).toEqual(initialPendingChanges);
    expect(result.current.hasChanges).toBe(false);
    // Ensure onPathsChanged was not called again after the action
    expect(onPathsChanged).toHaveBeenCalledTimes(1); // <<<< CORRECTED CHECK
    expect(consoleLogMock).toHaveBeenCalledWith(
      "Hook: Нельзя снять статус пути по умолчанию, выберите другой путь по умолчанию"
    );
  });
});

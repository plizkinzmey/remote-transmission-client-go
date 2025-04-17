import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePathsManagement } from "../usePathsManagement";

// Mock Wails functions
const mockGetDownloadPaths = vi.fn();
const mockGetDefaultDownloadDir = vi.fn();
const mockValidateDownloadPath = vi.fn();
const mockSavePathsChanges = vi.fn();
const mockGetPathsState = vi.fn();

// Mock Localization context
const mockT = vi.fn((key) => key); // Simple mock for translation
vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({ t: mockT }),
}));

// Mock Wails backend module
vi.mock("../../../../wailsjs/go/main/App", () => ({
  GetDownloadPaths: () => mockGetDownloadPaths(),
  GetDefaultDownloadDir: () => mockGetDefaultDownloadDir(),
  ValidateDownloadPath: (path: string) => mockValidateDownloadPath(path),
  SavePathsChanges: (
    pathsToAdd: string[],
    pathsToRemove: string[],
    defaultPath: string
  ) => mockSavePathsChanges(pathsToAdd, pathsToRemove, defaultPath),
  GetPathsState: () => mockGetPathsState(),
}));

describe("usePathsManagement Hook", () => {
  const initialPaths = ["/downloads/movies", "/downloads/music"];
  const initialDefaultPath = "/downloads";
  const systemDefaultPath = "/downloads"; // Assume system default is the initial one

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Default successful mock implementations
    mockGetDefaultDownloadDir.mockResolvedValue(systemDefaultPath);
    mockGetDownloadPaths.mockResolvedValue(initialPaths);
    mockValidateDownloadPath.mockResolvedValue(undefined); // Resolves successfully
    mockSavePathsChanges.mockResolvedValue(undefined);
    mockGetPathsState.mockResolvedValue({
      paths: initialPaths,
      defaultPath: initialDefaultPath,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize correctly and load paths", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));

    expect(result.current.isLoading).toBe(true);

    // Wait for async operations in useEffect to complete
    await act(async () => {
      rerender(); // Trigger update after promises resolve
    });
    // Need another act to wait for state updates triggered by the resolved promises
    await act(async () => {});

    expect(mockGetDefaultDownloadDir).toHaveBeenCalledTimes(1);
    expect(mockGetDownloadPaths).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.paths).toEqual(initialPaths);
    expect(result.current.defaultPath).toEqual(systemDefaultPath);
    expect(result.current.hasChanges).toBe(false);
  });

  it("should handle loading error", async () => {
    const loadError = new Error("Failed to load");
    mockGetDownloadPaths.mockRejectedValue(loadError);
    console.error = vi.fn(); // Suppress console error

    const { result, rerender } = renderHook(() => usePathsManagement({}));

    await act(async () => {
      rerender();
    });
    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.paths).toEqual([]); // Should be empty on error
    expect(result.current.defaultPath).toEqual(""); // Should be empty on error
    expect(console.error).toHaveBeenCalledWith(
      "Hook: Failed to load paths:",
      loadError
    );
  });

  it("should validate a new path successfully", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    }); // Initial load
    await act(async () => {});

    act(() => {
      result.current.setNewPathValue("/new/valid/path");
    });

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateNewPath();
    });

    expect(mockValidateDownloadPath).toHaveBeenCalledWith("/new/valid/path");
    expect(isValid).toBe(true);
    expect(result.current.pathError).toBe("");
  });

  it("should handle validation error for a new path", async () => {
    const validationError = new Error("Invalid path specified");
    mockValidateDownloadPath.mockRejectedValue(validationError);
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => {
      result.current.setNewPathValue("/invalid/path");
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateNewPath();
    });

    expect(mockValidateDownloadPath).toHaveBeenCalledWith("/invalid/path");
    expect(isValid).toBe(false);
    // Check if "Error: " prefix is removed
    expect(result.current.pathError).toBe("Invalid path specified");
  });

  it("should handle validation for an empty path", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => {
      result.current.setNewPathValue(" "); // Empty or whitespace
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateNewPath();
    });

    expect(mockValidateDownloadPath).not.toHaveBeenCalled();
    expect(isValid).toBe(false);
    expect(result.current.pathError).toBe("settings.pathRequired");
    expect(mockT).toHaveBeenCalledWith("settings.pathRequired");
  });

  it("should add a new valid path", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const newPathToAdd = "/new/downloads";
    act(() => {
      result.current.setNewPathValue(newPathToAdd);
    });

    await act(async () => {
      await result.current.handleAddPath();
    });

    expect(mockValidateDownloadPath).toHaveBeenCalledWith(newPathToAdd);
    expect(result.current.paths).toContain(newPathToAdd);
    // Should be added after default path
    expect(result.current.paths).toEqual([
      initialDefaultPath,
      newPathToAdd,
      ...initialPaths,
    ]);
    expect(result.current.newPath).toBe("");
    expect(result.current.getPathChanges().pathsToAdd).toEqual([newPathToAdd]);
    expect(result.current.getPathChanges().pathsToRemove).toEqual([]);
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
  });

  it("should not add a duplicate path", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const duplicatePath = initialPaths[0]; // Already exists
    act(() => {
      result.current.setNewPathValue(duplicatePath);
    });

    await act(async () => {
      await result.current.handleAddPath();
    });

    expect(mockValidateDownloadPath).not.toHaveBeenCalled();
    expect(result.current.paths).toEqual(initialPaths);
    expect(result.current.isDuplicatePath).toBe(true);
    expect(result.current.showDuplicateTooltip).toBe(true);
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
    expect(onPathsChanged).toHaveBeenCalledWith(false); // No actual change yet

    // Test tooltip timeout (using fake timers)
    vi.useFakeTimers();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.showDuplicateTooltip).toBe(false);
    vi.useRealTimers();
  });

  it("should not add an invalid path", async () => {
    mockValidateDownloadPath.mockRejectedValue(new Error("Validation failed"));
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const invalidPath = "/invalid";
    act(() => {
      result.current.setNewPathValue(invalidPath);
    });

    await act(async () => {
      await result.current.handleAddPath();
    });

    expect(mockValidateDownloadPath).toHaveBeenCalledWith(invalidPath);
    expect(result.current.paths).toEqual(initialPaths);
    expect(result.current.pathError).toBe("Validation failed");
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
    expect(result.current.hasChanges).toBe(false);
  });

  it("should handle delete request and cancel", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const pathToDelete = initialPaths[0];
    act(() => {
      result.current.handleDeletePathRequest(pathToDelete);
    });
    expect(result.current.pathWithConfirmDelete).toBe(pathToDelete);

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.pathWithConfirmDelete).toBeNull();
  });

  it("should confirm and stage deletion of an existing path", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const pathToDelete = initialPaths[0];
    act(() => {
      result.current.handleDeletePathRequest(pathToDelete);
    });

    await act(async () => {
      await result.current.handleConfirmInlineDelete(pathToDelete);
    });

    expect(result.current.paths).not.toContain(pathToDelete);
    expect(result.current.paths).toEqual([initialPaths[1]]);
    expect(result.current.pathWithConfirmDelete).toBeNull();
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
    expect(result.current.getPathChanges().pathsToRemove).toEqual([
      pathToDelete,
    ]);
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
  });

  it("should handle deleting a path that was just added (cancel add)", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const newPathToAdd = "/newly/added";
    // Add the path first
    act(() => {
      result.current.setNewPathValue(newPathToAdd);
    });
    await act(async () => {
      await result.current.handleAddPath();
    });

    expect(result.current.paths).toContain(newPathToAdd);
    expect(result.current.getPathChanges().pathsToAdd).toEqual([newPathToAdd]);
    expect(result.current.hasChanges).toBe(true);
    onPathsChanged.mockClear(); // Clear previous call

    // Now delete the newly added path before saving
    act(() => {
      result.current.handleDeletePathRequest(newPathToAdd);
    });
    await act(async () => {
      await result.current.handleConfirmInlineDelete(newPathToAdd);
    });

    expect(result.current.paths).not.toContain(newPathToAdd);
    expect(result.current.paths).toEqual(initialPaths); // Back to original
    expect(result.current.pathWithConfirmDelete).toBeNull();
    // Should be removed from pathsToAdd, not added to pathsToRemove
    expect(result.current.getPathChanges().pathsToAdd).toEqual([]);
    expect(result.current.getPathChanges().pathsToRemove).toEqual([]);
    expect(result.current.hasChanges).toBe(false); // No net change
    expect(onPathsChanged).toHaveBeenCalledWith(false);
  });

  it("should set a new default path", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const newDefaultPath = initialPaths[1];
    act(() => {
      result.current.handleSetDefaultPath(newDefaultPath);
    });

    expect(result.current.defaultPath).toBe(newDefaultPath);
    expect(result.current.getPathChanges().defaultPath).toBe(newDefaultPath);
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
  });

  it("should not change state if setting the same default path", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const currentDefault = result.current.defaultPath;
    act(() => {
      result.current.handleSetDefaultPath(currentDefault);
    });

    expect(result.current.defaultPath).toBe(currentDefault);
    expect(result.current.getPathChanges().defaultPath).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    // onPathsChanged might have been called initially, so clear and check again
    onPathsChanged.mockClear();
    act(() => {
      result.current.handleSetDefaultPath(currentDefault);
    });
    expect(onPathsChanged).not.toHaveBeenCalled();
  });

  it("should reset pending default path if set back to initial", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const originalDefault = result.current.defaultPath;
    const newDefaultPath = initialPaths[1];

    // Set a new default
    act(() => {
      result.current.handleSetDefaultPath(newDefaultPath);
    });
    expect(result.current.getPathChanges().defaultPath).toBe(newDefaultPath);
    expect(result.current.hasChanges).toBe(true);
    onPathsChanged.mockClear();

    // Set back to the original default
    act(() => {
      result.current.handleSetDefaultPath(originalDefault);
    });

    expect(result.current.defaultPath).toBe(originalDefault);
    expect(result.current.getPathChanges().defaultPath).toBeNull(); // Pending change cleared
    expect(result.current.hasChanges).toBe(false); // Assuming no other changes
    expect(onPathsChanged).toHaveBeenCalledWith(false);
  });

  it("should save changes successfully", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const pathToAdd = "/new/path";
    const pathToRemove = initialPaths[0];
    const newDefault = initialPaths[1];

    // Stage changes
    act(() => result.current.setNewPathValue(pathToAdd));
    await act(async () => result.current.handleAddPath());
    act(() => result.current.handleDeletePathRequest(pathToRemove));
    await act(async () =>
      result.current.handleConfirmInlineDelete(pathToRemove)
    );
    act(() => result.current.handleSetDefaultPath(newDefault));

    expect(result.current.hasChanges).toBe(true);
    const changes = result.current.getPathChanges();
    expect(changes.pathsToAdd).toEqual([pathToAdd]);
    expect(changes.pathsToRemove).toEqual([pathToRemove]);
    expect(changes.defaultPath).toEqual(newDefault);

    // Prepare mock for GetPathsState after save
    const finalPaths = [initialPaths[1], pathToAdd]; // Removed [0], added new
    const finalDefault = newDefault;
    mockGetPathsState.mockResolvedValue({
      paths: finalPaths,
      defaultPath: finalDefault,
    });

    // Save
    await act(async () => {
      await result.current.saveChanges();
    });

    expect(mockSavePathsChanges).toHaveBeenCalledWith(
      [pathToAdd],
      [pathToRemove],
      newDefault
    );
    expect(mockGetPathsState).toHaveBeenCalledTimes(1); // Called after save

    // Check state after save
    expect(result.current.isLoading).toBe(false);
    expect(result.current.paths).toEqual(finalPaths);
    expect(result.current.defaultPath).toEqual(finalDefault);
    // Check if initial state is updated
    // (Need to access internal state or test via resetChanges)

    // Check if pending actions are cleared
    const finalChanges = result.current.getPathChanges();
    expect(finalChanges.pathsToAdd).toEqual([]);
    expect(finalChanges.pathsToRemove).toEqual([]);
    expect(finalChanges.defaultPath).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(onPathsChanged).toHaveBeenLastCalledWith(false);
  });

  it("should handle save error", async () => {
    const saveError = new Error("Failed to save");
    mockSavePathsChanges.mockRejectedValue(saveError);
    console.error = vi.fn(); // Suppress console error

    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    // Stage a change
    const pathToAdd = "/new/path";
    act(() => result.current.setNewPathValue(pathToAdd));
    await act(async () => result.current.handleAddPath());
    expect(result.current.hasChanges).toBe(true);

    // Attempt to save
    await expect(
      act(async () => {
        await result.current.saveChanges();
      })
    ).rejects.toThrow("Failed to save");

    expect(mockSavePathsChanges).toHaveBeenCalled();
    expect(mockGetPathsState).not.toHaveBeenCalled(); // Should not be called on save error
    expect(result.current.isLoading).toBe(false);
    // State should remain unchanged from before save attempt
    expect(result.current.paths).toContain(pathToAdd);
    expect(result.current.getPathChanges().pathsToAdd).toEqual([pathToAdd]);
    expect(result.current.hasChanges).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      "Hook: Ошибка при сохранении изменений путей:",
      saveError
    );
  });

  it("should reset changes", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const initialPathsSnapshot = [...result.current.paths];
    const initialDefaultPathSnapshot = result.current.defaultPath;

    // Stage changes
    const pathToAdd = "/new/path";
    const pathToRemove = initialPaths[0];
    const newDefault = initialPaths[1];
    act(() => result.current.setNewPathValue(pathToAdd));
    await act(async () => result.current.handleAddPath());
    act(() => result.current.handleDeletePathRequest(pathToRemove));
    await act(async () =>
      result.current.handleConfirmInlineDelete(pathToRemove)
    );
    act(() => result.current.handleSetDefaultPath(newDefault));

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.paths).not.toEqual(initialPathsSnapshot);
    expect(result.current.defaultPath).not.toEqual(initialDefaultPathSnapshot);
    expect(result.current.newPath).toBe(""); // Input cleared after add
    expect(result.current.pathError).toBe("");
    expect(result.current.pathWithConfirmDelete).toBeNull();
    expect(result.current.isDuplicatePath).toBe(false);
    expect(result.current.showDuplicateTooltip).toBe(false);

    // Reset
    act(() => {
      result.current.resetChanges();
    });

    // Check if state is back to initial
    expect(result.current.paths).toEqual(initialPathsSnapshot);
    expect(result.current.defaultPath).toEqual(initialDefaultPathSnapshot);
    expect(result.current.newPath).toBe("");
    expect(result.current.pathError).toBe("");
    expect(result.current.pathWithConfirmDelete).toBeNull();
    expect(result.current.isDuplicatePath).toBe(false);
    expect(result.current.showDuplicateTooltip).toBe(false);

    // Check if pending actions are cleared
    const finalChanges = result.current.getPathChanges();
    expect(finalChanges.pathsToAdd).toEqual([]);
    expect(finalChanges.pathsToRemove).toEqual([]);
    expect(finalChanges.defaultPath).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(onPathsChanged).toHaveBeenLastCalledWith(false);
  });
});

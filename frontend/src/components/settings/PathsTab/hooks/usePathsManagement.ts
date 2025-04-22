import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalization } from "@contexts/LocalizationContext"; // Use alias
import {
  GetPathsState,
  ValidateDownloadPath,
  SavePathsChanges,
  GetDefaultDownloadDir, // Add missing import
  GetDownloadPaths, // Add missing import
} from "@wailsjs/go/main/App"; // Use alias

/**
 * Props for the usePathsManagement hook.
 */
interface UsePathsManagementProps {
  /** Callback function invoked when the list of pending changes is updated. */
  onPathsChanged?: (hasChanges: boolean) => void;
}

/**
 * Return type of the usePathsManagement hook.
 */
interface UsePathsManagementReturn {
  /** Current list of download paths. */
  paths: string[];
  /** Current default download path. */
  defaultPath: string;
  /** Value of the new path input field. */
  newPath: string;
  /** Loading state. True if paths are currently being loaded or saved. */
  isLoading: boolean;
  /** Error message for the new path input field. */
  pathError: string;
  /** Path for which delete confirmation is currently active, or null. */
  pathWithConfirmDelete: string | null;
  /** Indicates if the entered new path is a duplicate. */
  isDuplicatePath: boolean;
  /** Controls the visibility of the duplicate path tooltip. */
  showDuplicateTooltip: boolean;
  /** Indicates if there are pending changes to be saved. */
  hasChanges: boolean;
  /** Function to update the value of the new path input. */
  setNewPathValue: (value: string) => void;
  /** Function to validate the current new path value. */
  validateNewPath: () => Promise<boolean>;
  /** Function to handle the request to add the new path. */
  handleAddPath: () => Promise<void>;
  /** Function to initiate the delete confirmation for a path. */
  handleDeletePathRequest: (path: string) => void;
  /** Function to confirm and handle the deletion of a path. */
  handleConfirmInlineDelete: (path: string) => Promise<void>;
  /** Function to cancel the delete confirmation. */
  cancelDelete: () => void;
  /** Function to set a path as the default download path. */
  handleSetDefaultPath: (path: string) => void;
  /** Function to save all pending changes. */
  saveChanges: () => Promise<void>;
  /** Function to discard all pending changes and reset to the initial state. */
  resetChanges: () => void;
  /** Function to get the current pending changes. */
  getPathChanges: () => {
    pathsToAdd: string[];
    pathsToRemove: string[];
    defaultPath: string | null;
  };
}

/**
 * @description Custom hook to manage download paths logic for the Settings PathsTab.
 * Handles loading, adding, removing, setting default path, validation, and saving changes.
 * @param {UsePathsManagementProps} props - Hook configuration.
 * @returns {UsePathsManagementReturn} - State and handlers for managing paths.
 */
export const usePathsManagement = ({
  onPathsChanged,
}: UsePathsManagementProps): UsePathsManagementReturn => {
  const { t } = useLocalization();
  const [paths, setPaths] = useState<string[]>([]);
  const [initialPaths, setInitialPaths] = useState<string[]>([]);
  const [initialDefaultPath, setInitialDefaultPath] = useState<string>("");
  const [defaultPath, setDefaultPath] = useState<string>("");
  const [newPath, setNewPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [pathError, setPathError] = useState<string>("");
  const [pathWithConfirmDelete, setPathWithConfirmDelete] = useState<
    string | null
  >(null);
  const [isDuplicatePath, setIsDuplicatePath] = useState<boolean>(false);
  const [showDuplicateTooltip, setShowDuplicateTooltip] =
    useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const [pendingActions, setPendingActions] = useState<{
    pathsToAdd: string[];
    pathsToRemove: string[];
    newDefaultPath: string | null;
  }>({
    pathsToAdd: [],
    pathsToRemove: [],
    newDefaultPath: null,
  });

  // Load initial paths and default directory
  useEffect(() => {
    const loadPaths = async () => {
      setIsLoading(true);
      try {
        console.log("Hook: Начало загрузки путей");
        const defaultDir = await GetDefaultDownloadDir();
        console.log("Hook: Получен системный путь по умолчанию:", defaultDir);

        const savedPaths = await GetDownloadPaths();
        console.log("Hook: Получены все сохраненные пути:", savedPaths);

        setPaths(savedPaths);
        setInitialPaths(savedPaths);
        setDefaultPath(defaultDir);
        setInitialDefaultPath(defaultDir);

        console.log(
          "Hook: Завершение загрузки путей - установлены в состояние:",
          {
            paths: savedPaths,
            defaultPath: defaultDir,
          }
        );
      } catch (error) {
        console.error("Hook: Failed to load paths:", error);
        // Handle error display if needed
      } finally {
        setIsLoading(false);
      }
    };

    loadPaths();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Notify parent about changes
  useEffect(() => {
    const currentHasChanges =
      pendingActions.pathsToAdd.length > 0 ||
      pendingActions.pathsToRemove.length > 0 ||
      pendingActions.newDefaultPath !== null;
    setHasChanges(currentHasChanges);
    if (onPathsChanged) {
      onPathsChanged(currentHasChanges);
    }
  }, [pendingActions, onPathsChanged]);

  // Validate path function
  const validateNewPath = useCallback(async (): Promise<boolean> => {
    // Не допускаем пустые или содержащие только пробелы пути
    if (!newPath || !newPath.trim()) {
      setPathError(t("settings.pathRequired"));
      return false;
    }

    try {
      await ValidateDownloadPath(newPath);
      setPathError("");
      return true;
    } catch (error) {
      // Remove "Error: " prefix for cleaner UI display
      setPathError(String(error).replace(/^Error:\s*/, ""));
      return false;
    }
  }, [newPath, t]);

  // Set new path value and clear errors
  const setNewPathValue = useCallback((value: string) => {
    setNewPath(value);
    setPathError("");
    setIsDuplicatePath(false);
    setShowDuplicateTooltip(false);
  }, []);

  // Add new path handler
  const handleAddPath = useCallback(async () => {
    if (paths.includes(newPath)) {
      setIsDuplicatePath(true);
      setShowDuplicateTooltip(true);
      setTimeout(() => {
        setShowDuplicateTooltip(false);
      }, 3000);
      return;
    }

    setIsDuplicatePath(false);
    setShowDuplicateTooltip(false);

    if (await validateNewPath()) {
      const updatedPaths = [...paths];
      const defaultPathIndex = updatedPaths.indexOf(defaultPath);

      if (defaultPathIndex !== -1) {
        updatedPaths.splice(defaultPathIndex + 1, 0, newPath);
      } else {
        updatedPaths.unshift(newPath);
      }

      setPaths(updatedPaths);

      const updatedToRemove = pendingActions.pathsToRemove.filter(
        (p) => p !== newPath
      );
      const updatedToAdd = !initialPaths.includes(newPath)
        ? [...pendingActions.pathsToAdd, newPath].filter(
            (p) => !updatedToRemove.includes(p)
          )
        : pendingActions.pathsToAdd;

      setPendingActions((prev) => ({
        ...prev,
        pathsToAdd: updatedToAdd,
        pathsToRemove: updatedToRemove,
      }));

      setNewPath(""); // Clear input field
    }
  }, [
    paths,
    newPath,
    validateNewPath,
    defaultPath,
    initialPaths,
    pendingActions.pathsToAdd,
    pendingActions.pathsToRemove,
  ]);

  // Request delete confirmation
  const handleDeletePathRequest = useCallback((path: string) => {
    setPathWithConfirmDelete(path);
  }, []);

  // Cancel delete confirmation
  const cancelDelete = useCallback(() => {
    setPathWithConfirmDelete(null);
  }, []);

  // Confirm and perform delete
  const handleConfirmInlineDelete = useCallback(
    async (path: string) => {
      setPaths((prevPaths) => prevPaths.filter((p) => p !== path));

      setPendingActions((prev) => {
        const updatedToAdd = prev.pathsToAdd.filter((p) => p !== path);
        const updatedToRemove = initialPaths.includes(path)
          ? [...prev.pathsToRemove, path]
          : prev.pathsToRemove;

        return {
          ...prev,
          pathsToAdd: updatedToAdd,
          pathsToRemove: updatedToRemove,
        };
      });

      setPathWithConfirmDelete(null);
    },
    [initialPaths]
  );

  // Set default path handler
  const handleSetDefaultPath = useCallback(
    (path: string) => {
      // Cannot unset the default path, only change it
      if (path === defaultPath) {
        console.log(
          "Hook: Нельзя снять статус пути по умолчанию, выберите другой путь по умолчанию"
        );
        return;
      }

      setDefaultPath(path);

      if (path !== initialDefaultPath) {
        setPendingActions((prev) => ({
          ...prev,
          newDefaultPath: path,
        }));
      } else {
        // If setting back to the original default, clear the pending change
        setPendingActions((prev) => ({
          ...prev,
          newDefaultPath: null,
        }));
      }
    },
    [defaultPath, initialDefaultPath]
  );

  // Save changes handler
  const saveChanges = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Hook: Начало сохранения изменений путей", {
        toAdd: pendingActions.pathsToAdd,
        toRemove: pendingActions.pathsToRemove,
        newDefault: pendingActions.newDefaultPath,
      });

      await SavePathsChanges(
        pendingActions.pathsToAdd,
        pendingActions.pathsToRemove,
        pendingActions.newDefaultPath || defaultPath // Send current default if no new one is pending
      );

      // Fetch the latest state after saving
      const pathsState = await GetPathsState();
      if (!pathsState) {
        throw new Error("Hook: Failed to get paths state after save");
      }
      console.log(
        "Hook: Получено новое состояние путей после сохранения:",
        pathsState
      );

      // Update local state with the confirmed state from backend
      setPaths(pathsState.paths);
      setInitialPaths(pathsState.paths);
      setDefaultPath(pathsState.defaultPath);
      setInitialDefaultPath(pathsState.defaultPath);

      // Reset pending actions
      setPendingActions({
        pathsToAdd: [],
        pathsToRemove: [],
        newDefaultPath: null,
      });

      console.log("Hook: Завершено сохранение путей:", {
        paths: pathsState.paths,
        defaultPath: pathsState.defaultPath,
      });
    } catch (error) {
      console.error("Hook: Ошибка при сохранении изменений путей:", error);
      // Propagate error to be handled by the component or parent
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pendingActions, defaultPath]); // Include defaultPath dependency

  // Reset changes handler
  const resetChanges = useCallback(() => {
    setPaths([...initialPaths]);
    setDefaultPath(initialDefaultPath);
    setNewPath("");
    setPathError("");
    setPathWithConfirmDelete(null);
    setIsDuplicatePath(false);
    setShowDuplicateTooltip(false);
    setPendingActions({
      pathsToAdd: [],
      pathsToRemove: [],
      newDefaultPath: null,
    });
    console.log("Hook: Изменения сброшены к начальному состоянию");
  }, [initialPaths, initialDefaultPath]);

  // Get pending changes
  const getPathChanges = useCallback(
    () => ({
      pathsToAdd: pendingActions.pathsToAdd,
      pathsToRemove: pendingActions.pathsToRemove,
      defaultPath: pendingActions.newDefaultPath,
    }),
    [pendingActions]
  );

  return {
    paths,
    defaultPath,
    newPath,
    isLoading,
    pathError,
    pathWithConfirmDelete,
    isDuplicatePath,
    showDuplicateTooltip,
    hasChanges,
    setNewPathValue,
    validateNewPath,
    handleAddPath,
    handleDeletePathRequest,
    handleConfirmInlineDelete,
    cancelDelete,
    handleSetDefaultPath,
    saveChanges,
    resetChanges,
    getPathChanges,
  };
};

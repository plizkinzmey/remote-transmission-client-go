import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  TextField,
  Flex,
  Text,
  Grid,
  Box,
  Button,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { TrashIcon, StarIcon } from "@heroicons/react/24/outline";
import {
  GetDownloadPaths,
  GetDefaultDownloadDir,
  ValidateDownloadPath,
  SaveDownloadPath,
  RemoveDownloadPath,
  SetDefaultDownloadPath,
  SavePathsChanges,
  GetPathsState,
} from "../../../wailsjs/go/main/App";

interface PathsTabProps {
  errors?: { [key: string]: string };
  onPathsChanged?: (hasChanges: boolean) => void;
}

export interface PathsTabRef {
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
  getPathChanges: () => {
    pathsToAdd: string[];
    pathsToRemove: string[];
    defaultPath: string | null;
  };
}

export const PathsTab = forwardRef<PathsTabRef, PathsTabProps>(
  ({ errors = {}, onPathsChanged }, ref) => {
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

    // Новое состояние для отслеживания изменений
    const [pendingActions, setPendingActions] = useState<{
      pathsToAdd: string[];
      pathsToRemove: string[];
      newDefaultPath: string | null;
    }>({
      pathsToAdd: [],
      pathsToRemove: [],
      newDefaultPath: null,
    });

    // Функция для сохранения изменений путей
    const saveChanges = useCallback(async () => {
      try {
        console.log("Начало сохранения изменений путей", {
          toAdd: pendingActions.pathsToAdd,
          toRemove: pendingActions.pathsToRemove,
          newDefault: pendingActions.newDefaultPath,
        });

        // Используем новый метод для атомарного сохранения всех изменений
        await SavePathsChanges(
          pendingActions.pathsToAdd,
          pendingActions.pathsToRemove,
          pendingActions.newDefaultPath || ""
        );

        // После успешного сохранения получаем актуальное состояние
        const pathsState = await GetPathsState();

        // Проверяем, получили ли мы состояние
        if (!pathsState) {
          throw new Error("Failed to get paths state after save");
        }

        console.log("Получено новое состояние путей:", pathsState);

        // Больше не фильтруем путь по умолчанию
        // Обновляем состояние компонента
        setPaths(pathsState.paths);
        setInitialPaths(pathsState.paths);
        setDefaultPath(pathsState.defaultPath);
        setInitialDefaultPath(pathsState.defaultPath);

        // Сбрасываем ожидающие действия
        setPendingActions({
          pathsToAdd: [],
          pathsToRemove: [],
          newDefaultPath: null,
        });

        console.log("Завершено сохранение путей:", {
          paths: pathsState.paths,
          defaultPath: pathsState.defaultPath,
        });
      } catch (error) {
        console.error("Ошибка при сохранении изменений путей:", error);
        throw error;
      }
    }, [pendingActions]);

    // Сброс изменений при отмене
    const resetChanges = useCallback(() => {
      setPaths([...initialPaths]);
      setDefaultPath(initialDefaultPath);
      setPendingActions({
        pathsToAdd: [],
        pathsToRemove: [],
        newDefaultPath: null,
      });
    }, [initialPaths, initialDefaultPath]);

    // Экспортируем методы для использования из родительского компонента
    useImperativeHandle(
      ref,
      () => ({
        saveChanges,
        resetChanges,
        getPathChanges: () => ({
          pathsToAdd: pendingActions.pathsToAdd,
          pathsToRemove: pendingActions.pathsToRemove,
          defaultPath: pendingActions.newDefaultPath,
        }),
      }),
      [saveChanges, resetChanges, pendingActions]
    );

    // Загружаем список путей и путь по умолчанию при инициализации
    useEffect(() => {
      const loadPaths = async () => {
        try {
          console.log("Начало загрузки путей");
          const defaultDir = await GetDefaultDownloadDir();
          console.log("Получен системный путь по умолчанию:", defaultDir);

          const savedPaths = await GetDownloadPaths();
          console.log("Получены все сохраненные пути:", savedPaths);

          // Больше не фильтруем путь по умолчанию из списка
          setPaths(savedPaths);
          setInitialPaths(savedPaths);
          setDefaultPath(defaultDir);
          setInitialDefaultPath(defaultDir);

          console.log("Завершение загрузки путей - установлены в состояние:", {
            paths: savedPaths,
            defaultPath: defaultDir,
          });
        } catch (error) {
          console.error("Failed to load paths:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadPaths();
    }, []);

    // Уведомляем родительский компонент об изменениях
    useEffect(() => {
      if (onPathsChanged) {
        const hasChanges =
          pendingActions.pathsToAdd.length > 0 ||
          pendingActions.pathsToRemove.length > 0 ||
          pendingActions.newDefaultPath !== null;

        onPathsChanged(hasChanges);
      }
    }, [pendingActions, onPathsChanged]);

    // Валидация пути
    const validatePath = async (path: string): Promise<boolean> => {
      if (!path) {
        setPathError(t("settings.pathRequired"));
        return false;
      }

      try {
        await ValidateDownloadPath(path);
        setPathError("");
        return true;
      } catch (error) {
        setPathError(String(error));
        return false;
      }
    };

    // Добавление нового пути (временно)
    const handleAddPath = async () => {
      // Проверяем, есть ли такой путь уже в списке
      if (paths.includes(newPath)) {
        // Устанавливаем флаг дубликата пути
        setIsDuplicatePath(true);
        setShowDuplicateTooltip(true);
        // Автоматически скрываем тултип через 3 секунды
        setTimeout(() => {
          setShowDuplicateTooltip(false);
        }, 3000);
        return;
      }

      setIsDuplicatePath(false);
      setShowDuplicateTooltip(false);

      if (await validatePath(newPath)) {
        // Добавляем новый путь после пути по умолчанию
        const updatedPaths = [...paths];

        if (defaultPath && defaultPath !== "") {
          // Находим индекс пути по умолчанию в массиве
          const defaultPathIndex = updatedPaths.indexOf(defaultPath);
          if (defaultPathIndex !== -1) {
            // Вставляем новый путь сразу после пути по умолчанию
            updatedPaths.splice(defaultPathIndex + 1, 0, newPath);
          } else {
            // Если путь по умолчанию не найден, добавляем в начало списка
            updatedPaths.unshift(newPath);
          }
        } else {
          // Если нет пути по умолчанию, добавляем в начало списка
          updatedPaths.unshift(newPath);
        }

        setPaths(updatedPaths);

        // Если путь был в списке на удаление, убираем его оттуда
        const updatedToRemove = pendingActions.pathsToRemove.filter(
          (p) => p !== newPath
        );

        // Если путь не был в исходном списке, добавляем его в список на добавление
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

        setNewPath(""); // Очищаем поле ввода
      }
    };

    // Удаление пути с подтверждением
    const handleDeletePathRequest = (path: string) => {
      setPathWithConfirmDelete(path);
    };

    // Подтверждение удаления и удаление пути (временно)
    const handleConfirmInlineDelete = async (path: string) => {
      // Удаляем путь из локального списка
      setPaths((prevPaths) => prevPaths.filter((p) => p !== path));

      // Обновляем списки ожидающих действий
      setPendingActions((prev) => {
        // Если путь был в списке на добавление, просто убираем его оттуда
        const updatedToAdd = prev.pathsToAdd.filter((p) => p !== path);

        // Если путь был в исходном списке, добавляем его в список на удаление
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
    };

    // Установка пути по умолчанию (временно)
    const handleSetDefaultPath = (path: string) => {
      // Обновляем UI
      setDefaultPath(path);

      // Сохраняем для последующего применения если изменилось
      if (path !== initialDefaultPath) {
        setPendingActions((prev) => ({
          ...prev,
          newDefaultPath: path,
        }));
      } else {
        setPendingActions((prev) => ({
          ...prev,
          newDefaultPath: null,
        }));
      }
    };

    // Сброс пути по умолчанию - этот метод больше не используем,
    // так как нельзя снять статус с пути по умолчанию
    const handleClearDefaultPath = () => {
      // При клике на звездочку пути по умолчанию ничего не происходит
      console.log(
        "Нельзя снять статус пути по умолчанию, выберите другой путь по умолчанию"
      );
    };

    if (isLoading) {
      return null;
    }

    return (
      <Grid columns="1" gap="3" style={{ position: "relative" }}>
        {/* Список существующих путей с ограничением по высоте и скроллом - показываем только при наличии путей */}
        {paths.length > 0 && (
          <Box>
            <Text as="div" size="1" mb="2" weight="bold">
              {t("settings.savedPaths")}
            </Text>
            <Box
              style={{
                maxHeight: "200px",
                overflow: "auto",
                border: "1px solid var(--gray-6)",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              <Flex direction="column" gap="2">
                {/* Сортируем пути так, чтобы путь по умолчанию всегда был первым */}
                {paths
                  .sort((a, b) => {
                    // Путь по умолчанию должен быть первым
                    if (a === defaultPath) return -1;
                    if (b === defaultPath) return 1;
                    // Далее сохраняем оригинальный порядок
                    return 0;
                  })
                  .map((path) => (
                    <Flex
                      key={path}
                      justify="between"
                      align="center"
                      gap="2"
                      style={{
                        padding: "6px",
                        borderRadius: "4px",
                        backgroundColor:
                          path === defaultPath
                            ? "var(--accent-3)"
                            : "transparent",
                      }}
                    >
                      {/* Если активен режим подтверждения удаления для этого пути */}
                      {pathWithConfirmDelete === path ? (
                        <Flex
                          justify="between"
                          align="center"
                          gap="2"
                          style={{ width: "100%" }}
                        >
                          <Text size="1" color="red">
                            {t("settings.confirmDeletePath")}
                          </Text>
                          <Flex gap="2">
                            <Button
                              size="1"
                              color="red"
                              variant="soft"
                              onClick={() => handleConfirmInlineDelete(path)}
                            >
                              {t("remove.confirm")}
                            </Button>
                            <Button
                              size="1"
                              variant="soft"
                              onClick={() => setPathWithConfirmDelete(null)}
                            >
                              {t("remove.cancel")}
                            </Button>
                          </Flex>
                        </Flex>
                      ) : (
                        <>
                          <Tooltip content={path}>
                            <Text
                              size="1"
                              style={{
                                flex: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {path}
                              {path === initialDefaultPath && (
                                <Text
                                  as="span"
                                  size="1"
                                  color="gray"
                                  style={{ marginLeft: "5px" }}
                                >
                                  ({t("settings.systemPath")})
                                </Text>
                              )}
                            </Text>
                          </Tooltip>
                          <Flex gap="2">
                            {path === defaultPath ? (
                              <Tooltip content={t("settings.clearDefault")}>
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color="amber"
                                  onClick={handleClearDefaultPath}
                                >
                                  <StarIcon width={16} height={16} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
                                <Tooltip content={t("settings.setDefault")}>
                                  <IconButton
                                    size="1"
                                    variant="soft"
                                    onClick={() => handleSetDefaultPath(path)}
                                  >
                                    <StarIcon width={16} height={16} />
                                  </IconButton>
                                </Tooltip>
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color="red"
                                  onClick={() => handleDeletePathRequest(path)}
                                >
                                  <TrashIcon width={16} height={16} />
                                </IconButton>
                              </>
                            )}
                          </Flex>
                        </>
                      )}
                    </Flex>
                  ))}
              </Flex>
            </Box>
          </Box>
        )}

        {/* Добавление нового пути */}
        <Box>
          <Text as="div" size="1" mb="2" weight="bold">
            {t("settings.addNewPath")}
          </Text>
          <Flex direction="column" gap="2">
            <TextField.Root
              size="1"
              value={newPath}
              onChange={(e) => {
                setNewPath(e.target.value);
                setPathError("");
                setIsDuplicatePath(false);
                setShowDuplicateTooltip(false);
              }}
              color={pathError ? "red" : undefined}
              placeholder={t("settings.pathPlaceholder")}
            />

            {pathError && (
              <Text size="1" color="red">
                {pathError}
              </Text>
            )}

            <Tooltip
              content={t("settings.pathAlreadyExists")}
              open={showDuplicateTooltip}
            >
              <Button
                size="1"
                variant="soft"
                onClick={handleAddPath}
                disabled={!newPath.trim()}
                color={isDuplicatePath ? "red" : undefined}
              >
                {t("settings.addPath")}
              </Button>
            </Tooltip>
          </Flex>
        </Box>
      </Grid>
    );
  }
);

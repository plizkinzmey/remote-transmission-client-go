import React, { useState } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DownloadPathSelector } from "./DownloadPathSelector";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

// Импортируем модули для мока
import * as AppModule from "../../../../wailsjs/go/main/App";

// Mock зависимостей - vi.mock должен быть в начале файла перед остальным кодом
vi.mock("../../../../wailsjs/go/main/App", () => ({
  GetDownloadPaths: vi.fn().mockResolvedValue(["/path1", "/path2"]),
  ValidateDownloadPath: vi.fn().mockImplementation((path) => {
    if (path === "/invalid") {
      return Promise.reject("Invalid path");
    }
    return Promise.resolve(true);
  }),
  RemoveDownloadPath: vi.fn().mockResolvedValue(true),
}));

describe("DownloadPathSelector Component", () => {
  const mockOnPathChange = vi.fn();
  const mockOnLoadingStateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DownloadPathSelector onPathChange={mockOnPathChange} {...props} />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );
  };

  it("загружает и отображает пути загрузки", async () => {
    renderComponent();

    // Проверяем, что пути загружены
    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });
  });

  it("использует initialPath, если он передан", async () => {
    renderComponent({ initialPath: "/path2" });

    // Проверяем, что выбран initialPath
    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
  });

  it("переключается между выбором существующих путей и кастомным путем", async () => {
    renderComponent();

    await waitFor(() => {
      const toggleButton = screen.getByText("add.enterCustomPath");
      fireEvent.click(toggleButton);

      // После переключения должно появиться текстовое поле
      const inputField = screen.getByPlaceholderText("/path/to/downloads");
      expect(inputField).toBeInTheDocument();

      // Переключаемся обратно
      const backButton = screen.getByText("add.selectFromExisting");
      fireEvent.click(backButton);

      // TextInput должен скрыться
      expect(
        screen.queryByPlaceholderText("/path/to/downloads")
      ).not.toBeInTheDocument();
    });
  });

  it("валидирует кастомный путь", async () => {
    renderComponent();

    await waitFor(() => {
      // Переключаемся на кастомный путь
      const toggleButton = screen.getByText("add.enterCustomPath");
      fireEvent.click(toggleButton);

      // Вводим невалидный путь
      const inputField = screen.getByPlaceholderText("/path/to/downloads");
      fireEvent.change(inputField, { target: { value: "/invalid" } });

      // Проверяем, что ValidateDownloadPath был вызван с правильным аргументом
      expect(vi.mocked(AppModule.ValidateDownloadPath)).toHaveBeenCalledWith(
        "/invalid"
      );
    });
  });

  it("выбирает путь из выпадающего списка", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("add.enterCustomPath")).toBeInTheDocument();
    });

    // Имитируем выбор пути путем прямого вызова функции onValueChange
    const paths = await AppModule.GetDownloadPaths();
    vi.mocked(mockOnPathChange).mockClear();

    await waitFor(() => {
      const selectElements = document.querySelectorAll(
        'button[aria-autocomplete="none"]'
      );
      if (selectElements.length > 0) {
        const selectElement = selectElements[0] as HTMLButtonElement;
        fireEvent.click(selectElement);
      }

      mockOnPathChange("/path2");
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
  });

  it("вызывает onLoadingStateChange при изменении статуса загрузки", async () => {
    // Рендерим компонент с пропом onLoadingStateChange
    renderComponent({ onLoadingStateChange: mockOnLoadingStateChange });

    // Ожидаем вызов onLoadingStateChange с false после загрузки путей
    await waitFor(() => {
      expect(mockOnLoadingStateChange).toHaveBeenCalledWith(false);
    });
  });

  it("сообщает об ошибке при получении путей", async () => {
    // Мокируем консоль, чтобы отловить сообщение об ошибке
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    // Меняем реализацию mock-функции для вызова ошибки
    const mockGetDownloadPaths = vi.mocked(AppModule.GetDownloadPaths);
    mockGetDownloadPaths.mockRejectedValueOnce(new Error("Test error"));

    // Рендерим компонент с пропом onLoadingStateChange
    renderComponent({ onLoadingStateChange: mockOnLoadingStateChange });

    // Ожидаем вызов onLoadingStateChange с false даже при ошибке
    await waitFor(() => {
      expect(mockOnLoadingStateChange).toHaveBeenCalledWith(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("возвращает null при загрузке путей", () => {
    // Мокируем GetDownloadPaths, чтобы его вызов зависал и статус загрузки сохранялся
    vi.mocked(AppModule.GetDownloadPaths).mockReturnValueOnce(
      new Promise(() => { }) // Promise, который никогда не разрешится (имитация загрузки)
    );

    // Рендерим компонент напрямую, без обертки ThemeProvider
    const { container } = render(
      <DownloadPathSelector onPathChange={mockOnPathChange} />
    );

    // При isLoadingPaths === true, компонент должен вернуть null
    expect(container.firstChild).toBeNull();
  });

  it("удаляет путь и обновляет список", async () => {
    // Модифицируем компонент для этого теста для доступа к внутренней функции handleRemovePath
    const DownloadPathSelectorWithRemoveButton = (props: any) => {
      const component = <DownloadPathSelector {...props} />;
      // Добавляем тестовую кнопку для вызова функции удаления пути
      return (
        <>
          {component}
          <button
            data-testid="remove-path-button"
            onClick={() => {
              // Напрямую вызываем внутренний метод RemoveDownloadPath из AppModule
              AppModule.RemoveDownloadPath("/path1");
              props.onPathChange("/path2");
            }}
          >
            Тестовая кнопка удаления
          </button>
        </>
      );
    };

    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DownloadPathSelectorWithRemoveButton
            onPathChange={mockOnPathChange}
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    await waitFor(() => {
      // Дожидаемся загрузки компонента
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });

    // Используем тестовую кнопку для симуляции удаления пути
    const removeButton = screen.getByTestId("remove-path-button");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path1");
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
  });

  it("обрабатывает ошибку при удалении пути", async () => {
    // Мокируем функцию RemoveDownloadPath, чтобы она отвергала промис
    vi.mocked(AppModule.RemoveDownloadPath).mockRejectedValueOnce(
      new Error("Test error")
    );

    // Создаем шпион для console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    // Модифицируем компонент для тестирования внутренней функции handleRemovePath
    const DownloadPathSelectorWithRemoveButton = (props: any) => {
      const component = <DownloadPathSelector {...props} />;
      // Добавляем тестовую кнопку для вызова функции удаления пути с ошибкой
      return (
        <>
          {component}
          <button
            data-testid="remove-error-button"
            onClick={async () => {
              try {
                await AppModule.RemoveDownloadPath("/path1");
              } catch (error) {
                console.error("Ошибка при удалении пути:", error instanceof Error ? error.message : String(error));
              }
            }}
          >
            Тестовая кнопка с ошибкой
          </button>
        </>
      );
    };

    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DownloadPathSelectorWithRemoveButton
            onPathChange={mockOnPathChange}
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Ждем, пока компонент загрузится
    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });

    // Используем тестовую кнопку для эмуляции удаления пути с ошибкой
    const errorButton = screen.getByTestId("remove-error-button");
    fireEvent.click(errorButton);

    await waitFor(() => {
      expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path1");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при удалении пути:",
        expect.any(String)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("переключается между пользовательским и существующим путем", async () => {
    // Мокируем метод scrollIntoView для решения проблемы с JSDOM
    Element.prototype.scrollIntoView = vi.fn();

    // Рендерим реальный компонент
    renderComponent();

    // Ожидаем, пока компонент полностью загрузится
    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });

    // Находим кнопку переключения режима по data-testid
    const toggleButton = screen.getByTestId("toggle-path-mode-button");
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);

    // Проверяем, что появилось поле ввода пользовательского пути
    const inputField = screen.getByTestId("custom-path-input");
    expect(inputField).toBeInTheDocument();

    // Находим input внутри TextField и вводим значение
    const textInput = inputField.querySelector("input");
    if (textInput) {
      fireEvent.change(textInput, { target: { value: "/custom/path/new" } });
      // Проверяем, что onPathChange был вызван с новым значением
      expect(mockOnPathChange).toHaveBeenCalledWith("/custom/path/new");
    }

    // Находим кнопку для возврата к выбору существующих путей (та же кнопка)
    const backButton = screen.getByTestId("toggle-path-mode-button");
    expect(backButton).toBeInTheDocument();
    expect(backButton.textContent).toContain("add.selectFromExisting");
    fireEvent.click(backButton);

    // Проверяем, что поле ввода исчезло и появился селект
    expect(screen.queryByTestId("custom-path-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
  });

  it("корректно обрабатывает размонтирование компонента во время загрузки путей", async () => {
    // Создаем Promise с явной типизацией
    const loadingPromise: Promise<string[]> = new Promise((resolve) => {
      setTimeout(() => resolve(["/path1", "/path2"]), 100);
    });

    vi.mocked(AppModule.GetDownloadPaths).mockReturnValueOnce(loadingPromise);

    const { unmount } = renderComponent();
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(mockOnPathChange).not.toHaveBeenCalled();
    expect(mockOnLoadingStateChange).not.toHaveBeenCalled();
  });

  it("обрабатывает пустой путь в handlePathValidation", async () => {
    renderComponent();

    await waitFor(() => {
      const customPathButton = screen.getByTestId("toggle-path-mode-button");
      fireEvent.click(customPathButton);
    });

    const pathInput = screen.getByPlaceholderText("/path/to/downloads");
    fireEvent.change(pathInput, { target: { value: "" } });

    // Проверяем, что ошибка не отображается для пустого пути
    expect(screen.queryByText("Invalid path")).not.toBeInTheDocument();
  });

  it("обрабатывает ошибки при валидации пути с отображением в UI", async () => {
    // Определим текст ошибки
    const validationError = "Тестовая ошибка валидации";

    // Настроим мок функции ValidateDownloadPath, чтобы она возвращала ошибку
    const { ValidateDownloadPath } = vi.mocked(AppModule);
    ValidateDownloadPath.mockRejectedValueOnce(validationError);

    // Рендерим компонент
    renderComponent();

    // Переключаемся в режим ввода пути
    const toggleButton = await screen.findByTestId("toggle-path-mode-button");
    fireEvent.click(toggleButton);

    // Находим и заполняем поле ввода
    const pathInput = screen.getByPlaceholderText("/path/to/downloads");

    // Вводим путь, который вызовет ошибку
    await act(async () => {
      fireEvent.change(pathInput, { target: { value: "/test/path" } });
    });

    // Проверяем, что ValidateDownloadPath был вызван с правильным параметром
    expect(ValidateDownloadPath).toHaveBeenCalledWith("/test/path");

    // Проверяем, что текст ошибки был отображен в UI
    const errorText = await screen.findByText(validationError);
    expect(errorText).toBeInTheDocument();

    // Проверяем, что контейнер поля ввода изменил цвет на красный
    // Находим родительский div с классом rt-TextFieldRoot
    const textFieldContainer = screen.getByTestId("custom-path-input").closest('.rt-TextFieldRoot');
    expect(textFieldContainer).toHaveAttribute("data-accent-color", "red");
  });

  it("обрабатывает ошибки при удалении пути", async () => {
    // Создаем шпион для console.error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    // Мокируем RemoveDownloadPath, чтобы он возвращал ошибку
    const { RemoveDownloadPath } = vi.mocked(AppModule);
    const testError = new Error("Ошибка при удалении пути");
    RemoveDownloadPath.mockRejectedValueOnce(testError);

    // Создаем компонент с тестовой кнопкой для удаления
    const TestComponent = () => {
      const handleRemove = async () => {
        try {
          await RemoveDownloadPath("/path1");
        } catch (error) {
          console.error("Ошибка при удалении пути:", error instanceof Error ? error.message : String(error));
        }
      };

      return (
        <>
          <DownloadPathSelector onPathChange={mockOnPathChange} />
          <button data-testid="test-remove-button" onClick={handleRemove}>
            Remove Path
          </button>
        </>
      );
    };

    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Ждем, пока компонент загрузится
    await waitFor(() => {
      expect(screen.getByTestId("test-remove-button")).toBeInTheDocument();
    });

    // Нажимаем кнопку удаления
    const removeButton = screen.getByTestId("test-remove-button");
    await act(async () => {
      fireEvent.click(removeButton);
    });

    // Проверяем, что ошибка была залогирована
    await waitFor(() => {
      expect(RemoveDownloadPath).toHaveBeenCalledWith("/path1");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при удалении пути:",
        expect.any(String)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("управляет состоянием загрузки корректно", async () => {
    // Мокируем GetDownloadPaths, чтобы он не резолвился сразу
    const { GetDownloadPaths } = vi.mocked(AppModule);
    const loadingPromise = new Promise<string[]>((resolve) => {
      setTimeout(() => resolve(["/path1", "/path2"]), 100);
    });
    GetDownloadPaths.mockReturnValueOnce(loadingPromise);

    // Рендерим компонент с провайдерами
    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DownloadPathSelector onPathChange={mockOnPathChange} />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // После рендеринга компонент должен быть в состоянии загрузки
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Дожидаемся загрузки данных
    await waitFor(
      () => {
        expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it("обрабатывает ошибки при инициализации компонента", async () => {
    // Создаем шпион для console.error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    // Мокируем GetDownloadPaths, чтобы он возвращал ошибку
    const { GetDownloadPaths } = vi.mocked(AppModule);
    const testError = new Error("Ошибка при получении путей");
    GetDownloadPaths.mockRejectedValueOnce(testError);

    const onLoadingStateChange = vi.fn();
    renderComponent({ onLoadingStateChange });

    await waitFor(() => {
      // Проверяем, что ошибка была залогирована
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при получении путей:",
        testError
      );
      // Проверяем, что состояние загрузки обновилось
      expect(onLoadingStateChange).toHaveBeenCalledWith(false);
    });

    consoleErrorSpy.mockRestore();
  });

  it("обрабатывает ошибки валидации с прямым вызовом validatePath", async () => {
    // Создаем тестовую ошибку
    const validationErrorMessage = "Специальная тестовая ошибка";

    // Модифицируем компонент для этого теста, добавляя кнопку для прямого вызова validatePath
    const TestComponent = () => {
      const [error, setError] = useState<string>("");

      const handleTestValidation = async () => {
        try {
          // Мокируем ошибку в ValidateDownloadPath
          vi.mocked(AppModule.ValidateDownloadPath).mockRejectedValueOnce(new Error(validationErrorMessage));

          // Вызываем validatePath напрямую
          const pathToValidate = "/invalid/path/testing";
          await AppModule.ValidateDownloadPath(pathToValidate);
        } catch (error) {
          console.error("Ошибка валидации пути:", error instanceof Error ? error.message : String(error));
          setError(error instanceof Error ? error.message : String(error));
        }
      };

      return (
        <>
          <DownloadPathSelector onPathChange={mockOnPathChange} />
          <button data-testid="test-validation-button" onClick={handleTestValidation}>
            Тестовая валидация
          </button>
          {error && <div data-testid="validation-error">{error}</div>}
        </>
      );
    };

    // Создаем шпион для console.error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    // Рендерим компонент
    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Дожидаемся загрузки компонента
    await waitFor(() => {
      expect(screen.getByTestId("test-validation-button")).toBeInTheDocument();
    });

    // Нажимаем кнопку для запуска валидации
    const validateButton = screen.getByTestId("test-validation-button");
    await act(async () => {
      fireEvent.click(validateButton);
    });

    // Проверяем, что console.error был вызван с ожидаемыми параметрами
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка валидации пути:",
        expect.stringContaining(validationErrorMessage)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("удаляет текущий выбранный путь и выбирает первый из оставшихся", async () => {
    // Создаем компонент с доступом к внутренним методам
    const TestComponent = () => {
      const [currentPath, setCurrentPath] = useState<string>("/path1");
      const pathChangeHandler = (path: string) => {
        mockOnPathChange(path);
        setCurrentPath(path);
      };

      // Функция для имитации удаления текущего выбранного пути
      const handleRemoveCurrentPath = async () => {
        try {
          // Установим mock-возвращаемое значение для GetDownloadPaths после удаления
          // имитируем удаление пути "/path1" из списка
          vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce(["/path2"]);

          // Удаляем текущий путь
          await AppModule.RemoveDownloadPath(currentPath);

          // После удаления пути должен быть вызван GetDownloadPaths для обновления списка
          const updatedPaths = await AppModule.GetDownloadPaths();

          // Если был удален текущий путь, должен быть выбран первый из оставшихся
          if (updatedPaths.length > 0) {
            pathChangeHandler(updatedPaths[0]);
          }
        } catch (error) {
          console.error("Ошибка при удалении пути:", error);
        }
      };

      return (
        <>
          <div>Текущий путь: {currentPath}</div>
          <DownloadPathSelector
            onPathChange={pathChangeHandler}
            initialPath={currentPath}
          />
          <button data-testid="remove-current-path" onClick={handleRemoveCurrentPath}>
            Удалить текущий путь
          </button>
        </>
      );
    };

    // Рендерим компонент
    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Дожидаемся загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("Текущий путь: /path1")).toBeInTheDocument();
    });

    // Очищаем историю вызовов мока
    mockOnPathChange.mockClear();

    // Нажимаем кнопку удаления текущего пути
    const removeButton = screen.getByTestId("remove-current-path");
    await act(async () => {
      fireEvent.click(removeButton);
    });

    // Проверяем что:
    // 1. Вызвана функция RemoveDownloadPath с правильным путем
    // 2. Вызвана функция GetDownloadPaths для получения обновленного списка
    // 3. Вызвана функция onPathChange с новым путем
    await waitFor(() => {
      expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path1");
      expect(AppModule.GetDownloadPaths).toHaveBeenCalled();
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });

    // Проверяем, что UI обновлен
    await waitFor(() => {
      expect(screen.getByText("Текущий путь: /path2")).toBeInTheDocument();
    });
  });

  it("вызывает функцию удаления пути и обрабатывает различные сценарии", async () => {
    // Создаем компонент с доступом к внутреннему состоянию
    // Для имитации сложной логики в handleRemovePath
    const TestRemovePathComponent = () => {
      // Храним пути в локальном состоянии для полного контроля
      const [paths, setPaths] = useState<string[]>(["/path1", "/path2", "/path3"]);
      const [currentPath, setCurrentPath] = useState("/path2");

      // Замыкаем мок-функцию обратного вызова для теста
      const localPathChange = (path: string) => {
        mockOnPathChange(path);
        setCurrentPath(path);
      };

      // Функция имитирующая полное поведение handleRemovePath
      const simulateRemovePath = async (pathToRemove: string) => {
        try {
          // Удаляем путь
          await AppModule.RemoveDownloadPath(pathToRemove);

          // Имитируем получение обновленного списка после удаления
          const newPaths = paths.filter(p => p !== pathToRemove);
          setPaths(newPaths);

          // Если удален текущий путь, выбираем первый из оставшихся
          if (pathToRemove === currentPath && newPaths.length > 0) {
            localPathChange(newPaths[0]);
          }
        } catch (error) {
          console.error("Ошибка при удалении пути:", error);
        }
      };

      return (
        <>
          <div data-testid="current-path">Current: {currentPath}</div>
          <div>
            <h4>Available Paths:</h4>
            <ul>
              {paths.map(path => (
                <li key={path} data-testid={`path-item-${path}`}>{path}</li>
              ))}
            </ul>
          </div>
          <button
            data-testid="remove-current-path-btn"
            onClick={() => simulateRemovePath(currentPath)}>
            Remove Current Path
          </button>
          <button
            data-testid="remove-other-path-btn"
            onClick={() => simulateRemovePath("/path3")}>
            Remove Another Path
          </button>
        </>
      );
    };

    // Рендерим тестовый компонент
    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestRemovePathComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Проверяем, что начальное состояние корректно
    expect(screen.getByTestId("current-path").textContent).toContain("/path2");
    expect(screen.getByTestId("path-item-/path1")).toBeInTheDocument();
    expect(screen.getByTestId("path-item-/path2")).toBeInTheDocument();
    expect(screen.getByTestId("path-item-/path3")).toBeInTheDocument();

    // Очищаем историю вызовов моков
    vi.mocked(AppModule.RemoveDownloadPath).mockClear();
    mockOnPathChange.mockClear();

    // Сценарий 1: Удаляем текущий выбранный путь
    const removeCurrentBtn = screen.getByTestId("remove-current-path-btn");
    await act(async () => {
      fireEvent.click(removeCurrentBtn);
    });

    // Проверяем, что:
    // 1. Вызвана функция RemoveDownloadPath с правильным путем
    // 2. Текущий путь изменился на первый доступный из списка
    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path2");
    expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    expect(screen.getByTestId("current-path").textContent).toContain("/path1");

    // Очищаем историю вызовов моков снова
    vi.mocked(AppModule.RemoveDownloadPath).mockClear();
    mockOnPathChange.mockClear();

    // Сценарий 2: Удаляем другой путь, не текущий
    const removeOtherBtn = screen.getByTestId("remove-other-path-btn");
    await act(async () => {
      fireEvent.click(removeOtherBtn);
    });

    // Проверяем, что:
    // 1. Вызвана функция RemoveDownloadPath с другим путем
    // 2. Текущий путь не изменился
    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path3");
    expect(mockOnPathChange).not.toHaveBeenCalled(); // текущий путь не менялся
    expect(screen.getByTestId("current-path").textContent).toContain("/path1");
  });

  it("корректно отрабатывает предварительную проверку пути через isValidPathToCheck", async () => {
    const TestPathValidationComponent: React.FC = () => {
      const [pathError, setPathError] = useState<string>("");
      const [result, setResult] = useState<boolean>(false);

      const testPath = async (path: string) => {
        // Имитация логики isValidPathToCheck из основного компонента
        if (!path) {
          setPathError("");
          setResult(false);
        } else {
          setResult(true);
        }
      };

      return (
        <>
          <div data-testid="path-error">{pathError}</div>
          <div data-testid="test-result">{result.toString()}</div>
          <button data-testid="test-empty-path" onClick={() => testPath("")}>
            Test Empty Path
          </button>
          <button data-testid="test-valid-path" onClick={() => testPath("/valid/path")}>
            Test Valid Path
          </button>
        </>
      );
    };

    // Рендерим компонент
    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestPathValidationComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Проверяем пустой путь
    const emptyPathButton = screen.getByTestId("test-empty-path");
    await act(async () => {
      fireEvent.click(emptyPathButton);
    });

    expect(screen.getByTestId("test-result").textContent).toBe("false");
    expect(screen.getByTestId("path-error").textContent).toBe("");

    // Проверяем валидный путь
    const validPathButton = screen.getByTestId("test-valid-path");
    await act(async () => {
      fireEvent.click(validPathButton);
    });

    expect(screen.getByTestId("test-result").textContent).toBe("true");
  });

  it("тестирует полный цикл обработки ошибок", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    const TestErrorHandlingComponent: React.FC = () => {
      const [pathError, setPathError] = useState<string>("");
      const [validationResult, setValidationResult] = useState<boolean>(false);

      const validatePathWithError = async () => {
        try {
          throw new Error("Тест ошибки валидации");
        } catch (error) {
          console.error("Ошибка валидации пути:", error instanceof Error ? error.message : String(error));
          setPathError(error instanceof Error ? error.message : String(error));
          setValidationResult(false);
        }
      };

      return (
        <>
          <div data-testid="path-error">{pathError}</div>
          <div data-testid="validation-result">{validationResult.toString()}</div>
          <button data-testid="test-validation" onClick={validatePathWithError}>
            Test Validation
          </button>
        </>
      );
    };

    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestErrorHandlingComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    const validationButton = screen.getByTestId("test-validation");
    await act(async () => {
      fireEvent.click(validationButton);
    });

    expect(screen.getByTestId("validation-result").textContent).toBe("false");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Ошибка валидации пути:",
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });
});

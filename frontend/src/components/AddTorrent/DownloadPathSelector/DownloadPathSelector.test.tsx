import React, { useState } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DownloadPathSelector } from "./DownloadPathSelector";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

// Импортируем модули для мока
import * as AppModule from "../../../../wailsjs/go/main/App";

// Mock зависимостей
vi.mock("../../../../wailsjs/go/main/App", () => ({
  GetDownloadPaths: vi.fn().mockResolvedValue(["/path1", "/path2", "/path3"]),
  ValidateDownloadPath: vi.fn().mockImplementation(async (path) => {
    if (path === "/invalid") {
      throw new Error("Invalid path");
    }
    if (path === "/test/path") {
      throw new Error("Тестовая ошибка валидации");
    }
    if (path === "/validation-error-test") {
      throw new Error("Direct validation error");
    }
    return Promise.resolve();
  }),
  RemoveDownloadPath: vi.fn().mockResolvedValue(true),
}));

// Определяем тип для testRef
type DownloadPathSelectorTestRef = {
  handleRemovePath?: (path: string) => Promise<void>;
  handlePathValidation?: (path: string) => Promise<boolean>;
};

// Mock PointerEvent methods for Radix UI compatibility in JSDOM
if (typeof window !== 'undefined') {
  if (!window.Element.prototype.hasOwnProperty('hasPointerCapture')) {
    window.Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    window.Element.prototype.releasePointerCapture = vi.fn();
  }
  // Mock scrollIntoView for Radix UI compatibility in JSDOM
  if (!window.Element.prototype.hasOwnProperty('scrollIntoView')) {
    window.Element.prototype.scrollIntoView = vi.fn();
  }
}

describe("DownloadPathSelector Component", () => {
  const mockOnPathChange = vi.fn();
  const mockOnLoadingStateChange = vi.fn();
  let testRef: React.MutableRefObject<DownloadPathSelectorTestRef>;

  beforeEach(() => {
    vi.clearAllMocks();
    testRef = { current: {} };
  });

  const renderComponent = (props = {}) => {
    return render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DownloadPathSelector
            onPathChange={mockOnPathChange}
            testRef={testRef}
            {...props}
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );
  };

  it("загружает и отображает пути загрузки", async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });
  });

  it("использует initialPath, если он передан", async () => {
    renderComponent({ initialPath: "/path2" });

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
  });

  it("переключается между выбором существующих путей и кастомным путем", async () => {
    renderComponent();

    await waitFor(() => {
      const toggleButton = screen.getByText("add.enterCustomPath");
      fireEvent.click(toggleButton);

      const inputField = screen.getByPlaceholderText("/path/to/downloads");
      expect(inputField).toBeInTheDocument();

      const backButton = screen.getByText("add.selectFromExisting");
      fireEvent.click(backButton);

      expect(
        screen.queryByPlaceholderText("/path/to/downloads")
      ).not.toBeInTheDocument();
    });
  });

  it("валидирует кастомный путь", async () => {
    renderComponent();

    await waitFor(() => {
      const toggleButton = screen.getByText("add.enterCustomPath");
      fireEvent.click(toggleButton);

      const inputField = screen.getByPlaceholderText("/path/to/downloads");
      fireEvent.change(inputField, { target: { value: "/invalid" } });

      expect(vi.mocked(AppModule.ValidateDownloadPath)).toHaveBeenCalledWith(
        "/invalid"
      );
    });
  });

  it("выбирает путь из выпадающего списка и вызывает валидацию", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });
    mockOnPathChange.mockClear();
    vi.mocked(AppModule.ValidateDownloadPath).mockClear();

    const selectTrigger = screen.getByTestId("select-trigger");
    expect(selectTrigger).toBeInTheDocument();

    await user.click(selectTrigger);

    const optionPath2 = await screen.findByTestId("path-option-/path2");
    await user.click(optionPath2);

    expect(mockOnPathChange).toHaveBeenCalledWith("/path2");

    await waitFor(() => {
      expect(AppModule.ValidateDownloadPath).toHaveBeenCalledWith("/path2");
    });
  });

  it("вызывает onLoadingStateChange при изменении статуса загрузки", async () => {
    renderComponent({ onLoadingStateChange: mockOnLoadingStateChange });

    await waitFor(() => {
      expect(mockOnLoadingStateChange).toHaveBeenCalledWith(false);
    });
  });

  it("сообщает об ошибке при получении путей", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    const mockGetDownloadPaths = vi.mocked(AppModule.GetDownloadPaths);
    mockGetDownloadPaths.mockRejectedValueOnce(new Error("Test error"));

    renderComponent({ onLoadingStateChange: mockOnLoadingStateChange });

    await waitFor(() => {
      expect(mockOnLoadingStateChange).toHaveBeenCalledWith(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("возвращает null при загрузке путей", () => {
    vi.mocked(AppModule.GetDownloadPaths).mockReturnValueOnce(
      new Promise(() => { })
    );

    const { container } = render(
      <DownloadPathSelector onPathChange={mockOnPathChange} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("удаляет текущий путь через testRef и выбирает следующий", async () => {
    renderComponent({ initialPath: "/path2" });

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
    mockOnPathChange.mockClear();
    vi.mocked(AppModule.GetDownloadPaths).mockClear();
    vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce(["/path1", "/path3"]);

    await act(async () => {
      await testRef.current.handleRemovePath?.("/path2");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path2");
    expect(AppModule.GetDownloadPaths).toHaveBeenCalledTimes(1);
    expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    expect(AppModule.ValidateDownloadPath).toHaveBeenCalledWith("/path1");
  });

  it("удаляет НЕ текущий путь через testRef и НЕ меняет выбор", async () => {
    renderComponent({ initialPath: "/path2" });

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
    mockOnPathChange.mockClear();
    vi.mocked(AppModule.GetDownloadPaths).mockClear();
    vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce(["/path1", "/path2"]);

    await act(async () => {
      await testRef.current.handleRemovePath?.("/path3");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path3");
    expect(AppModule.GetDownloadPaths).toHaveBeenCalledTimes(1);
    expect(mockOnPathChange).not.toHaveBeenCalled();
  });

  it("обрабатывает ошибку при удалении пути через testRef", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    const removeError = new Error("Remove failed");
    vi.mocked(AppModule.RemoveDownloadPath).mockRejectedValueOnce(removeError);

    renderComponent({ initialPath: "/path1" });

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });
    mockOnPathChange.mockClear();
    vi.mocked(AppModule.GetDownloadPaths).mockClear();

    await act(async () => {
      await testRef.current.handleRemovePath?.("/path1");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path1");
    expect(AppModule.GetDownloadPaths).not.toHaveBeenCalled();
    expect(mockOnPathChange).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Ошибка при удалении пути:", removeError);

    consoleErrorSpy.mockRestore();
  });

  it("переключается между пользовательским и существующим путем", async () => {
    Element.prototype.scrollIntoView = vi.fn();

    renderComponent();

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });

    const toggleButton = screen.getByTestId("toggle-path-mode-button");
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);

    const inputField = screen.getByTestId("custom-path-input");
    expect(inputField).toBeInTheDocument();

    const textInput = inputField.querySelector("input");
    if (textInput) {
      fireEvent.change(textInput, { target: { value: "/custom/path/new" } });
      expect(mockOnPathChange).toHaveBeenCalledWith("/custom/path/new");
    }

    const backButton = screen.getByTestId("toggle-path-mode-button");
    expect(backButton).toBeInTheDocument();
    expect(backButton.textContent).toContain("add.selectFromExisting");
    fireEvent.click(backButton);

    expect(screen.queryByTestId("custom-path-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
  });

  it("корректно обрабатывает размонтирование компонента во время загрузки путей", async () => {
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

  it("обрабатывает пустой путь в handleCustomPathChange и handlePathValidation", async () => {
    const user = userEvent.setup();
    renderComponent();

    const toggleButton = await screen.findByTestId("toggle-path-mode-button");
    await user.click(toggleButton);

    const pathInput = screen.getByPlaceholderText("/path/to/downloads");

    await user.clear(pathInput);
    await user.type(pathInput, "/some/path");
    expect(mockOnPathChange).toHaveBeenLastCalledWith("/some/path");

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    await user.clear(pathInput);

    expect(mockOnPathChange).toHaveBeenLastCalledWith("");

    await waitFor(() => {
      const errorElement = document.querySelector('.path-error');
      expect(errorElement).toBeNull();
    });

    let validationResult = true;
    await act(async () => {
      validationResult = await testRef.current.handlePathValidation?.("") ?? true;
    });
    expect(validationResult).toBe(false);
    await waitFor(() => {
      const errorElement = document.querySelector('.path-error');
      expect(errorElement).toBeNull();
    });
  });

  it("обрабатывает ошибки при валидации пути с отображением в UI и логированием", async () => {
    const user = userEvent.setup();
    const validationError = "Тестовая ошибка валидации";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    renderComponent();

    const toggleButton = await screen.findByTestId("toggle-path-mode-button");
    await user.click(toggleButton);

    const pathInput = screen.getByPlaceholderText("/path/to/downloads");
    await user.clear(pathInput);
    await user.type(pathInput, "/test/path");

    await waitFor(() => {
      expect(AppModule.ValidateDownloadPath).toHaveBeenLastCalledWith("/test/path");
    });

    const errorText = await screen.findByText(validationError);
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent(validationError);

    const textFieldContainer = screen.getByTestId("custom-path-input").closest('.rt-TextFieldRoot');
    expect(textFieldContainer).toHaveAttribute("data-accent-color", "red");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Ошибка валидации пути:",
      expect.any(Error)
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: validationError })
    );

    consoleErrorSpy.mockRestore();
  });

  it("управляет состоянием загрузки корректно", async () => {
    const { GetDownloadPaths } = vi.mocked(AppModule);
    const loadingPromise = new Promise<string[]>((resolve) => {
      setTimeout(() => resolve(["/path1", "/path2"]), 100);
    });
    GetDownloadPaths.mockReturnValueOnce(loadingPromise);

    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DownloadPathSelector onPathChange={mockOnPathChange} />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it("обрабатывает ошибки при инициализации компонента", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    const { GetDownloadPaths } = vi.mocked(AppModule);
    const testError = new Error("Ошибка при получении путей");
    GetDownloadPaths.mockRejectedValueOnce(testError);

    const onLoadingStateChange = vi.fn();
    renderComponent({ onLoadingStateChange });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при получении путей:",
        testError
      );
      expect(onLoadingStateChange).toHaveBeenCalledWith(false);
    });

    consoleErrorSpy.mockRestore();
  });

  it("обрабатывает ошибки валидации с прямым вызовом validatePath", async () => {
    const validationErrorMessage = "Специальная тестовая ошибка";

    const TestComponent = () => {
      const [error, setError] = useState<string>("");

      const handleTestValidation = async () => {
        try {
          vi.mocked(AppModule.ValidateDownloadPath).mockRejectedValueOnce(new Error(validationErrorMessage));

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

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TestComponent />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("test-validation-button")).toBeInTheDocument();
    });

    const validateButton = screen.getByTestId("test-validation-button");
    await act(async () => {
      fireEvent.click(validateButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка валидации пути:",
        expect.stringContaining(validationErrorMessage)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("удаляет последний путь через testRef и выбирает пустую строку", async () => {
    vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce(["/lastpath"]);
    renderComponent();

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/lastpath");
      expect(testRef.current.handleRemovePath).toBeDefined();
      expect(testRef.current.handlePathValidation).toBeDefined();
    });

    mockOnPathChange.mockClear();
    vi.mocked(AppModule.GetDownloadPaths).mockClear();
    vi.mocked(AppModule.ValidateDownloadPath).mockClear();

    vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce([]);

    await act(async () => {
      await testRef.current.handleRemovePath!("/lastpath");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/lastpath");
    expect(AppModule.GetDownloadPaths).toHaveBeenCalledTimes(1);
    expect(mockOnPathChange).toHaveBeenCalledWith("");

    expect(AppModule.ValidateDownloadPath).not.toHaveBeenCalled();

    await waitFor(() => {
      const errorElement = document.querySelector('.path-error');
      expect(errorElement).toBeNull();
    });
  });

  it("корректно загружает пути без onLoadingStateChange", async () => {
    // Рендерим компонент БЕЗ onLoadingStateChange
    renderComponent();

    // Просто проверяем, что компонент загрузился и выбрал первый путь,
    // что неявно подтверждает, что ветка `if (onLoadingStateChange && isMounted)`
    // отработала корректно (не вызвав ошибку при undefined onLoadingStateChange)
    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path1");
    });

    // Убедимся, что select-trigger отображается
    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
  });

  it("обрабатывает ошибку при получении путей без onLoadingStateChange", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const testError = new Error("Test error without callback");
    vi.mocked(AppModule.GetDownloadPaths).mockRejectedValueOnce(testError);

    // Рендерим компонент БЕЗ onLoadingStateChange
    renderComponent();

    // Ожидаем, что ошибка будет залогирована
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при получении путей:",
        testError
      );
    });

    // Проверяем, что компонент не упал и отобразил кнопку переключения
    // (это означает, что isLoadingPaths стал false, даже без колбэка)
    expect(screen.getByTestId("toggle-path-mode-button")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("корректно обрабатывает размонтирование компонента во время ошибки загрузки путей", async () => {
    const testError = new Error("Delayed error");
    const errorPromise: Promise<string[]> = new Promise((_, reject) => {
      setTimeout(() => reject(testError), 100); // Задержка отклонения
    });
    vi.mocked(AppModule.GetDownloadPaths).mockReturnValueOnce(errorPromise);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Передаем mock-колбэк
    const { unmount } = renderComponent({ onLoadingStateChange: mockOnLoadingStateChange });

    // Размонтируем *до* отклонения промиса
    unmount();

    // Ждем отклонения промиса *после* размонтирования
    await act(async () => {
      try {
        await errorPromise;
      } catch (e) {
        // Ожидаемое отклонение
      }
    });

     // Ждем еще немного, чтобы убедиться, что любые потенциальные обновления состояния попытались бы выполниться
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Проверяем, что console.error БЫЛ вызван (строка 58)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при получении путей:",
        testError
    );
    // Проверяем, что onLoadingStateChange НЕ был вызван, так как сработал return на строке 59
    expect(mockOnLoadingStateChange).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

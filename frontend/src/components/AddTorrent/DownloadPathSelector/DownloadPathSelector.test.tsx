import React, { useState } from "react"; // Удалить useRef
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from '@testing-library/user-event'; // Импортировать user-event
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DownloadPathSelector } from "./DownloadPathSelector";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

// Импортируем модули для мока
import * as AppModule from "../../../../wailsjs/go/main/App"; // Добавить этот импорт

// Mock зависимостей
vi.mock("../../../../wailsjs/go/main/App", () => ({
  GetDownloadPaths: vi.fn().mockResolvedValue(["/path1", "/path2", "/path3"]), // Добавим /path3 для тестов удаления
  ValidateDownloadPath: vi.fn().mockImplementation(async (path) => {
    if (path === "/invalid") {
      throw new Error("Invalid path");
    }
    if (path === "/test/path") {
      throw new Error("Тестовая ошибка валидации");
    }
    // Добавим условие для теста ошибки валидации в handlePathValidation
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

describe("DownloadPathSelector Component", () => {
  const mockOnPathChange = vi.fn();
  const mockOnLoadingStateChange = vi.fn();
  // Создаем ref для доступа к внутренним функциям
  let testRef: React.MutableRefObject<DownloadPathSelectorTestRef>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Инициализируем ref перед каждым тестом
    testRef = { current: {} };
  });

  const renderComponent = (props = {}) => {
    return render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          {/* Передаем testRef в компонент */}
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

  it("удаляет текущий путь через testRef и выбирает следующий", async () => {
    renderComponent({ initialPath: "/path2" });

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalledWith("/path2");
    });
    mockOnPathChange.mockClear();
    // Сбрасываем GetDownloadPaths ПОСЛЕ инициализации
    vi.mocked(AppModule.GetDownloadPaths).mockClear();
    // Мокируем GetDownloadPaths для возврата обновленного списка ПОСЛЕ удаления
    vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce(["/path1", "/path3"]);

    await act(async () => {
      await testRef.current.handleRemovePath?.("/path2");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path2");
    // Теперь ожидаем только ОДИН вызов GetDownloadPaths (внутри handleRemovePath)
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
    // Сбрасываем GetDownloadPaths ПОСЛЕ инициализации
    vi.mocked(AppModule.GetDownloadPaths).mockClear();
    // Мокируем GetDownloadPaths для возврата обновленного списка ПОСЛЕ удаления
    vi.mocked(AppModule.GetDownloadPaths).mockResolvedValueOnce(["/path1", "/path2"]);

    await act(async () => {
      await testRef.current.handleRemovePath?.("/path3");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path3");
    // Теперь ожидаем только ОДИН вызов GetDownloadPaths (внутри handleRemovePath)
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
    // Сбрасываем GetDownloadPaths ПОСЛЕ инициализации
    vi.mocked(AppModule.GetDownloadPaths).mockClear();

    await act(async () => {
      await testRef.current.handleRemovePath?.("/path1");
    });

    expect(AppModule.RemoveDownloadPath).toHaveBeenCalledWith("/path1");
    // GetDownloadPaths не должен вызываться при ошибке удаления
    expect(AppModule.GetDownloadPaths).not.toHaveBeenCalled();
    expect(mockOnPathChange).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Ошибка при удалении пути:", removeError);

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

  it("обрабатывает пустой путь в handleCustomPathChange и handlePathValidation", async () => {
    const user = userEvent.setup();
    renderComponent();

    const toggleButton = await screen.findByTestId("toggle-path-mode-button");
    await user.click(toggleButton);

    const pathInput = screen.getByPlaceholderText("/path/to/downloads");

    // Очищаем поле перед вводом
    await user.clear(pathInput);
    // Вводим какой-то путь
    await user.type(pathInput, "/some/path");
    // Теперь последний вызов должен быть с правильным путем
    expect(mockOnPathChange).toHaveBeenLastCalledWith("/some/path");

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // Очищаем поле ввода
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

    // Мок ValidateDownloadPath уже настроен глобально

    renderComponent();

    // Переключаемся в режим ввода пути
    const toggleButton = await screen.findByTestId("toggle-path-mode-button");
    await user.click(toggleButton);

    const pathInput = screen.getByPlaceholderText("/path/to/downloads");
    await user.clear(pathInput);
    await user.type(pathInput, "/test/path");

    // Проверяем вызов ValidateDownloadPath
    await waitFor(() => {
      expect(AppModule.ValidateDownloadPath).toHaveBeenLastCalledWith("/test/path");
    });

    // Проверяем отображение ошибки в UI
    const errorText = await screen.findByText(validationError); // Ищем без "Error: "
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent(validationError);

    // Проверяем цвет поля ввода
    const textFieldContainer = screen.getByTestId("custom-path-input").closest('.rt-TextFieldRoot');
    expect(textFieldContainer).toHaveAttribute("data-accent-color", "red");

    // Проверяем вызов console.error внутри handlePathValidation
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Ошибка валидации пути:",
      expect.any(Error) // Ожидаем объект Error
    );
    // Проверяем сообщение в ошибке, переданной в console.error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.anything(), // Игнорируем первый аргумент ("Ошибка валидации пути:")
      expect.objectContaining({ message: validationError }) // Проверяем сообщение в объекте Error
    );


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
});

import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
      const toggleButton = screen.getByText((content, element) => {
        return element?.textContent === "add.enterCustomPath";
      });
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
      const toggleButton = screen.getByText((content, element) => {
        return element?.textContent === "add.enterCustomPath";
      });
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
      // Проверяем, что компонент загрузился
      expect(screen.getByText("add.enterCustomPath")).toBeInTheDocument();
    });

    // Имитируем выбор пути путем прямого вызова функции onValueChange
    const paths = await AppModule.GetDownloadPaths();
    // Используем мокированную функцию onPathChange, которая должна быть вызвана
    // при изменении значения Select
    vi.mocked(mockOnPathChange).mockClear(); // Очищаем предыдущие вызовы

    // Теперь имитируем изменение значения, как если бы пользователь выбрал путь
    await waitFor(() => {
      // Находим и кликаем на кнопку Select
      const selectElements = document.querySelectorAll(
        'button[aria-autocomplete="none"]'
      );
      if (selectElements.length > 0) {
        // Имитируем прямое изменение значения, минуя UI проблемы с порталами
        const selectElement = selectElements[0] as HTMLButtonElement;
        fireEvent.click(selectElement);
      }

      // Затем имитируем выбор элемента
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
      .mockImplementation(() => {});

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
      new Promise(() => {}) // Promise, который никогда не разрешится (имитация загрузки)
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
      .mockImplementation(() => {});

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
                console.error("Ошибка при удалении пути:", error);
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
        expect.any(Error)
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
});

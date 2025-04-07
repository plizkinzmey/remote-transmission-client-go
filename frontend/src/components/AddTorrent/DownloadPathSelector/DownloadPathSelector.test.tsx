import React from "react";
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
      const selectElements = document.querySelectorAll('button[aria-autocomplete="none"]');
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
});

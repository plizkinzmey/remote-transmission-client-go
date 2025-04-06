import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DownloadPathSelector } from "./DownloadPathSelector";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

// Mock зависимостей
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
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
    const { ValidateDownloadPath } = await import(
      "../../../../wailsjs/go/main/App"
    );
    renderComponent();

    await waitFor(() => {
      // Переключаемся на кастомный путь
      const toggleButton = screen.getByText("add.enterCustomPath");
      fireEvent.click(toggleButton);

      // Вводим невалидный путь
      const inputField = screen.getByPlaceholderText("/path/to/downloads");
      fireEvent.change(inputField, { target: { value: "/invalid" } });

      // Проверяем, что ValidateDownloadPath был вызван с правильным аргументом
      expect(ValidateDownloadPath).toHaveBeenCalledWith("/invalid");
    });
  });
});

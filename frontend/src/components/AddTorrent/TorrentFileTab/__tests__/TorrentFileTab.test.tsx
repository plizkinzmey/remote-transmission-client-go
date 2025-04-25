import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { TorrentFileTab } from "../TorrentFileTab";
import { MockLocalizationProvider } from "../../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../../test/mocks/theme-mock";

// Mock зависимостей
vi.mock("../../../../../wailsjs/go/main/App", () => ({
  ReadFile: vi.fn().mockResolvedValue("base64content"),
}));

// Оригинальный FileReader
const OriginalFileReader = window.FileReader;

describe("TorrentFileTab Component", () => {
  const mockOnFileSelect = vi.fn();

  // Мок для FileReader
  const fileReaderMock = {
    readAsDataURL: vi.fn(),
    onload: null as any,
    result: "data:application/x-bittorrent;base64,mockBase64Content",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Создаем мок для FileReader перед каждым тестом
    // @ts-ignore - игнорируем ошибки типов для тестирования
    window.FileReader = vi.fn(() => fileReaderMock);
  });

  afterEach(() => {
    // Восстанавливаем оригинальный FileReader после каждого теста
    window.FileReader = OriginalFileReader;
  });

  const renderComponent = (props = {}) => {
    return render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TorrentFileTab onFileSelect={mockOnFileSelect} {...props} />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );
  };

  it("отображает область для перетаскивания файлов", () => {
    renderComponent();

    expect(screen.getByText("add.dropFile")).toBeInTheDocument();
    expect(screen.getByText("add.orClickToSelect")).toBeInTheDocument();
  });

  it("отображает название файла после выбора", () => {
    renderComponent({
      torrentFileData: {
        name: "example.torrent",
        data: "base64data",
      },
    });

    expect(screen.getByText("example.torrent")).toBeInTheDocument();
    expect(mockOnFileSelect).toHaveBeenCalledWith(
      "example.torrent",
      "base64data"
    );
  });

  it("вызывает onFileSelect при выборе файла через torrentFilePath", async () => {
    const { ReadFile } = await import("../../../../../wailsjs/go/main/App");
    renderComponent({ torrentFilePath: "/path/to/file.torrent" });

    // Проверяем, что ReadFile был вызван
    expect(ReadFile).toHaveBeenCalledWith("/path/to/file.torrent");

    // Ожидаем появления имени файла
    await waitFor(() => {
      expect(screen.getByText("file.torrent")).toBeInTheDocument();
    });

    // Ожидаем вызов onFileSelect - этот вызов асинхронный, поэтому нужен waitFor
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalled();
      expect(mockOnFileSelect).toHaveBeenCalledWith(
        "file.torrent",
        "base64content"
      );
    });
  });

  it("поддерживает выбор файла через input", () => {
    renderComponent();

    const fileInputArea = screen
      .getByText("add.dropFile")
      .closest(".file-input-area");
    expect(fileInputArea).toBeInTheDocument();

    if (fileInputArea) {
      // Симулируем клик по области
      fireEvent.click(fileInputArea);

      // Создаем файловый объект
      const file = new File(["content"], "test.torrent", {
        type: "application/x-bittorrent",
      });

      // Находим скрытый input и симулируем выбор файла
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Добавляем файл в fileList
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });

      // Вызываем событие change
      fireEvent.change(fileInput);

      // Теперь эмулируем результат выполнения FileReader
      if (fileReaderMock.onload) {
        fileReaderMock.onload({ target: fileReaderMock } as any);
      }

      // Проверяем вызов readAsDataURL
      expect(fileReaderMock.readAsDataURL).toHaveBeenCalled();
    }
  });

  it("поддерживает drag-and-drop файлов торрентов", async () => {
    renderComponent();

    const dropArea = screen
      .getByText("add.dropFile")
      .closest(".file-input-area");
    expect(dropArea).toBeInTheDocument();

    if (dropArea) {
      // Тестирование dragOver
      fireEvent.dragOver(dropArea);
      expect(dropArea).toHaveClass("drag-over");

      // Тестирование dragLeave
      fireEvent.dragLeave(dropArea);
      expect(dropArea).not.toHaveClass("drag-over");

      // Тестирование drop с торрент-файлом
      const file = new File(["content"], "test.torrent", {
        type: "application/x-bittorrent",
      });
      const dataTransfer = {
        files: [file],
        clearData: vi.fn(),
      };

      // Симулируем событие drop
      fireEvent.drop(dropArea, { dataTransfer });

      // После drop класс drag-over должен быть удален
      expect(dropArea).not.toHaveClass("drag-over");

      // Проверяем, что readAsDataURL был вызван
      expect(fileReaderMock.readAsDataURL).toHaveBeenCalled();
    }
  });

  it("игнорирует drop для не-торрент файлов", () => {
    renderComponent();

    const dropArea = screen
      .getByText("add.dropFile")
      .closest(".file-input-area");

    if (dropArea) {
      // Создаем не-торрент файл
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const dataTransfer = {
        files: [file],
        clearData: vi.fn(),
      };

      // Симулируем dragOver и drop
      fireEvent.dragOver(dropArea);
      fireEvent.drop(dropArea, { dataTransfer });

      // FileReader не должен быть вызван для не-торрент файлов
      expect(fileReaderMock.readAsDataURL).not.toHaveBeenCalled();
    }
  });

  it("обрабатывает ошибку при чтении файла через Wails API", async () => {
    const { ReadFile } = await import("../../../../../wailsjs/go/main/App");
    vi.mocked(ReadFile).mockRejectedValueOnce(new Error("Test error"));

    // Создаем мок для console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => { });

    renderComponent({ torrentFilePath: "/path/to/invalid-file.torrent" });

    await waitFor(() => {
      expect(ReadFile).toHaveBeenCalledWith("/path/to/invalid-file.torrent");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Ошибка при чтении файла через Wails API:",
        expect.any(Error)
      );
    });

    // Восстанавливаем оригинальный console.error
    consoleErrorSpy.mockRestore();
  });
});

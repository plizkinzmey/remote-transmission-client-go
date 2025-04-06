import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TorrentFileTab } from "./TorrentFileTab";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

// Mock зависимостей
vi.mock("../../../../wailsjs/go/main/App", () => ({
  ReadFile: vi.fn().mockResolvedValue("base64content"),
}));

describe("TorrentFileTab Component", () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
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
    const { ReadFile } = await import("../../../../wailsjs/go/main/App");
    renderComponent({ torrentFilePath: "/path/to/file.torrent" });

    // Проверяем, что ReadFile был вызван
    expect(ReadFile).toHaveBeenCalledWith("/path/to/file.torrent");

    // Ожидаем появления имени файла
    expect(screen.getByText("file.torrent")).toBeInTheDocument();
  });

  it("поддерживает drag-and-drop файлов", () => {
    renderComponent();

    const dropArea = screen
      .getByText("add.dropFile")
      .closest(".file-input-area");
    expect(dropArea).toBeInTheDocument();

    // Мокаем File API
    const file = new File(["content"], "test.torrent", {
      type: "application/x-bittorrent",
    });
    Object.defineProperty(file, "name", { value: "test.torrent" });

    // Эмулируем события drag-and-drop
    if (dropArea) {
      fireEvent.dragOver(dropArea);
      expect(dropArea).toHaveClass("drag-over");

      const dataTransfer = { files: [file] };
      fireEvent.drop(dropArea, { dataTransfer });

      // После drop drag-over класс должен быть удален
      expect(dropArea).not.toHaveClass("drag-over");
    }
  });
});

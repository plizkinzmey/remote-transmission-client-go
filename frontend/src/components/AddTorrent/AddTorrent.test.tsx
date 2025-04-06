import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AddTorrent } from "./AddTorrent";
import { LocalizationProvider } from "../../contexts/LocalizationContext";

// Mock зависимостей
vi.mock("../../../wailsjs/go/main/App", () => ({
  ValidateDownloadPath: vi.fn().mockResolvedValue(true),
  GetDownloadPaths: vi.fn().mockResolvedValue(["/default/path"]),
  RemoveDownloadPath: vi.fn(),
  ReadFile: vi.fn().mockResolvedValue("base64content"),
}));

const mockOnAdd = vi.fn().mockResolvedValue(true);
const mockOnAddFile = vi.fn().mockResolvedValue(true);
const mockOnClose = vi.fn();

describe("AddTorrent Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <LocalizationProvider>
        <AddTorrent
          onAdd={mockOnAdd}
          onAddFile={mockOnAddFile}
          onClose={mockOnClose}
          {...props}
        />
      </LocalizationProvider>
    );
  };

  it("отображает модальное окно", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId("add-torrent-modal")).toBeInTheDocument();
    });
  });

  it("переключается между вкладками URL и File", async () => {
    renderComponent();

    await waitFor(() => {
      const urlTab = screen.getByText("add.url");
      const fileTab = screen.getByText("add.file");

      expect(urlTab).toBeInTheDocument();
      expect(fileTab).toBeInTheDocument();

      // Переключаемся на вкладку File
      fireEvent.click(fileTab);

      // Проверяем, что активна вкладка File
      expect(screen.getByText("add.dropFile")).toBeInTheDocument();
    });
  });

  it("вызывает onAdd при отправке URL-формы", async () => {
    renderComponent();

    await waitFor(() => {
      // Вводим URL
      const urlInput = screen.getByPlaceholderText("magnet:?xt=urn:btih:...");
      fireEvent.change(urlInput, { target: { value: "magnet:test" } });

      // Нажимаем кнопку добавления
      const addButton = screen.getByText("add.add");
      fireEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith("magnet:test", "/default/path");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("отображает поле выбора пути загрузки", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("add.downloadPath")).toBeInTheDocument();
    });
  });

  it("автоматически переключается на вкладку File при передаче torrentFileData", async () => {
    const torrentFileData = {
      name: "test.torrent",
      data: "base64data",
    };

    renderComponent({ torrentFileData });

    await waitFor(() => {
      expect(screen.getByText("test.torrent")).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TorrentUrlTab } from "./TorrentUrlTab";

describe("TorrentUrlTab Component", () => {
  const mockOnUrlChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("отображает поле ввода URL", () => {
    render(<TorrentUrlTab onUrlChange={mockOnUrlChange} />);

    const urlInput = screen.getByPlaceholderText("magnet:?xt=urn:btih:...");
    expect(urlInput).toBeInTheDocument();
  });

  it("вызывает onUrlChange при изменении URL", () => {
    render(<TorrentUrlTab onUrlChange={mockOnUrlChange} />);

    const urlInput = screen.getByPlaceholderText("magnet:?xt=urn:btih:...");
    fireEvent.change(urlInput, { target: { value: "magnet:test" } });

    expect(mockOnUrlChange).toHaveBeenCalledWith("magnet:test");
  });

  it("отображает initialUrl, если он передан", () => {
    const initialUrl = "magnet:initial";
    render(
      <TorrentUrlTab onUrlChange={mockOnUrlChange} initialUrl={initialUrl} />
    );

    const urlInput = screen.getByPlaceholderText(
      "magnet:?xt=urn:btih:..."
    ) as HTMLInputElement;
    expect(urlInput.value).toBe(initialUrl);
  });

  it("обновляет отображаемый URL при изменении props", () => {
    const { rerender } = render(
      <TorrentUrlTab
        onUrlChange={mockOnUrlChange}
        initialUrl="magnet:initial"
      />
    );

    // Перерендерим с новым initialUrl
    rerender(
      <TorrentUrlTab
        onUrlChange={mockOnUrlChange}
        initialUrl="magnet:updated"
      />
    );

    const urlInput = screen.getByPlaceholderText(
      "magnet:?xt=urn:btih:..."
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("magnet:updated");
  });
});

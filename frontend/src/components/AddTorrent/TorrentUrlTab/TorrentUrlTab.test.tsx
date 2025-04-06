import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TorrentUrlTab } from "./TorrentUrlTab";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

describe("TorrentUrlTab Component", () => {
  const mockOnUrlChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TorrentUrlTab onUrlChange={mockOnUrlChange} {...props} />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );
  };

  it("отображает поле ввода URL", () => {
    renderComponent();

    const urlInput = screen.getByPlaceholderText("magnet:?xt=urn:btih:...");
    expect(urlInput).toBeInTheDocument();
  });

  it("вызывает onUrlChange при изменении URL", () => {
    renderComponent();

    const urlInput = screen.getByPlaceholderText("magnet:?xt=urn:btih:...");
    fireEvent.change(urlInput, { target: { value: "magnet:test" } });

    expect(mockOnUrlChange).toHaveBeenCalledWith("magnet:test");
  });

  it("отображает initialUrl, если он передан", () => {
    const initialUrl = "magnet:initial";
    renderComponent({ initialUrl });

    const urlInput = screen.getByPlaceholderText(
      "magnet:?xt=urn:btih:..."
    ) as HTMLInputElement;
    expect(urlInput.value).toBe(initialUrl);
  });

  it("обновляет отображаемый URL при изменении props", () => {
    const { rerender } = render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TorrentUrlTab
            onUrlChange={mockOnUrlChange}
            initialUrl="magnet:initial"
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    // Перерендерим с новым initialUrl
    rerender(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <TorrentUrlTab
            onUrlChange={mockOnUrlChange}
            initialUrl="magnet:updated"
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    const urlInput = screen.getByPlaceholderText(
      "magnet:?xt=urn:btih:..."
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("magnet:updated");
  });
});

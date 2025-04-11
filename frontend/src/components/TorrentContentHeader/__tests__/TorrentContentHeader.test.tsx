import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TorrentContentHeader } from "../TorrentContentHeader";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

describe("TorrentContentHeader", () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <TorrentContentHeader
                        torrentName="Test Torrent"
                        onClose={mockOnClose}
                        {...props}
                    />
                </MockLocalizationProvider>
            </TestThemeProvider>
        );
    };

    it("отображает название торрента", () => {
        renderComponent();

        const titleElement = screen.getByTestId("torrent-title");
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveTextContent("Test Torrent");
    });

    it("отображает кнопку закрытия", () => {
        renderComponent();

        const closeButton = screen.getByTestId("close-button");
        expect(closeButton).toBeInTheDocument();
    });

    it("вызывает onClose при клике на кнопку закрытия", () => {
        renderComponent();

        const closeButton = screen.getByTestId("close-button");
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("корректно обрабатывает длинные названия торрентов", () => {
        const longName = "Очень длинное название торрента, которое должно быть обрезано в интерфейсе".repeat(3);
        renderComponent({ torrentName: longName });

        const titleElement = screen.getByTestId("torrent-title");
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveAttribute("title", longName);
    });
});
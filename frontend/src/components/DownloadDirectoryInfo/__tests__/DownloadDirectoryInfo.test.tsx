import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DownloadDirectoryInfo } from "../DownloadDirectoryInfo";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

describe("DownloadDirectoryInfo", () => {
    const renderComponent = (props = {}) => {
        return render(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <DownloadDirectoryInfo
                        path="/path/to/directory"
                        {...props}
                    />
                </MockLocalizationProvider>
            </TestThemeProvider>
        );
    };

    it("отображает путь к директории загрузки", () => {
        renderComponent();

        const pathElement = screen.getByTestId("download-path");
        expect(pathElement).toBeInTheDocument();
        expect(pathElement).toHaveTextContent("/path/to/directory");
    });

    it("отображает заголовок с помощью локализации", () => {
        renderComponent();

        expect(screen.getByText(/torrent\.downloadDirectory/i)).toBeInTheDocument();
    });

    it("имеет тултип для длинных путей", () => {
        const longPath = "/very/long/path/to/directory/that/should/be/truncated/in/the/ui";
        renderComponent({ path: longPath });

        const pathElement = screen.getByTestId("download-path");
        expect(pathElement).toHaveAttribute("title", longPath);
    });

    it("не рендерится при пустом пути", () => {
        const { queryByTestId } = renderComponent({ path: "" });

        // Проверяем что компонент не отрендерился
        expect(queryByTestId("download-directory-info")).not.toBeInTheDocument();
    });

    it("содержит иконку папки", () => {
        renderComponent();

        // Находим иконку - проверяем что первый элемент svg в контейнере
        const container = screen.getByTestId("download-directory-info");
        const icon = container.querySelector("svg");
        expect(icon).toBeInTheDocument();
    });
});
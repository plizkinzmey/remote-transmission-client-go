import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SelectAllFiles } from "../SelectAllFiles";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

describe("SelectAllFiles", () => {
    const mockToggleAll = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <SelectAllFiles
                        allChecked={false}
                        indeterminate={false}
                        onToggleAll={mockToggleAll}
                        {...props}
                    />
                </MockLocalizationProvider>
            </TestThemeProvider>
        );
    };

    it("отображает чекбокс", () => {
        renderComponent();

        const checkbox = screen.getByTestId("select-all-checkbox");
        expect(checkbox).toBeInTheDocument();
    });

    it("отображает текст выбора всех файлов", () => {
        renderComponent();

        const label = screen.getByTestId("select-all-label");
        expect(label).toBeInTheDocument();
        expect(label).toHaveTextContent("torrent.selectAll");
    });

    it("корректно отображает отмеченный чекбокс", () => {
        renderComponent({ allChecked: true });

        const checkbox = screen.getByTestId("select-all-checkbox");
        expect(checkbox).toHaveAttribute("data-state", "checked");
    });

    it("корректно отображает неотмеченный чекбокс", () => {
        renderComponent({ allChecked: false });

        const checkbox = screen.getByTestId("select-all-checkbox");
        expect(checkbox).toHaveAttribute("data-state", "unchecked");
    });

    it("вызывает onToggleAll при клике на чекбокс", () => {
        renderComponent();

        const checkbox = screen.getByTestId("select-all-checkbox");
        fireEvent.click(checkbox);

        expect(mockToggleAll).toHaveBeenCalledTimes(1);
    });

    it("добавляет класс для промежуточного состояния", () => {
        renderComponent({ indeterminate: true });

        const checkbox = screen.getByTestId("select-all-checkbox");
        expect(checkbox.closest(".indeterminate-checkbox")).toBeInTheDocument();
    });

    it("не добавляет класс для промежуточного состояния, если indeterminate=false", () => {
        renderComponent({ indeterminate: false });

        const checkbox = screen.getByTestId("select-all-checkbox");
        expect(checkbox.closest(".indeterminate-checkbox")).toBeNull();
    });
});
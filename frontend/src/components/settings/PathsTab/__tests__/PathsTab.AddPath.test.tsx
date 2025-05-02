import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PathsTab } from "../PathsTab";
import { usePathsManagement } from "../hooks/usePathsManagement";
import { useLocalization } from "@contexts/LocalizationContext";

// Моки
vi.mock("../hooks/usePathsManagement");
vi.mock("@contexts/LocalizationContext");

// Мок для Radix Tooltip
vi.mock("@radix-ui/themes", async (importOriginal) => {
    const original = await importOriginal<typeof import("@radix-ui/themes")>();
    return {
        ...original,
        Tooltip: ({ children, content }: { children: React.ReactNode, content: string }) => (
            <div data-testid="mock-tooltip" data-tooltip-content={content}>{children}</div>
        ),
    };
});

describe("PathsTab - Добавление пути", () => {
    const defaultHookState = {
        paths: ["/path/one", "/path/two"],
        defaultPath: "/path/one",
        newPath: "",
        isLoading: false,
        pathError: "",
        pathWithConfirmDelete: null,
        isDuplicatePath: false,
        showDuplicateTooltip: false,
        hasChanges: false,
        setNewPathValue: vi.fn(),
        handleAddPath: vi.fn(),
        handleDeletePathRequest: vi.fn(),
        handleConfirmInlineDelete: vi.fn(),
        cancelDelete: vi.fn(),
        handleSetDefaultPath: vi.fn(),
        saveChanges: vi.fn(),
        resetChanges: vi.fn(),
        getPathChanges: vi.fn(),
    };

    const mockOnPathsChanged = vi.fn();
    let mockUsePathsManagement: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePathsManagement = vi.mocked(usePathsManagement);
        mockUsePathsManagement.mockReturnValue(defaultHookState);

        vi.mocked(useLocalization).mockReturnValue({
            t: (key: string) => key,
            currentLanguage: "en",
            setLanguage: vi.fn(),
            availableLanguages: [
                { code: "en", name: "English" },
                { code: "ru", name: "Русский" },
            ],
            isLoading: false,
        });
    });

    it("должен обрабатывать изменение значения в поле ввода", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const input = screen.getByTestId("new-path-input");
        fireEvent.change(input, { target: { value: "/new/path" } });
        expect(defaultHookState.setNewPathValue).toHaveBeenCalledWith("/new/path");
    });

    it("должен отображать ошибку валидации", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathError: "Invalid path"
        });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("new-path-error")).toHaveTextContent("Invalid path");
    });

    it("должен отображать предупреждение о дубликате", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            isDuplicatePath: true,
            showDuplicateTooltip: true
        });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const addButton = screen.getByTestId("add-path-button");
        const tooltipWrapper = addButton.closest('[data-testid="mock-tooltip"]');
        expect(tooltipWrapper).toHaveAttribute("data-tooltip-content", "settings.pathAlreadyExists");
    });

    it("должен дизейблить кнопку добавления при пустом пути", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            newPath: "  "
        });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("add-path-button")).toBeDisabled();
    });

    it("должен вызывать handleAddPath при клике по кнопке", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            newPath: "/new/path"
        });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const addButton = screen.getByTestId("add-path-button");
        fireEvent.click(addButton);
        expect(defaultHookState.handleAddPath).toHaveBeenCalled();
    });
});
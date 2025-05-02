import React from "react";
import { render, screen } from "@testing-library/react";
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

describe("PathsTab - Стили и валидация", () => {
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

    it("должен применять красный цвет для TextField при наличии ошибки", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathError: "Invalid path error",
            isDuplicatePath: false
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const textField = screen.getByTestId("new-path-input").closest(".rt-TextFieldRoot");
        expect(textField).toHaveAttribute("data-accent-color", "red");
    });

    it("должен применять красный цвет для TextField при обнаружении дубликата", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathError: "",
            isDuplicatePath: true
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const textField = screen.getByTestId("new-path-input").closest(".rt-TextFieldRoot");
        expect(textField).toHaveAttribute("data-accent-color", "red");
    });

    it("должен применять нейтральные стили при отсутствии ошибок", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathError: "",
            isDuplicatePath: false
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const textField = screen.getByTestId("new-path-input").closest(".rt-TextFieldRoot");
        expect(textField).not.toHaveAttribute("data-accent-color", "red");
    });

    it("должен применять правильные CSS классы к элементам пути", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(defaultPathItem.className).toContain("defaultPathItem");

        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        expect(nonDefaultPathItem.className).not.toContain("defaultPathItem");
    });
});

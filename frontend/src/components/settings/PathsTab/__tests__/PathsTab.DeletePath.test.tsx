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

// Мок для Radix Tooltip Provider
vi.mock("@radix-ui/react-tooltip", () => ({
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Content: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Мок для иконок
vi.mock("@heroicons/react/24/outline", () => ({
    TrashIcon: () => <svg data-testid="trash-icon" />,
    StarIcon: () => <svg data-testid="star-icon" />,
    ClipboardIcon: () => <svg data-testid="clipboard-icon" />,
}));

describe("PathsTab - Удаление пути", () => {
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

    it("должен показывать кнопку удаления только для путей, которые не являются путями по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const deleteButtons = screen.getAllByTestId(/^delete-button-/);

        // Ожидаем только одну кнопку удаления, так как путь по умолчанию не имеет кнопки удаления
        expect(deleteButtons).toHaveLength(1);

        // Проверяем, что кнопка удаления существует только для не дефолтного пути
        expect(screen.queryByTestId("delete-button-/path/one")).not.toBeInTheDocument();
        expect(screen.getByTestId("delete-button-/path/two")).toBeInTheDocument();
    });

    it("должен вызывать handleDeletePathRequest при нажатии на кнопку удаления", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const deleteButton = screen.getByTestId("delete-button-/path/two");
        fireEvent.click(deleteButton);
        expect(defaultHookState.handleDeletePathRequest).toHaveBeenCalledWith("/path/two");
    });

    it("должен отображать подтверждение удаления", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathWithConfirmDelete: pathToDelete
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        // Проверяем наличие кнопок подтверждения и отмены
        const confirmButton = screen.getByTestId(`confirm-delete-button-${pathToDelete}`);
        const cancelButton = screen.getByTestId(`cancel-delete-button-${pathToDelete}`);
        expect(confirmButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();

        // Проверяем, что обычные кнопки скрыты
        expect(screen.queryByTestId(`delete-button-${pathToDelete}`)).not.toBeInTheDocument();
        expect(screen.queryByTestId(`set-default-button-${pathToDelete}`)).not.toBeInTheDocument();
    });

    it("должен вызывать handleConfirmInlineDelete при подтверждении", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathWithConfirmDelete: pathToDelete
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const confirmButton = screen.getByTestId(`confirm-delete-button-${pathToDelete}`);
        fireEvent.click(confirmButton);
        expect(defaultHookState.handleConfirmInlineDelete).toHaveBeenCalledWith(pathToDelete);
    });

    it("должен вызывать cancelDelete при отмене", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathWithConfirmDelete: pathToDelete
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const cancelButton = screen.getByTestId(`cancel-delete-button-${pathToDelete}`);
        fireEvent.click(cancelButton);
        expect(defaultHookState.cancelDelete).toHaveBeenCalled();
    });

    it("не должен отображать кнопку удаления для пути по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        // Проверяем, что для дефолтного пути не отображается кнопка удаления
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(defaultPathItem.querySelector("[data-testid='delete-button-/path/one']")).not.toBeInTheDocument();

        // Проверяем, что индикатор дефолтного пути присутствует
        expect(defaultPathItem.querySelector("[data-testid='is-default-indicator-/path/one']")).toBeInTheDocument();
    });
});
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

describe("PathsTab - Управление путем по умолчанию", () => {
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

    it("должен отображать индикатор пути по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        const defaultIndicator = defaultPathItem.querySelector("[data-testid='is-default-indicator-/path/one']");
        expect(defaultIndicator).toBeInTheDocument();
        expect(defaultIndicator?.querySelector("[data-testid='star-icon']")).toBeInTheDocument();
    });

    it("должен отображать кнопку 'Сделать по умолчанию' для не дефолтных путей", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        const setDefaultButton = nonDefaultPathItem.querySelector("[data-testid='set-default-button-/path/two']");
        expect(setDefaultButton).toBeInTheDocument();
    });

    it("должен вызывать handleSetDefaultPath при клике по кнопке установки по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const setDefaultButton = screen.getByTestId("set-default-button-/path/two");
        fireEvent.click(setDefaultButton);
        expect(defaultHookState.handleSetDefaultPath).toHaveBeenCalledWith("/path/two");
    });

    it("должен применять соответствующий CSS класс к пути по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(defaultPathItem.className).toContain("defaultPathItem");

        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        expect(nonDefaultPathItem.className).not.toContain("defaultPathItem");
    });

    it("должен всегда показывать путь по умолчанию первым в списке", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            paths: ["/path/three", "/path/one", "/path/two"],
            defaultPath: "/path/two"
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const pathItems = screen.getAllByTestId(/^path-item-/);
        expect(pathItems[0]).toHaveAttribute("data-testid", "path-item-/path/two");
    });

    it("не должен отображать кнопку удаления для пути по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        // Проверяем, что кнопка удаления отсутствует для пути по умолчанию
        const deleteButton = defaultPathItem.querySelector("[data-testid='delete-button-/path/one']");
        expect(deleteButton).not.toBeInTheDocument();

        // Проверяем, что кнопка удаления присутствует для не дефолтного пути
        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        const nonDefaultDeleteButton = nonDefaultPathItem.querySelector("[data-testid='delete-button-/path/two']");
        expect(nonDefaultDeleteButton).toBeInTheDocument();
    });

    it("должен показывать тултип для индикатора пути по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        const defaultIndicator = defaultPathItem.querySelector("[data-testid='is-default-indicator-/path/one']");

        // Проверяем наличие тултипа через мок
        const tooltipWrapper = defaultIndicator?.closest('[data-testid="mock-tooltip"]');
        expect(tooltipWrapper).toBeDefined();
        expect(tooltipWrapper).toHaveAttribute("data-tooltip-content", "settings.isDefaultPath");
    });

    it("должен обновить UI при изменении defaultPath", () => {
        const { rerender } = render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        // Проверяем начальное состояние
        let defaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(defaultPathItem.className).toContain("defaultPathItem");

        // Изменяем defaultPath в моке
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            defaultPath: "/path/two"
        });

        // Ререндер компонента
        rerender(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        // Проверяем новое состояние
        const newDefaultPathItem = screen.getByTestId("path-item-/path/two");
        expect(newDefaultPathItem.className).toContain("defaultPathItem");

        // Проверяем, что старый путь больше не является по умолчанию
        const oldDefaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(oldDefaultPathItem.className).not.toContain("defaultPathItem");
    });
});

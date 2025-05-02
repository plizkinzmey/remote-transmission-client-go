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

// Мок для иконок
vi.mock("@heroicons/react/24/outline", () => ({
    TrashIcon: () => <svg data-testid="trash-icon" />,
    StarIcon: () => <svg data-testid="star-icon" />,
    ClipboardIcon: () => <svg data-testid="clipboard-icon" />,
    ClipboardDocumentCheckIcon: () => <svg data-testid="clipboard-check-icon" />,
    ExclamationCircleIcon: () => <svg data-testid="exclamation-circle-icon" />,
}));

describe("PathsTab - Рендеринг", () => {
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

        // Мок для локализации
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

    it("должен отображать состояние загрузки", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, isLoading: true });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });

    it("должен корректно отображать список путей", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("paths-list-container")).toBeInTheDocument();
        expect(screen.getByTestId("path-item-/path/one")).toBeInTheDocument();
        expect(screen.getByTestId("path-item-/path/two")).toBeInTheDocument();
    });

    it("должен отображать пустое состояние при отсутствии путей", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, paths: [] });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.queryByTestId("paths-list-container")).not.toBeInTheDocument();
    });

    it("должен показывать индикатор пути по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        const defaultIndicator = defaultPathItem.querySelector("[data-testid='is-default-indicator-/path/one']");
        expect(defaultIndicator).toBeInTheDocument();
        expect(defaultIndicator?.querySelector("[data-testid='star-icon']")).toBeInTheDocument();
    });
});
import React, { createRef } from "react";
import { render, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PathsTab, PathsTabRef } from "../PathsTab";
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

describe("PathsTab - Функциональность ref", () => {
    const mockSaveChanges = vi.fn();
    const mockResetChanges = vi.fn();
    const mockGetPathChanges = vi.fn();
    const mockOnPathsChanged = vi.fn();

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
        saveChanges: mockSaveChanges,
        resetChanges: mockResetChanges,
        getPathChanges: mockGetPathChanges,
    };

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

        mockSaveChanges.mockResolvedValue(undefined);
        mockResetChanges.mockImplementation(() => {
            mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: false });
        });
        mockGetPathChanges.mockReturnValue({ pathsToAdd: [], pathsToRemove: [], defaultPath: null });
    });

    it("должен предоставлять доступ к hasChanges через ref", () => {
        const ref = createRef<PathsTabRef>();
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: true });

        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);
        expect(ref.current).toBeDefined();
        expect(ref.current?.hasChanges).toBe(true);
    });

    it("должен предоставлять функцию saveChanges через ref", async () => {
        const ref = createRef<PathsTabRef>();
        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);

        expect(ref.current).toBeDefined();
        await act(async () => {
            await ref.current?.saveChanges();
        });
        expect(mockSaveChanges).toHaveBeenCalledTimes(1);
    });

    it("должен предоставлять функцию resetChanges через ref", () => {
        const ref = createRef<PathsTabRef>();
        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);

        expect(ref.current).toBeDefined();
        act(() => {
            ref.current?.resetChanges();
        });
        expect(mockResetChanges).toHaveBeenCalledTimes(1);
    });

    it("должен предоставлять функцию getPathChanges через ref", () => {
        const ref = createRef<PathsTabRef>();
        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);

        expect(ref.current).toBeDefined();
        ref.current?.getPathChanges();
        expect(mockGetPathChanges).toHaveBeenCalledTimes(1);
    });

    it("должен передавать onPathsChanged в хук usePathsManagement", () => {
        const ref = createRef<PathsTabRef>();
        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);

        expect(usePathsManagement).toHaveBeenCalledWith({ onPathsChanged: mockOnPathsChanged });
    });
});

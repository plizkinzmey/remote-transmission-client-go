import React, { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { PathsTab, PathsTabRef } from "../PathsTab"; // Adjust import based on your structure
import { usePathsManagement } from "../hooks/usePathsManagement";
import { useLocalization } from "../../../../contexts/LocalizationContext"; // Corrected path again

// Mock the custom hook
vi.mock("../hooks/usePathsManagement");

// Mock Localization context
vi.mock("../../../../contexts/LocalizationContext"); // Corrected path again

// Mock Radix Tooltip as it involves portals and complex interactions
vi.mock("@radix-ui/themes", async (importOriginal) => {
    const original = await importOriginal<typeof import("@radix-ui/themes")>();
    return {
        ...original,
        Tooltip: ({ children, content }: { children: React.ReactNode, content: string }) => (
            <div data-testid="mock-tooltip" data-tooltip-content={content}>{children}</div>
        ),
    };
});

// Mock Heroicons
vi.mock("@heroicons/react/24/outline", () => ({
    TrashIcon: () => <svg data-testid="trash-icon" />,
    StarIcon: () => <svg data-testid="star-icon" />,
}));

describe("PathsTab Component", () => {
    let mockUsePathsManagement: Mock;
    let mockT: Mock;
    const mockOnPathsChanged = vi.fn();
    const mockSaveChanges = vi.fn();
    const mockResetChanges = vi.fn();
    const mockGetPathChanges = vi.fn();
    const mockSetNewPathValue = vi.fn();
    const mockHandleAddPath = vi.fn();
    const mockHandleDeletePathRequest = vi.fn();
    const mockHandleConfirmInlineDelete = vi.fn();
    const mockCancelDelete = vi.fn();
    const mockHandleSetDefaultPath = vi.fn();

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
        setNewPathValue: mockSetNewPathValue,
        handleAddPath: mockHandleAddPath,
        handleDeletePathRequest: mockHandleDeletePathRequest,
        handleConfirmInlineDelete: mockHandleConfirmInlineDelete,
        cancelDelete: mockCancelDelete,
        handleSetDefaultPath: mockHandleSetDefaultPath,
        saveChanges: mockSaveChanges,
        resetChanges: mockResetChanges,
        getPathChanges: mockGetPathChanges,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset hook state before each test
        mockUsePathsManagement = vi.mocked(usePathsManagement);
        mockUsePathsManagement.mockReturnValue(defaultHookState);

        mockT = vi.fn((key) => key); // Simple mock for translation
        vi.mocked(useLocalization).mockReturnValue({
            t: mockT,
            currentLanguage: "en",
            setLanguage: vi.fn(),
            availableLanguages: [
                { code: "en", name: "English" }, // Corrected mock value
                { code: "ru", name: "Русский" }, // Corrected mock value
            ],
            isLoading: false,
        });

        mockSaveChanges.mockResolvedValue(undefined);
        mockResetChanges.mockImplementation(() => {
            mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: false });
        });
        mockGetPathChanges.mockReturnValue({ pathsToAdd: [], pathsToRemove: [], defaultPath: null });
    });

    it("should render loading state", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, isLoading: true });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith("loading");
    });

    it("should render paths list correctly", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        expect(screen.getByTestId("paths-list-container")).toBeInTheDocument();
        expect(screen.getByTestId("path-item-/path/one")).toBeInTheDocument();
        expect(screen.getByTestId("path-item-/path/two")).toBeInTheDocument();

        // Check default path indicator (StarIcon should be present and colored)
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(defaultPathItem.querySelector("[data-testid='star-icon']")).toBeInTheDocument();
        // Check tooltip for default path
        const defaultTooltip = defaultPathItem.closest('[data-testid="mock-tooltip"]');
        expect(defaultTooltip).toHaveAttribute("data-tooltip-content", "settings.isDefaultPath");

        // Check non-default path actions
        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        expect(nonDefaultPathItem.querySelector("[data-testid='set-default-button-/path/two']")).toBeInTheDocument();
        expect(nonDefaultPathItem.querySelector("[data-testid='delete-button-/path/two']")).toBeInTheDocument();
    });

    it("should render empty state when no paths are available", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, paths: [] });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.queryByTestId("paths-list-container")).not.toBeInTheDocument();
        expect(screen.getByTestId("new-path-input")).toBeInTheDocument(); // Add section should still be there
    });

    it("should handle new path input change", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const input = screen.getByTestId("new-path-input");
        fireEvent.change(input, { target: { value: "/new/path" } });
        expect(mockSetNewPathValue).toHaveBeenCalledWith("/new/path");
    });

    it("should display validation error", () => {
        const errorMsg = "Invalid path";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathError: errorMsg });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const errorElement = screen.getByTestId("new-path-error");
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(errorMsg);
        // Check input color (assuming Radix applies color prop as class or style)
        // This might need adjustment based on actual Radix implementation
        // expect(screen.getByTestId("new-path-input")).toHaveStyle({ color: 'red' });
    });

    it("should display duplicate path tooltip", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, isDuplicatePath: true, showDuplicateTooltip: true });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const tooltip = screen.getByTestId("duplicate-path-tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveAttribute("data-tooltip-content", "settings.pathAlreadyExists");
        // Check button color (assuming Radix applies color prop as class or style)
        // expect(screen.getByTestId("add-path-button")).toHaveStyle({ color: 'red' });
    });

    it("should call handleAddPath on add button click", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, newPath: "/some/path" });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const addButton = screen.getByTestId("add-path-button");
        fireEvent.click(addButton);
        expect(mockHandleAddPath).toHaveBeenCalledTimes(1);
    });

    it("should disable add button if newPath is empty or loading", () => {
        // Test empty path
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, newPath: "  " });
        const { rerender } = render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("add-path-button")).toBeDisabled();

        // Test loading state
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, newPath: "/path", isLoading: true });
        rerender(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("add-path-button")).toBeDisabled();
    });

    it("should call handleSetDefaultPath on set default button click", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const setDefaultButton = screen.getByTestId("set-default-button-/path/two");
        fireEvent.click(setDefaultButton);
        expect(mockHandleSetDefaultPath).toHaveBeenCalledWith("/path/two");
    });

    it("should call handleDeletePathRequest on delete button click", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const deleteButton = screen.getByTestId("delete-button-/path/two");
        fireEvent.click(deleteButton);
        expect(mockHandleDeletePathRequest).toHaveBeenCalledWith("/path/two");
    });

    it("should render delete confirmation view", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathWithConfirmDelete: pathToDelete });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const pathItem = screen.getByTestId(`path-item-${pathToDelete}`);
        expect(pathItem.querySelector(`[data-testid='confirm-delete-button-${pathToDelete}']`)).toBeInTheDocument();
        expect(pathItem.querySelector(`[data-testid='cancel-delete-button-${pathToDelete}']`)).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith("settings.confirmDeletePath");

        // Check that normal buttons are hidden
        expect(pathItem.querySelector(`[data-testid='set-default-button-${pathToDelete}']`)).not.toBeInTheDocument();
        expect(pathItem.querySelector(`[data-testid='delete-button-${pathToDelete}']`)).not.toBeInTheDocument();
    });

    it("should call handleConfirmInlineDelete on confirm delete click", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathWithConfirmDelete: pathToDelete });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const confirmButton = screen.getByTestId(`confirm-delete-button-${pathToDelete}`);
        fireEvent.click(confirmButton);
        expect(mockHandleConfirmInlineDelete).toHaveBeenCalledWith(pathToDelete);
    });

    it("should call cancelDelete on cancel delete click", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathWithConfirmDelete: pathToDelete });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const cancelButton = screen.getByTestId(`cancel-delete-button-${pathToDelete}`);
        fireEvent.click(cancelButton);
        expect(mockCancelDelete).toHaveBeenCalledTimes(1);
    });

    it("should call onPathsChanged when hasChanges updates", () => {
        const { rerender } = render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(mockOnPathsChanged).not.toHaveBeenCalled(); // Initially false

        // Simulate hook updating hasChanges to true
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: true });
        rerender(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(mockOnPathsChanged).toHaveBeenCalledWith(true);

        // Simulate hook updating hasChanges back to false
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: false });
        rerender(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(mockOnPathsChanged).toHaveBeenCalledWith(false);
    });

    it("should expose saveChanges, resetChanges, getPathChanges, and hasChanges via ref", async () => {
        const ref = createRef<PathsTabRef>();
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: true });
        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);

        expect(ref.current).toBeDefined();
        expect(ref.current?.hasChanges).toBe(true);

        // Test saveChanges
        await act(async () => {
            await ref.current?.saveChanges();
        });
        expect(mockSaveChanges).toHaveBeenCalledTimes(1);

        // Test resetChanges
        act(() => {
            ref.current?.resetChanges();
        });
        expect(mockResetChanges).toHaveBeenCalledTimes(1);

        // Test getPathChanges
        ref.current?.getPathChanges();
        expect(mockGetPathChanges).toHaveBeenCalledTimes(1);
    });
});

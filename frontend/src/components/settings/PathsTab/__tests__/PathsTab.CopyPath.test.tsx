import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
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

describe("PathsTab - Функциональность копирования пути", () => {
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
    let originalClipboard: any;
    let mockClipboardWriteText: ReturnType<typeof vi.fn>;

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

        // Настройка мока clipboard API
        originalClipboard = navigator.clipboard;
        mockClipboardWriteText = vi.fn();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: mockClipboardWriteText },
            writable: true
        });
        mockClipboardWriteText.mockResolvedValue(undefined);
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: originalClipboard,
            writable: true
        });
    });

    it("должна отображать кнопку копирования для каждого пути", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton1 = screen.getByTestId("copy-button-/path/one");
        const copyButton2 = screen.getByTestId("copy-button-/path/two");

        expect(copyButton1).toBeInTheDocument();
        expect(copyButton2).toBeInTheDocument();
        expect(copyButton1.querySelector("[data-testid='clipboard-icon']")).toBeInTheDocument();
    });

    it("должна копировать путь в буфер обмена при нажатии на кнопку", async () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/two");

        await act(async () => {
            fireEvent.click(copyButton);
            await Promise.resolve();
        });

        expect(mockClipboardWriteText).toHaveBeenCalledWith("/path/two");
    });

    it("должна изменять внешний вид кнопки после успешного копирования", async () => {
        vi.useFakeTimers();

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/two");

        await act(async () => {
            fireEvent.click(copyButton);
            await Promise.resolve();
        });

        expect(copyButton.querySelector("[data-testid='clipboard-check-icon']")).toBeInTheDocument();
        expect(copyButton).toHaveAttribute("data-accent-color", "green");

        act(() => {
            vi.advanceTimersByTime(1600);
        });

        expect(copyButton.querySelector("[data-testid='clipboard-icon']")).toBeInTheDocument();
        expect(copyButton).toHaveAttribute("data-accent-color", "gray");

        vi.useRealTimers();
    });

    it("должна обрабатывать ошибки буфера обмена", async () => {
        mockClipboardWriteText.mockRejectedValue(new Error("Clipboard error"));
        vi.useFakeTimers();

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/one");

        await act(async () => {
            fireEvent.click(copyButton);
            try {
                await Promise.resolve();
            } catch (e) { }
        });

        expect(copyButton.querySelector("[data-testid='exclamation-circle-icon']")).toBeInTheDocument();
        expect(copyButton).toHaveAttribute("data-accent-color", "red");

        act(() => {
            vi.advanceTimersByTime(1600);
        });

        expect(copyButton.querySelector("[data-testid='clipboard-icon']")).toBeInTheDocument();
        expect(copyButton).toHaveAttribute("data-accent-color", "gray");

        vi.useRealTimers();
    });

    it("должна показывать правильный тултип для кнопки копирования", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/one");
        const tooltipWrapper = copyButton.closest('[data-testid="mock-tooltip"]');

        expect(tooltipWrapper).toBeInTheDocument();
        expect(tooltipWrapper).toHaveAttribute("data-tooltip-content", "settings.copyPath");
    });

    it("должна менять текст тултипа после копирования", async () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/one");

        await act(async () => {
            fireEvent.click(copyButton);
            await Promise.resolve();
        });

        const tooltipAfterCopy = copyButton.closest('[data-testid="mock-tooltip"]');
        expect(tooltipAfterCopy).toHaveAttribute("data-tooltip-content", "settings.pathCopied");
    });

    it("должна показывать тултип с ошибкой при неудачном копировании", async () => {
        mockClipboardWriteText.mockRejectedValue(new Error("Clipboard error"));

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/one");

        await act(async () => {
            fireEvent.click(copyButton);
            try {
                await Promise.resolve();
            } catch (e) { }
        });

        const tooltipAfterError = copyButton.closest('[data-testid="mock-tooltip"]');
        expect(tooltipAfterError).toHaveAttribute("data-tooltip-content", "settings.copyPathError");
    });

    it("должна сбрасывать тултип в исходное состояние после таймаута", async () => {
        vi.useFakeTimers();

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const copyButton = screen.getByTestId("copy-button-/path/one");

        await act(async () => {
            fireEvent.click(copyButton);
            await Promise.resolve();
        });

        act(() => {
            vi.advanceTimersByTime(1600);
        });

        const tooltipAfterTimeout = screen.getByTestId("copy-button-/path/one")
            .closest('[data-testid="mock-tooltip"]');
        expect(tooltipAfterTimeout).toHaveAttribute("data-tooltip-content", "settings.copyPath");

        vi.useRealTimers();
    });
});

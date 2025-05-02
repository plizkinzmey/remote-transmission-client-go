import React, { createRef } from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { PathsTab, PathsTabRef } from "../PathsTab"; // Adjust import based on your structure
import { usePathsManagement } from "../hooks/usePathsManagement";
import { useLocalization } from "@contexts/LocalizationContext"; // Corrected path again

// Mock the custom hook
vi.mock("../hooks/usePathsManagement");

// Mock Localization context
vi.mock("@contexts/LocalizationContext"); // Corrected path again

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
    ClipboardIcon: () => <svg data-testid="clipboard-icon" />,
    ClipboardDocumentCheckIcon: () => <svg data-testid="clipboard-check-icon" />,
    ExclamationCircleIcon: () => <svg data-testid="exclamation-circle-icon" />,
}));

describe("Компонент PathsTab", () => {
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

        // Сброс состояния хука перед каждым тестом
        mockUsePathsManagement = vi.mocked(usePathsManagement);
        mockUsePathsManagement.mockReturnValue(defaultHookState);

        mockT = vi.fn((key) => key); // Простой мок для перевода
        vi.mocked(useLocalization).mockReturnValue({
            t: mockT,
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

    it("должен отображать состояние загрузки", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, isLoading: true });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith("loading");
    });

    it("должен корректно отображать список путей", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        expect(screen.getByTestId("paths-list-container")).toBeInTheDocument();
        expect(screen.getByTestId("path-item-/path/one")).toBeInTheDocument();
        expect(screen.getByTestId("path-item-/path/two")).toBeInTheDocument();

        // Проверяем индикатор пути по умолчанию (StarIcon должен быть и иметь цвет)
        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        const defaultIndicatorButton = defaultPathItem.querySelector(
            "[data-testid='is-default-indicator-/path/one']"
        );
        expect(defaultIndicatorButton).toBeInTheDocument();
        expect(defaultIndicatorButton?.querySelector("[data-testid='star-icon']")).toBeInTheDocument();

        // Проверяем тултип для индикатора пути по умолчанию
        const defaultTooltipWrapper = defaultIndicatorButton?.closest('[data-testid="mock-tooltip"]');
        expect(defaultTooltipWrapper).toBeInTheDocument();
        expect(defaultTooltipWrapper).toHaveAttribute("data-tooltip-content", "settings.isDefaultPath");

        // Проверяем действия для не дефолтного пути
        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        expect(nonDefaultPathItem.querySelector("[data-testid='set-default-button-/path/two']")).toBeInTheDocument();
        expect(nonDefaultPathItem.querySelector("[data-testid='delete-button-/path/two']")).toBeInTheDocument();
    });

    it("должен отображать пустое состояние, если нет путей", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, paths: [] });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.queryByTestId("paths-list-container")).not.toBeInTheDocument();
        expect(screen.getByTestId("new-path-input")).toBeInTheDocument(); // Секция добавления должна быть
    });

    it("должен обрабатывать изменение значения поля нового пути", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const input = screen.getByTestId("new-path-input");
        fireEvent.change(input, { target: { value: "/new/path" } });
        expect(mockSetNewPathValue).toHaveBeenCalledWith("/new/path");
    });

    it("должен отображать ошибку валидации", () => {
        const errorMsg = "Invalid path";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathError: errorMsg });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const errorElement = screen.getByTestId("new-path-error");
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(errorMsg);
    });

    it("должен отображать тултип о дубликате пути", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, isDuplicatePath: true, showDuplicateTooltip: true });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        // Находим кнопку добавления
        const addButton = screen.getByTestId("add-path-button");
        // Находим мок тултип вокруг кнопки
        const tooltipWrapper = addButton.closest('[data-testid="mock-tooltip"]');

        expect(tooltipWrapper).toBeInTheDocument();
        expect(tooltipWrapper).toHaveAttribute("data-tooltip-content", "settings.pathAlreadyExists");
    });

    it("должен вызывать handleAddPath при клике по кнопке добавления", () => {
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, newPath: "/some/path" });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const addButton = screen.getByTestId("add-path-button");
        fireEvent.click(addButton);
        expect(mockHandleAddPath).toHaveBeenCalledTimes(1);
    });

    it("должен дизейблить кнопку добавления, если newPath пустой или идет загрузка", () => {
        // Пустой путь
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, newPath: "  ", isLoading: false });
        const { rerender } = render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.getByTestId("add-path-button")).toBeDisabled();

        // Состояние загрузки
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, isLoading: true });
        rerender(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        expect(screen.queryByTestId("add-path-button")).not.toBeInTheDocument();
        expect(screen.queryByTestId("new-path-input")).not.toBeInTheDocument();
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });

    it("должен вызывать handleSetDefaultPath при клике по кнопке установки по умолчанию", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const setDefaultButton = screen.getByTestId("set-default-button-/path/two");
        fireEvent.click(setDefaultButton);
        expect(mockHandleSetDefaultPath).toHaveBeenCalledWith("/path/two");
    });

    it("должен вызывать handleDeletePathRequest при клике по кнопке удаления", () => {
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const deleteButton = screen.getByTestId("delete-button-/path/two");
        fireEvent.click(deleteButton);
        expect(mockHandleDeletePathRequest).toHaveBeenCalledWith("/path/two");
    });

    it("должен отображать подтверждение удаления", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathWithConfirmDelete: pathToDelete });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const pathItem = screen.getByTestId(`path-item-${pathToDelete}`);
        expect(pathItem.querySelector(`[data-testid='confirm-delete-button-${pathToDelete}']`)).toBeInTheDocument();
        expect(pathItem.querySelector(`[data-testid='cancel-delete-button-${pathToDelete}']`)).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith("settings.confirmDeletePath");

        // Проверяем, что обычные кнопки скрыты
        expect(pathItem.querySelector(`[data-testid='set-default-button-${pathToDelete}']`)).not.toBeInTheDocument();
        expect(pathItem.querySelector(`[data-testid='delete-button-${pathToDelete}']`)).not.toBeInTheDocument();
    });

    it("должен вызывать handleConfirmInlineDelete при подтверждении удаления", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathWithConfirmDelete: pathToDelete });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const confirmButton = screen.getByTestId(`confirm-delete-button-${pathToDelete}`);
        fireEvent.click(confirmButton);
        expect(mockHandleConfirmInlineDelete).toHaveBeenCalledWith(pathToDelete);
    });

    it("должен вызывать cancelDelete при отмене удаления", () => {
        const pathToDelete = "/path/two";
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, pathWithConfirmDelete: pathToDelete });
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const cancelButton = screen.getByTestId(`cancel-delete-button-${pathToDelete}`);
        fireEvent.click(cancelButton);
        expect(mockCancelDelete).toHaveBeenCalledTimes(1);
    });

    it("должен передавать onPathsChanged в хук usePathsManagement", () => {
        const localMockOnPathsChanged = vi.fn();

        render(<PathsTab onPathsChanged={localMockOnPathsChanged} />);

        expect(usePathsManagement).toHaveBeenCalledWith({ onPathsChanged: localMockOnPathsChanged });
    });

    it("должен предоставлять saveChanges, resetChanges, getPathChanges и hasChanges через ref", async () => {
        const ref = createRef<PathsTabRef>();
        mockUsePathsManagement.mockReturnValue({ ...defaultHookState, hasChanges: true });
        render(<PathsTab ref={ref} onPathsChanged={mockOnPathsChanged} />);

        expect(ref.current).toBeDefined();
        expect(ref.current?.hasChanges).toBe(true);

        await act(async () => {
            await ref.current?.saveChanges();
        });
        expect(mockSaveChanges).toHaveBeenCalledTimes(1);

        act(() => {
            ref.current?.resetChanges();
        });
        expect(mockResetChanges).toHaveBeenCalledTimes(1);

        ref.current?.getPathChanges();
        expect(mockGetPathChanges).toHaveBeenCalledTimes(1);
    });

    it("должен корректно обрабатывать сортировку путей", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            paths: ["/path/three", "/path/one", "/path/two"],
            defaultPath: "/path/two"
        });

        const { rerender } = render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const pathItems = screen.getAllByTestId(/^path-item-/);
        expect(pathItems[0]).toHaveAttribute("data-testid", "path-item-/path/two");

        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            paths: ["/path/three", "/path/one", "/path/two"],
            defaultPath: "/path/three"
        });

        rerender(<PathsTab onPathsChanged={mockOnPathsChanged} />);
        const updatedPathItems = screen.getAllByTestId(/^path-item-/);
        expect(updatedPathItems[0]).toHaveAttribute("data-testid", "path-item-/path/three");
    });

    it("должен применять правильные стили при наличии pathError без isDuplicatePath", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathError: "Invalid path error",
            isDuplicatePath: false
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const textField = screen.getByTestId("new-path-input").closest(".rt-TextFieldRoot");
        expect(textField).toHaveAttribute("data-accent-color", "red");
    });

    it("должен применять правильные стили при isDuplicatePath без pathError", () => {
        mockUsePathsManagement.mockReturnValue({
            ...defaultHookState,
            pathError: "",
            isDuplicatePath: true
        });

        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const textField = screen.getByTestId("new-path-input").closest(".rt-TextFieldRoot");
        expect(textField).toHaveAttribute("data-accent-color", "red");
    });

    it("должен применять нейтральные стили при отсутствии ошибок или дубликатов", () => {
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
        mockUsePathsManagement.mockReturnValue(defaultHookState);
        render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

        const defaultPathItem = screen.getByTestId("path-item-/path/one");
        expect(defaultPathItem.className).toContain("defaultPathItem");

        const nonDefaultPathItem = screen.getByTestId("path-item-/path/two");
        expect(nonDefaultPathItem.className).not.toContain("defaultPathItem");
    });

    describe("Функциональность копирования путей", () => {
        let originalClipboard: any;
        let mockClipboardWriteText: Mock;

        beforeEach(() => {
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
            expect(copyButton2.querySelector("[data-testid='clipboard-icon']")).toBeInTheDocument();
        });

        it("должна копировать путь в буфер обмена при нажатии на кнопку", async () => {
            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/two");

            fireEvent.click(copyButton);

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

        it("должна корректно обрабатывать ошибки буфера обмена", async () => {
            mockClipboardWriteText.mockRejectedValue(new Error("Clipboard error"));

            vi.useFakeTimers();

            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/one");

            expect(copyButton).toHaveAttribute("data-accent-color", "gray");

            await act(async () => {
                fireEvent.click(copyButton);
                try {
                    await Promise.resolve();
                } catch (e) {
                }
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

        it("должна иметь соответствующий aria-label для доступности", () => {
            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/one");

            expect(copyButton).toHaveAttribute("aria-label", "settings.copyPath");
            expect(mockT).toHaveBeenCalledWith("settings.copyPath");
        });

        it("должна отображать правильный текст в тултипе кнопки копирования", () => {
            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/one");
            const tooltipWrapper = copyButton.closest('[data-testid="mock-tooltip"]');

            expect(tooltipWrapper).toBeInTheDocument();
            expect(tooltipWrapper).toHaveAttribute("data-tooltip-content", "settings.copyPath");
            expect(mockT).toHaveBeenCalledWith("settings.copyPath");
        });

        it("должна показывать тултип 'скопировано' после успешного копирования", async () => {
            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/one");

            await act(async () => {
                fireEvent.click(copyButton);
                await Promise.resolve();
            });

            const tooltipWrapperAfterCopy = screen.getByTestId("copy-button-/path/one")
                .closest('[data-testid="mock-tooltip"]');

            expect(tooltipWrapperAfterCopy).toBeInTheDocument();
            expect(tooltipWrapperAfterCopy).toHaveAttribute("data-tooltip-content", "settings.pathCopied");
            expect(mockT).toHaveBeenCalledWith("settings.pathCopied");
        });

        it("должна показывать тултип с ошибкой при неудачном копировании", async () => {
            mockClipboardWriteText.mockRejectedValue(new Error("Clipboard error"));

            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/one");

            await act(async () => {
                fireEvent.click(copyButton);
                try {
                    await Promise.resolve();
                } catch (e) {
                }
            });

            const tooltipWrapperAfterError = screen.getByTestId("copy-button-/path/one")
                .closest('[data-testid="mock-tooltip"]');

            expect(tooltipWrapperAfterError).toBeInTheDocument();
            expect(tooltipWrapperAfterError).toHaveAttribute("data-tooltip-content", "settings.copyPathError");
            expect(mockT).toHaveBeenCalledWith("settings.copyPathError");
        });

        it("должна сбрасывать тултип в исходное состояние после таймаута", async () => {
            vi.useFakeTimers();

            render(<PathsTab onPathsChanged={mockOnPathsChanged} />);

            const copyButton = screen.getByTestId("copy-button-/path/one");

            await act(async () => {
                fireEvent.click(copyButton);
                await Promise.resolve();
            });

            const tooltipWrapperAfterCopy = copyButton.closest('[data-testid="mock-tooltip"]');
            expect(tooltipWrapperAfterCopy).toHaveAttribute("data-tooltip-content", "settings.pathCopied");

            act(() => {
                vi.advanceTimersByTime(1600);
            });

            const tooltipWrapperAfterTimeout = screen.getByTestId("copy-button-/path/one")
                .closest('[data-testid="mock-tooltip"]');
            expect(tooltipWrapperAfterTimeout).toHaveAttribute("data-tooltip-content", "settings.copyPath");

            vi.useRealTimers();
        });
    });
});

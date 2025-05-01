import React from "react"; // Добавляем импорт React
import { render, screen, fireEvent, cleanup, act, within, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TorrentItem, TorrentItemProps } from "../TorrentItem";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";
import * as TorrentStatusUtils from "../../../utils/torrentStatus";
import * as RadixDialog from "@radix-ui/themes"; // Импортируем для мокированияREM
import { StatusType } from "../../../utils/torrentStatus"; // Импортируем StatusType

// --- Убираем моки для DeleteDialog и TorrentContent ---
// vi.mock("../DeleteDialog", ...);
// vi.mock("../TorrentContent", ...);

// --- Мокируем Radix Dialog ---
vi.mock("@radix-ui/themes", async () => {
    const actual = await vi.importActual<typeof RadixDialog>("@radix-ui/themes");
    return {
        ...actual, // Сохраняем остальные экспорты Radix
        Dialog: {
            ...actual.Dialog,
            // Мок Dialog.Root: рендерит детей только если open=true
            Root: ({ children, open, onOpenChange }: React.ComponentProps<typeof actual.Dialog.Root>) => {
                const handleOpenChange = (newOpen: boolean) => {
                    if (onOpenChange) {
                        onOpenChange(newOpen);
                    }
                };
                return open ? <div data-testid="mock-dialog-root-open" data-onopenchange={handleOpenChange.toString()}>{children}</div> : null;
            },
            // Мок Dialog.Content: рендерит простой div с переданными props (включая data-testid)
            Content: ({ children, ...props }: React.ComponentProps<typeof actual.Dialog.Content>) => (
                <div {...props}>{children}</div>
            ),
            // Добавляем моки для других частей Dialog, если они используются неявно
            Trigger: ({ children }: any) => <div data-testid="mock-dialog-trigger">{children}</div>,
            Close: ({ children, ...props }: any) => <button {...props}>{children}</button>, // Используем button для Close
            Title: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>, // Используем h1 для заголовка
            Description: ({ children, ...props }: any) => <p {...props}>{children}</p>, // Используем p для описания
        },
        // Мокаем другие компоненты Radix, если необходимо
        Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        Button: ({ children, ...props }: any) => <button {...props}>{children}</button>, // Мок Button
        // --- Исправленный мок Checkbox ---
        // Используем 'any' для props, чтобы разрешить data-testid и избежать конфликта onChange
        Checkbox: ({ checked, onCheckedChange, "data-testid": testId, ...props }: any) => {
            const isIndeterminate = checked === "indeterminate";
            const isChecked = isIndeterminate ? false : checked;
            // Исключаем onChange из props, чтобы избежать конфликта типов с input.onChange
            const { onChange: _ignoredOnChange, ...restProps } = props;

            return (
                <input
                    type="checkbox"
                    data-testid={testId}
                    checked={isChecked}
                    data-indeterminate={isIndeterminate ? "true" : undefined}
                    onChange={(e) => {
                        if (onCheckedChange) {
                            // Передаем булево значение, как ожидает Radix onCheckedChange
                            onCheckedChange(e.target.checked);
                        }
                    }}
                    {...restProps} // Передаем остальные props
                />
            );
        },
        Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        // Добавьте моки для IconButton, Heading и т.д., если они вызывают проблемы
        IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        Heading: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    };
});

// Исправляем путь на ../TorrentItemHeader
vi.mock("../TorrentItemHeader", () => ({
    TorrentItemHeader: (props: any) => <div data-testid="torrent-item-header-mock">{props.name}</div>,
}));

// Исправляем путь на ../TorrentItemProgress
vi.mock("../TorrentItemProgress", () => ({
    TorrentItemProgress: (props: any) => <div data-testid="torrent-item-progress-mock" data-progress={props.progress}>Progress</div>,
}));

// Исправляем путь на ../TorrentItemStats
vi.mock("../TorrentItemStats", () => ({
    TorrentItemStats: (props: any) => <div data-testid="torrent-item-stats-mock">{props.sizeFormatted}</div>,
}));

// Исправляем путь на ../TorrentItemActions
vi.mock("../TorrentItemActions", () => ({
    TorrentItemActions: ({
        onViewContent,
        onStart,
        onStop,
        onRemove,
        onVerify,
        onSetSpeedLimit,
        isLoading,
        lastAction,
        isSlowMode,
        status,
        isSelected,
    }: any) => (
        <div
            data-testid="torrent-item-actions-mock"
            data-is-selected={isSelected ? "true" : "false"}
        >
            <button onClick={onViewContent} data-testid="action-view">View</button>
            <button onClick={onStart} data-testid="action-start" disabled={isLoading && lastAction === 'start'}>Start</button>
            <button onClick={onStop} data-testid="action-stop" disabled={isLoading && lastAction === 'stop'}>Stop</button>
            <button onClick={onRemove} data-testid="action-remove">Remove</button>
            {onVerify && <button onClick={onVerify} data-testid="action-verify" disabled={isLoading && lastAction === 'verify'}>Verify</button>}
            {onSetSpeedLimit && <button onClick={() => onSetSpeedLimit(1, !isSlowMode)} data-testid="action-speed-limit">Speed Limit</button>}
            <span>{`Loading: ${isLoading}, Last: ${lastAction}, Slow: ${isSlowMode}, Status: ${status}, Selected: ${isSelected}`}</span>
        </div>
    ),
}));

// Мок утилит статуса, если нужно проверить их вызов или результат
const isBlockedSpy = vi.spyOn(TorrentStatusUtils, "isBlocked");
const isCheckingSpy = vi.spyOn(TorrentStatusUtils, "isChecking");
vi.spyOn(TorrentStatusUtils, "getCardClassName");

// --- Тесты ---
describe("TorrentItem", () => {
    const mockOnSelect = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnStart = vi.fn();
    const mockOnStop = vi.fn();
    const mockOnVerify = vi.fn();
    const mockOnSetSpeedLimit = vi.fn();

    const defaultProps: TorrentItemProps = {
        id: 1,
        name: "Test Torrent",
        status: "stopped" as StatusType, // <-- Добавляем as StatusType
        progress: 50,
        sizeFormatted: "100 MB",
        uploadRatio: 1.5,
        seedsConnected: 10,
        seedsTotal: 20,
        peersConnected: 5,
        peersTotal: 10,
        uploadedFormatted: "50 MB",
        selected: false,
        onSelect: mockOnSelect,
        onRemove: mockOnRemove,
        onStart: mockOnStart,
        onStop: mockOnStop,
        onVerify: mockOnVerify,
        downloadSpeedFormatted: "1 MB/s",
        uploadSpeedFormatted: "500 KB/s",
        onSetSpeedLimit: mockOnSetSpeedLimit,
        isSlowMode: false,
        "data-testid": "torrent-item-1",
    };

    const renderComponent = (props: Partial<TorrentItemProps> = {}) => {
        // Убедимся, что если status передается в props, он тоже имеет правильный тип
        const mergedProps = { ...defaultProps, ...props };
        if (props.status && typeof props.status === 'string') {
            mergedProps.status = props.status as StatusType; // <-- Приведение типа при переопределении
        }
        return render(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <TorrentItem {...mergedProps} />
                </MockLocalizationProvider>
            </TestThemeProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    // --- Rendering Tests ---
    it("renders correctly with default props", () => {
        renderComponent();
        expect(screen.getByTestId("torrent-item-1")).toBeInTheDocument();
        expect(screen.getByTestId("torrent-item-header-mock")).toHaveTextContent("Test Torrent");
        expect(screen.getByTestId("torrent-item-progress-mock")).toHaveAttribute("data-progress", "50");
        expect(screen.getByTestId("torrent-item-stats-mock")).toHaveTextContent("100 MB");
        expect(screen.getByTestId("torrent-item-actions-mock")).toBeInTheDocument();
        expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("applies correct card class based on status", () => {
        renderComponent({ status: "downloading" as StatusType }); // <-- Добавляем as StatusType
        expect(TorrentStatusUtils.getCardClassName).toHaveBeenCalledWith("downloading", "card", expect.any(Object));
    });

    it("renders checkbox as checked when selected is true", () => {
        renderComponent({ selected: true });
        expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("applies passed data-testid", () => {
        const testId = "custom-test-id";
        renderComponent({ "data-testid": testId });
        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    // --- Selection Tests ---
    it("calls onSelect when checkbox is clicked", () => {
        renderComponent();
        const checkbox = screen.getByRole("checkbox");
        act(() => {
            fireEvent.click(checkbox);
        });
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith(defaultProps.id);
    });

    it.each([
        { status: "error" as StatusType, expectedDisabled: true }, // <-- Добавляем as StatusType
        { status: "checking" as StatusType, expectedDisabled: true }, // <-- Добавляем as StatusType
        { status: "downloading" as StatusType, expectedDisabled: false }, // <-- Добавляем as StatusType
        { status: "stopped" as StatusType, expectedDisabled: false }, // <-- Добавляем as StatusType
    ])("disables checkbox when status is $status", ({ status, expectedDisabled }) => {
        if (status === "error") {
            isBlockedSpy.mockReturnValue(true);
            isCheckingSpy.mockReturnValue(false);
        } else if (status === "checking") {
            isBlockedSpy.mockReturnValue(false);
            isCheckingSpy.mockReturnValue(true);
        } else {
            isBlockedSpy.mockReturnValue(false);
            isCheckingSpy.mockReturnValue(false);
        }

        renderComponent({ status }); // status уже имеет тип StatusType из it.each
        const checkbox = screen.getByRole("checkbox");
        if (expectedDisabled) {
            expect(checkbox).toBeDisabled();
        } else {
            expect(checkbox).not.toBeDisabled();
        }
        isBlockedSpy.mockRestore();
        isCheckingSpy.mockRestore();
    });

    // --- Actions Tests ---
    it("calls onStart when start action is triggered", () => {
        renderComponent({ status: "stopped" as StatusType }); // <-- Добавляем as StatusType
        fireEvent.click(screen.getByTestId("action-start"));
        expect(mockOnStart).toHaveBeenCalledTimes(1);
        expect(mockOnStart).toHaveBeenCalledWith(defaultProps.id);
    });

    it("calls onStop when stop action is triggered", () => {
        renderComponent({ status: "downloading" as StatusType }); // <-- Добавляем as StatusType
        fireEvent.click(screen.getByTestId("action-stop"));
        expect(mockOnStop).toHaveBeenCalledTimes(1);
        expect(mockOnStop).toHaveBeenCalledWith(defaultProps.id);
    });

    it("calls onVerify when verify action is triggered", () => {
        renderComponent({ status: "stopped" as StatusType }); // <-- Добавляем as StatusType
        fireEvent.click(screen.getByTestId("action-verify"));
        expect(mockOnVerify).toHaveBeenCalledTimes(1);
        expect(mockOnVerify).toHaveBeenCalledWith(defaultProps.id);
    });

    it("does not call onVerify if handler is not provided", () => {
        renderComponent({ onVerify: undefined });
        expect(screen.queryByTestId("action-verify")).not.toBeInTheDocument();
    });

    it("calls onSetSpeedLimit when speed limit action is triggered", () => {
        renderComponent({ isSlowMode: false });
        fireEvent.click(screen.getByTestId("action-speed-limit"));
        expect(mockOnSetSpeedLimit).toHaveBeenCalledTimes(1);
        expect(mockOnSetSpeedLimit).toHaveBeenCalledWith(defaultProps.id, true);
    });

    it("does not render speed limit button if handler is not provided", () => {
        renderComponent({ onSetSpeedLimit: undefined });
        expect(screen.queryByTestId("action-speed-limit")).not.toBeInTheDocument();
    });

    // --- Loading State Tests ---
    it("sets loading state when start action is triggered and resets when status changes", async () => {
        const { rerender } = renderComponent({ status: "stopped" as StatusType }); // <-- Добавляем as StatusType

        await act(async () => {
            fireEvent.click(screen.getByTestId("action-start"));
        });

        expect(screen.getByTestId("torrent-item-actions-mock")).toHaveTextContent("Loading: true, Last: start");

        rerender(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <TorrentItem {...defaultProps} status={"downloading" as StatusType} /> {/* <-- Добавляем as StatusType */}
                </MockLocalizationProvider>
            </TestThemeProvider>
        );

        expect(screen.getByTestId("torrent-item-actions-mock")).toHaveTextContent("Loading: false, Last: null");
    });

    it("sets loading state when stop action is triggered and resets when status changes", async () => {
        const { rerender } = renderComponent({ status: "downloading" as StatusType }); // <-- Добавляем as StatusType

        await act(async () => {
            fireEvent.click(screen.getByTestId("action-stop"));
        });

        expect(screen.getByTestId("torrent-item-actions-mock")).toHaveTextContent("Loading: true, Last: stop");

        rerender(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <TorrentItem {...defaultProps} status={"stopped" as StatusType} /> {/* <-- Добавляем as StatusType */}
                </MockLocalizationProvider>
            </TestThemeProvider>
        );

        expect(screen.getByTestId("torrent-item-actions-mock")).toHaveTextContent("Loading: false, Last: null");
    });

    it("sets loading state when verify action is triggered and resets when status becomes checking", async () => {
        const { rerender } = renderComponent({ status: "stopped" as StatusType }); // <-- Добавляем as StatusType
        const actionsMock = screen.getByTestId("torrent-item-actions-mock");

        act(() => {
            fireEvent.click(within(actionsMock).getByTestId("action-verify"));
        });

        // Используем явный waitFor вокруг проверки текста
        await waitFor(() => {
            expect(actionsMock).toHaveTextContent(/Loading: true, Last: verify/i);
        }, { timeout: 2000 }); // Оставляем таймаут

        // Проверяем, что статус все еще stopped
        expect(actionsMock).toHaveTextContent(/Status: stopped/i);

        // Ререндер с новым статусом
        await act(async () => {
            rerender(
                <TestThemeProvider>
                    <MockLocalizationProvider>
                        <TorrentItem {...defaultProps} status={"checking" as StatusType} /> {/* <-- Добавляем as StatusType */}
                    </MockLocalizationProvider>
                </TestThemeProvider>
            );
        });

        // Проверяем финальное состояние
        expect(actionsMock).toHaveTextContent(
            "Loading: false, Last: null, Slow: false, Status: checking"
        );
    });

    it("does not trigger actions if status is checking", () => {
        renderComponent({ status: "checking" as StatusType }); // <-- Добавляем as StatusType
        fireEvent.click(screen.getByTestId("action-start"));
        fireEvent.click(screen.getByTestId("action-stop"));
        fireEvent.click(screen.getByTestId("action-verify"));

        expect(mockOnStart).not.toHaveBeenCalled();
        expect(mockOnStop).not.toHaveBeenCalled();
        expect(mockOnVerify).not.toHaveBeenCalled();
    });

    // --- Dialog/Modal Tests ---
    it("opens and handles DeleteDialog correctly", async () => {
        renderComponent();
        expect(screen.queryByTestId("delete-dialog-content")).not.toBeInTheDocument();

        act(() => {
            fireEvent.click(screen.getByTestId("action-remove"));
        });

        const dialogContent = await screen.findByTestId("delete-dialog-content");
        expect(dialogContent).toBeInTheDocument();
        expect(within(dialogContent).getByTestId("delete-dialog-title")).toBeInTheDocument();
        expect(within(dialogContent).getByTestId("delete-dialog-torrent-name")).toBeInTheDocument();

        const confirmButton = within(dialogContent).getByTestId("delete-dialog-confirm");

        act(() => {
            fireEvent.click(confirmButton);
        });
        expect(mockOnRemove).toHaveBeenCalledTimes(1);
        expect(mockOnRemove).toHaveBeenCalledWith(defaultProps.id, false);

        await waitFor(() => {
            expect(screen.queryByTestId("delete-dialog-content")).not.toBeInTheDocument();
        });

        act(() => {
            fireEvent.click(screen.getByTestId("action-remove"));
        });
        const dialogContent2 = await screen.findByTestId("delete-dialog-content");
        const confirmButton2 = within(dialogContent2).getByTestId("delete-dialog-confirm");
        const checkbox2 = within(dialogContent2).getByTestId("delete-dialog-checkbox");

        act(() => {
            fireEvent.click(checkbox2);
        });
        act(() => {
            fireEvent.click(confirmButton2);
        });
        expect(mockOnRemove).toHaveBeenCalledTimes(2);
        expect(mockOnRemove).toHaveBeenCalledWith(defaultProps.id, true);

        await waitFor(() => {
            expect(screen.queryByTestId("delete-dialog-content")).not.toBeInTheDocument();
        });

        act(() => {
            fireEvent.click(screen.getByTestId("action-remove"));
        });
        const dialogContent3 = await screen.findByTestId("delete-dialog-content");
        const cancelButton3 = within(dialogContent3).getByTestId("delete-dialog-cancel");

        act(() => {
            fireEvent.click(cancelButton3);
        });
        expect(mockOnRemove).toHaveBeenCalledTimes(2);
        await waitFor(() => {
            expect(screen.queryByTestId("delete-dialog-content")).not.toBeInTheDocument();
        });
    });

    it("opens and closes TorrentContent correctly", async () => {
        renderComponent();
        expect(screen.queryByTestId("torrent-content-dialog")).not.toBeInTheDocument();

        act(() => {
            fireEvent.click(screen.getByTestId("action-view"));
        });

        const dialogContent = await screen.findByTestId("torrent-content-dialog");
        expect(dialogContent).toBeInTheDocument();
        expect(within(dialogContent).getByTestId("torrent-title")).toHaveTextContent(defaultProps.name);

        const closeButton = within(dialogContent).getByTestId("close-button");
        act(() => {
            fireEvent.click(closeButton);
        });

        await waitFor(() => {
            expect(screen.queryByTestId("torrent-content-dialog")).not.toBeInTheDocument();
        });
    });

    // --- isSelected Tests ---
    it("passes isSelected to TorrentItemActions", () => {
        renderComponent({ isSelected: true });
        expect(screen.getByTestId("torrent-item-actions-mock")).toHaveAttribute("data-is-selected", "true");
    });

    it("defaults to false when isSelected not provided", () => {
        renderComponent(); // isSelected не передан
        expect(screen.getByTestId("torrent-item-actions-mock")).toHaveAttribute("data-is-selected", "false");
    });
});

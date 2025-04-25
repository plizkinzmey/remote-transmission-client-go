// Добавляем React для использования React.ComponentProps
import React from "react";
// Удаляем waitFor, оставляем fireEvent, cleanup
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
// Добавляем afterEach
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TorrentContent } from "../TorrentContent";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";
// Удаляем GetTorrentDownloadDirectory, SetFilesWanted
// Импортируем хуки для мокирования
import { useTorrentFiles } from "../hooks/useTorrentFiles";
import { useDownloadDirectory } from "../hooks/useDownloadDirectory";
// Предполагаемый путь к типу FileNode
import { FileNode } from "../../../types/FileTree";
// Добавляем Dialog из Radix для мокирования
import * as RadixDialog from "@radix-ui/themes";

// Мок API вызовов Wails (можно оставить пустым или удалить, если SetFilesWanted не проверяется)
vi.mock("../../../../wailsjs/go/main/App", () => ({
    SetFilesWanted: vi.fn() // Оставляем, если нужно проверить вызов из toggleNode/toggleAll
}));

// Мок хуков
vi.mock("../hooks/useTorrentFiles");
vi.mock("../hooks/useDownloadDirectory");

// Мок дочерних компонентов для упрощения тестов взаимодействия
vi.mock("../../SelectAllFiles", () => ({
    // Мок SelectAllFiles передает вызов onToggleAll при изменении
    SelectAllFiles: ({ allChecked, indeterminate, onToggleAll }: any) => (
        <input
            type="checkbox"
            data-testid="select-all-files-mock"
            checked={allChecked}
            data-indeterminate={indeterminate ? "true" : undefined} // Атрибут для indeterminate
            onChange={onToggleAll} // Передаем коллбэк напрямую
        />
    )
}));

// Исправляем имя свойства с FileNodeComponent на FileNode
vi.mock("../../FileNode", () => {
    // Определяем тип для рекурсивного мока
    type MockFileNodeProps = {
        node: FileNode;
        onToggleWanted: (node: FileNode, wanted: boolean) => void;
        onToggleExpand: (node: FileNode) => void;
        // Добавляем depth для рекурсии, хотя он не используется в логике мока
        depth?: number;
    };

    // Создаем рекурсивный мок-компонент
    const MockFileNodeComponent: React.FC<MockFileNodeProps> = ({ node, onToggleWanted, onToggleExpand }) => (
        <div data-testid={`file-node-${node.Path}`}>
            <input
                type="checkbox"
                data-testid={`file-node-checkbox-${node.Path}`}
                // Используем node.Wanted или node.indeterminate для состояния чекбокса
                checked={node.indeterminate ? false : node.Wanted}
                // Добавляем data-indeterminate атрибут для Radix-подобного поведения
                data-indeterminate={node.indeterminate ? "true" : undefined}
                onChange={(e) => onToggleWanted(node, e.target.checked)}
            />
            {node.isDirectory ? ( // Кнопка только для директорий
                <button
                    data-testid={`file-node-expand-${node.Path}`}
                    onClick={() => onToggleExpand(node)}
                >
                    {node.Name}
                </button>
            ) : (
                <span>{node.Name}</span>
            )}
            {/* Рекурсивный рендеринг дочерних узлов */}
            {node.isDirectory && node.expanded && node.children && (
                <div>
                    {node.children.map(child => (
                        <MockFileNodeComponent
                            key={child.Path} // Используем Path как ключ в моке
                            node={child}
                            onToggleWanted={onToggleWanted}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    // Экспортируем мок с правильным именем
    return {
        FileNode: MockFileNodeComponent
    };
});

// Мок для Radix Dialog
// Перехватываем onOpenChange из Dialog.Root
let capturedOnOpenChange: ((open: boolean) => void) | undefined;
vi.mock("@radix-ui/themes", async () => {
    const actual = await vi.importActual<typeof RadixDialog>("@radix-ui/themes");
    return {
        ...actual, // Сохраняем остальные экспорты Radix
        Dialog: {
            ...actual.Dialog,
            // Используем React.ComponentProps для получения типа пропсов
            // Мок Dialog.Root теперь рендерит детей только если open=true
            Root: ({ children, open, onOpenChange }: React.ComponentProps<typeof actual.Dialog.Root>) => {
                // Захватываем переданный обработчик
                capturedOnOpenChange = onOpenChange;
                // Рендерим детей только если open=true
                return open ? <div data-testid="mock-dialog-root">{children}</div> : null;
            },
            // Используем React.ComponentProps для получения типа пропсов
            Content: ({ children, ...props }: React.ComponentProps<typeof actual.Dialog.Content>) => (
                <div data-testid="torrent-content-dialog" {...props}>{children}</div>
            ),
            // Добавляем моки для других частей Dialog, если они используются неявно
            Trigger: ({ children }: any) => <div data-testid="mock-dialog-trigger">{children}</div>,
            Close: ({ children }: any) => <div data-testid="mock-dialog-close">{children}</div>,
            Title: ({ children }: any) => <div data-testid="mock-dialog-title">{children}</div>,
            Description: ({ children }: any) => <div data-testid="mock-dialog-description">{children}</div>,
        },
        // Мокаем ScrollArea, если он мешает
        ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        // Мокаем другие компоненты Radix, если необходимо
        Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        // Добавьте моки для Flex, IconButton и т.д., если они вызывают проблемы
        Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    };
});

describe("TorrentContent", () => {
    const mockOnClose = vi.fn();
    // Моки для коллбэков хука useTorrentFiles
    const mockToggleNode = vi.fn();
    const mockToggleAll = vi.fn();
    const mockToggleExpand = vi.fn();
    // Моки для функций загрузки хуков (предполагаем их наличие)
    const mockLoadFiles = vi.fn(() => Promise.resolve());
    const mockLoadDownloadDirectory = vi.fn(() => Promise.resolve());

    // Пример дерева файлов для мока useTorrentFiles
    const mockFileTree: FileNode[] = [
        {
            ID: 1,
            Name: "file1.txt",
            Path: "file1.txt",
            Size: 1024,
            Progress: 50,
            Wanted: true,
            children: [],
            isDirectory: false,
            expanded: false,
            indeterminate: false,
        },
        {
            ID: 0, // ID для директории
            Name: "dir1",
            Path: "dir1",
            Size: 2048,
            Progress: 75,
            Wanted: true, // Состояние директории
            children: [
                {
                    ID: 2,
                    Name: "file2.txt",
                    Path: "dir1/file2.txt",
                    Size: 2048,
                    Progress: 75,
                    Wanted: false,
                    children: [],
                    isDirectory: false,
                    expanded: false,
                    indeterminate: false,
                }
            ],
            isDirectory: true,
            expanded: true,
            indeterminate: true,
        }
    ];

    // Базовый мок для useTorrentFiles
    // Уточните структуру и типы функций при необходимости
    const mockUseTorrentFilesDefault = {
        fileTree: mockFileTree,
        loading: false,
        error: null,
        allChecked: false,
        indeterminate: true,
        toggleNode: mockToggleNode,
        toggleAll: mockToggleAll,
        toggleExpand: mockToggleExpand,
        loadFiles: mockLoadFiles, // Добавляем функцию загрузки
    };

    // Базовый мок для useDownloadDirectory
    const mockUseDownloadDirectoryDefault = {
        downloadDir: "/home/user/downloads",
        loading: false,
        error: null,
        loadDownloadDirectory: mockLoadDownloadDirectory, // Добавляем функцию загрузки
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Сбрасываем захваченный обработчик перед каждым тестом
        capturedOnOpenChange = undefined;
        // Настраиваем моки хуков по умолчанию
        // Используем as any для упрощения, пока нет точных типов
        vi.mocked(useTorrentFiles).mockReturnValue(mockUseTorrentFilesDefault as any);
        vi.mocked(useDownloadDirectory).mockReturnValue(mockUseDownloadDirectoryDefault as any);

        // Сбрасываем стиль body перед каждым тестом
        document.body.style.overflow = "";
    });

    // Добавляем afterEach для очистки DOM после тестов
    afterEach(() => {
        cleanup();
        // Убедимся, что стиль body сброшен после тестов
        document.body.style.overflow = "";
    });

    // Хелпер рендеринга с возможностью переопределения моков хуков
    // Добавляем open: true по умолчанию
    const renderComponent = (props = {}, torrentFilesHookProps = {}, downloadDirHookProps = {}) => {
        vi.mocked(useTorrentFiles).mockReturnValue({
            ...mockUseTorrentFilesDefault,
            ...torrentFilesHookProps,
        } as any);
        vi.mocked(useDownloadDirectory).mockReturnValue({
            ...mockUseDownloadDirectoryDefault,
            ...downloadDirHookProps,
        } as any);

        return render(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <TorrentContent
                        id={123}
                        name="Test Torrent"
                        open={true} // Передаем open=true по умолчанию для тестов
                        onClose={mockOnClose}
                        {...props}
                    />
                </MockLocalizationProvider>
            </TestThemeProvider>
        );
    };

    it("отображает заголовок с названием торрента", () => {
        renderComponent();
        expect(screen.getByTestId("torrent-title")).toHaveTextContent("Test Torrent");
    });

    it("отображает информацию о директории загрузки", () => {
        renderComponent();
        expect(screen.getByTestId("download-path")).toBeInTheDocument();
        expect(screen.getByTestId("download-path")).toHaveTextContent("/home/user/downloads");
    });

    it("отображает индикатор загрузки при загрузке файлов", () => {
        renderComponent({}, { loading: true });
        expect(screen.getByTestId("files-loading")).toBeInTheDocument();
    });

    it("отображает файловое дерево после загрузки", () => {
        renderComponent();
        expect(screen.getByTestId("file-list-container")).toBeInTheDocument();
        expect(screen.getByTestId("file-node-file1.txt")).toBeInTheDocument();
        expect(screen.getByTestId("file-node-dir1")).toBeInTheDocument();
        expect(screen.getByTestId("file-node-dir1/file2.txt")).toBeInTheDocument();
    });

    it("отображает ошибку при неудачной загрузке файлов", () => {
        const errorMessage = "Failed to load files";
        renderComponent({}, { error: errorMessage, loading: false });
        expect(screen.getByTestId("files-error")).toBeInTheDocument();
        expect(screen.getByTestId("files-error")).toHaveTextContent(errorMessage);
    });

    it("вызывает onClose при закрытии через кнопку", () => {
        renderComponent();
        fireEvent.click(screen.getByTestId("close-button"));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("не отображается, если open=false", () => {
        renderComponent({ open: false });
        // Dialog.Root в моке возвращает null, если open=false
        expect(screen.queryByTestId("torrent-content-dialog")).not.toBeInTheDocument();
        // Проверяем, что стиль body не изменен
        expect(document.body.style.overflow).toBe("");
    });

    it("устанавливает overflow: hidden для body при open=true и сбрасывает при open=false", () => {
        expect(document.body.style.overflow).toBe("");

        const { rerender } = renderComponent({ open: true }); // Изначально открыт

        expect(document.body.style.overflow).toBe("hidden");

        // Перерендериваем с open=false
        rerender(
            <TestThemeProvider>
                <MockLocalizationProvider>
                    <TorrentContent
                        id={123}
                        name="Test Torrent"
                        open={false}
                        onClose={mockOnClose}
                    />
                </MockLocalizationProvider>
            </TestThemeProvider>
        );

        expect(document.body.style.overflow).toBe("");
    });

    it("вызывает toggleAll при клике на SelectAllFiles", () => {
        renderComponent();
        const selectAllCheckbox = screen.getByTestId("select-all-files-mock");
        fireEvent.click(selectAllCheckbox);
        expect(mockToggleAll).toHaveBeenCalledTimes(1);
    });

    it("вызывает toggleNode при клике на чекбокс файла", () => {
        renderComponent();
        const fileNode = mockFileTree[0];
        const fileCheckbox = screen.getByTestId(`file-node-checkbox-${fileNode.Path}`);

        fireEvent.click(fileCheckbox);

        expect(mockToggleNode).toHaveBeenCalledTimes(1);
        expect(mockToggleNode).toHaveBeenCalledWith(fileNode, !fileNode.Wanted);
    });

    it("вызывает toggleExpand при клике на кнопку директории", () => {
        renderComponent();
        const dirNode = mockFileTree[1];
        const dirExpandButton = screen.getByTestId(`file-node-expand-${dirNode.Path}`);

        fireEvent.click(dirExpandButton);

        expect(mockToggleExpand).toHaveBeenCalledTimes(1);
        expect(mockToggleExpand).toHaveBeenCalledWith(dirNode);
    });

    it("вызывает хуки useTorrentFiles и useDownloadDirectory с правильным ID", () => {
        const torrentId = 456;
        renderComponent({ id: torrentId });

        expect(useTorrentFiles).toHaveBeenCalledWith(torrentId);
        expect(useDownloadDirectory).toHaveBeenCalledWith(torrentId);
    });

    it("вызывает onClose когда Dialog.Root инициирует закрытие (onOpenChange(false))", () => {
        renderComponent({ open: true }); // Убедимся, что компонент отрендерен
        expect(capturedOnOpenChange).toBeDefined();

        // Имитируем вызов onOpenChange с false (закрытие)
        if (capturedOnOpenChange) {
            // Присваиваем локальной переменной для помощи TypeScript
            const handler = capturedOnOpenChange;
            act(() => {
                handler(false); // Вызываем локальную переменную
            });
        } else {
            throw new Error("capturedOnOpenChange was not defined in the mock");
        }

        expect(mockOnClose).toHaveBeenCalledTimes(1);

        mockOnClose.mockClear();
        // Имитируем вызов onOpenChange с true (открытие - не должно вызывать onClose)
        if (capturedOnOpenChange) {
            // Присваиваем локальной переменной для помощи TypeScript
            const handler = capturedOnOpenChange;
            act(() => {
                handler(true); // Вызываем локальную переменную
            });
        } else {
            throw new Error("capturedOnOpenChange was not defined in the mock");
        }
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
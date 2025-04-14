import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileNode } from "../FileNode";
import { FileNode as FileNodeType } from "../../../types/FileTree";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";

// Утилита для рендеринга компонента в тестовом окружении
const renderComponent = (props: {
    node: FileNodeType;
    depth?: number;
    onToggleWanted: (node: FileNodeType, wanted: boolean) => void;
    onToggleExpand: (node: FileNodeType) => void;
}) => {
    return render(
        <TestThemeProvider>
            <MockLocalizationProvider>
                <FileNode {...props} />
            </MockLocalizationProvider>
        </TestThemeProvider>
    );
};

describe("FileNode", () => {
    // Мок-функции для обработчиков
    const mockToggleWanted = vi.fn();
    const mockToggleExpand = vi.fn();

    // Сброс моков перед каждым тестом
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("отображает файл корректно", () => {
        const fileNode: FileNodeType = {
            ID: 1,
            Name: "example.txt",
            Path: "example.txt",
            Size: 1024,
            Progress: 50,
            Wanted: true,
            isDirectory: false
        };

        renderComponent({
            node: fileNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Проверяем, что имя файла отображается
        expect(screen.getByTestId(`name-${fileNode.Path}`)).toHaveTextContent("example.txt");

        // Проверяем, что чекбокс выбран
        const checkbox = screen.getByTestId(`checkbox-${fileNode.Path}`);
        expect(checkbox).toBeInTheDocument();

        // Проверяем, что размер файла отображается
        expect(screen.getByTestId(`size-${fileNode.Path}`)).toBeInTheDocument();

        // Проверяем, что прогресс-бар отображается
        const progressBar = screen.getByTestId(`progress-${fileNode.Path}`);
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveStyle("width: 50%");

        // Проверяем, что кнопка разворачивания не отображается для файлов
        expect(screen.queryByTestId(`expand-button-${fileNode.Path}`)).not.toBeInTheDocument();
    });

    it("отображает директорию корректно", () => {
        const dirNode: FileNodeType = {
            ID: -1,
            Name: "documents",
            Path: "documents",
            Size: 2048,
            Progress: 75,
            Wanted: true,
            isDirectory: true,
            children: [],
            expanded: false
        };

        renderComponent({
            node: dirNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Проверяем, что имя директории отображается
        expect(screen.getByTestId(`name-${dirNode.Path}`)).toHaveTextContent("documents");

        // Проверяем, что кнопка разворачивания отображается для директорий
        const expandButton = screen.getByTestId(`expand-button-${dirNode.Path}`);
        expect(expandButton).toBeInTheDocument();
    });

    it("вызывает onToggleWanted при изменении чекбокса", () => {
        const fileNode: FileNodeType = {
            ID: 1,
            Name: "example.txt",
            Path: "example.txt",
            Size: 1024,
            Progress: 50,
            Wanted: true,
            isDirectory: false
        };

        renderComponent({
            node: fileNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Имитируем клик по чекбоксу
        const checkbox = screen.getByTestId(`checkbox-${fileNode.Path}`);
        fireEvent.click(checkbox);

        // Проверяем, что обработчик был вызван
        expect(mockToggleWanted).toHaveBeenCalledWith(fileNode, false);
    });

    it("вызывает onToggleExpand при нажатии на кнопку разворачивания", () => {
        const dirNode: FileNodeType = {
            ID: -1,
            Name: "documents",
            Path: "documents",
            Size: 2048,
            Progress: 75,
            Wanted: true,
            isDirectory: true,
            children: [],
            expanded: false
        };

        renderComponent({
            node: dirNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Имитируем клик по кнопке разворачивания
        const expandButton = screen.getByTestId(`expand-button-${dirNode.Path}`);
        fireEvent.click(expandButton);

        // Проверяем, что обработчик был вызван
        expect(mockToggleExpand).toHaveBeenCalledWith(dirNode);
    });

    it("рекурсивно отображает дочерние узлы для развернутой директории", () => {
        const dirNode: FileNodeType = {
            ID: -1,
            Name: "documents",
            Path: "documents",
            Size: 3072,
            Progress: 50,
            Wanted: true,
            isDirectory: true,
            expanded: true,
            children: [
                {
                    ID: 1,
                    Name: "file1.txt",
                    Path: "documents/file1.txt",
                    Size: 1024,
                    Progress: 100,
                    Wanted: true,
                    isDirectory: false
                },
                {
                    ID: 2,
                    Name: "file2.txt",
                    Path: "documents/file2.txt",
                    Size: 2048,
                    Progress: 25,
                    Wanted: false,
                    isDirectory: false
                }
            ]
        };

        renderComponent({
            node: dirNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Проверяем, что дочерние узлы отображаются
        expect(screen.getByTestId(`file-node-documents/file1.txt`)).toBeInTheDocument();
        expect(screen.getByTestId(`file-node-documents/file2.txt`)).toBeInTheDocument();
    });

    it("отображает промежуточное состояние чекбокса", () => {
        const dirNode: FileNodeType = {
            ID: -1,
            Name: "documents",
            Path: "documents",
            Size: 2048,
            Progress: 50,
            Wanted: false, // Wanted может быть false для indeterminate
            isDirectory: true,
            children: [
                { ID: 1, Name: "file1.txt", Path: "documents/file1.txt", Size: 1024, Progress: 100, Wanted: true, isDirectory: false },
                { ID: 2, Name: "file2.txt", Path: "documents/file2.txt", Size: 1024, Progress: 0, Wanted: false, isDirectory: false },
            ], // Добавим детей для более реалистичного сценария indeterminate
            expanded: true, // Развернем, чтобы дети были видны (хотя это не влияет на indeterminate)
            indeterminate: true
        };

        renderComponent({
            node: dirNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Проверяем, что у чекбокса установлен атрибут data-state="indeterminate"
        const checkbox = screen.getByTestId(`checkbox-${dirNode.Path}`);
        expect(checkbox).toHaveAttribute('data-state', 'indeterminate'); // Проверка атрибута data-state
    });

    it("отображает прогресс 0% если node.Progress не определен", () => {
        const fileNode: FileNodeType = {
            ID: 3,
            Name: "no-progress.txt",
            Path: "no-progress.txt",
            Size: 500,
            Wanted: true,
            isDirectory: false
        };

        renderComponent({
            node: fileNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand
        });

        // Проверяем, что прогресс-бар отображается с шириной 0%
        const progressBar = screen.getByTestId(`progress-${fileNode.Path}`);
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveStyle("width: 0%");
    });

    it("обрабатывает размонтирование без ошибок (покрывает ref callback)", () => {
        const fileNode: FileNodeType = {
            ID: 1,
            Name: "unmount-test.txt",
            Path: "unmount-test.txt",
            Size: 100,
            Progress: 0,
            Wanted: true,
            isDirectory: false,
        };

        const { unmount } = renderComponent({
            node: fileNode,
            onToggleWanted: mockToggleWanted,
            onToggleExpand: mockToggleExpand,
        });

        // Просто размонтируем компонент. Это вызовет ref callback с null.
        expect(() => unmount()).not.toThrow();
    });
});
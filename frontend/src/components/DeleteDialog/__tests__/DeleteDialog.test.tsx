import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteDialog } from "../DeleteDialog";
import { MockLocalizationProvider } from "../../../test/mocks/localization-context-mock";
import { TestThemeProvider } from "../../../test/mocks/theme-mock";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Мокируем хук useLogger
vi.mock("../../../hooks/useLogger", () => ({
  useLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Создаем моки для Radix UI компонентов
const mockOnOpenChange = vi.fn();

// Мокируем Radix UI компоненты
vi.mock("@radix-ui/themes", async (importOriginal) => {
  // Используем importOriginal для получения реальных компонентов, если они нужны
  const actual = await importOriginal<typeof import("@radix-ui/themes")>();
  return {
    ...actual, // Сохраняем остальные реальные компоненты, если они не мокируются ниже
    Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="radix-portal-mock">{children}</div>, // <--- Добавляем мок для Portal
    Dialog: {
      Root: ({ children, open, onOpenChange }: {
        children: React.ReactNode;
        open: boolean;
        onOpenChange?: (isOpen: boolean) => void;
      }) => {
        if (onOpenChange) {
          mockOnOpenChange.mockImplementation(onOpenChange);
        }
        return (
          <div data-testid="dialog-root" data-open={open}>
            {open ? children : null}
          </div>
        );
      },
      Content: ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
        <div data-testid="dialog-content" {...props}>{children}</div>
      ),
      Title: ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
        <div data-testid="dialog-title" {...props}>{children}</div>
      ),
    },
    Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void;[key: string]: any }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    Text: ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
      <span {...props}>{children}</span>
    ),
    Flex: ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
      <div {...props}>{children}</div>
    ),
    Box: ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
      <div {...props}>{children}</div>
    ),
    Checkbox: ({ checked, onCheckedChange, ...props }: {
      checked?: boolean;
      onCheckedChange?: (checked: boolean) => void;
      [key: string]: any
    }) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          if (onCheckedChange) {
            onCheckedChange(e.target.checked);
          }
        }}
        data-testid={props["data-testid"]}
      />
    ),
  };
});

describe("DeleteDialog Component", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = (props: Partial<React.ComponentProps<typeof DeleteDialog>> = {}) => {
    return render(
      <TestThemeProvider>
        <MockLocalizationProvider>
          <DeleteDialog
            mode="single"
            open={true}
            onConfirm={mockOnConfirm}
            onCancel={mockOnCancel}
            {...props}
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );
  };

  it("отображает лоадер при загрузке локализации", () => {
    render(
      <TestThemeProvider>
        <MockLocalizationProvider isLoading={true}>
          <DeleteDialog
            mode="single"
            open={true}
            onConfirm={mockOnConfirm}
            onCancel={mockOnCancel}
          />
        </MockLocalizationProvider>
      </TestThemeProvider>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("отображает диалог в режиме single с именем торрента", () => {
    renderDialog({ mode: "single", torrentName: "test.torrent" });

    expect(screen.getByTestId("delete-dialog-title")).toHaveTextContent("remove.title");
    expect(screen.getByTestId("delete-dialog-torrent-name")).toHaveTextContent("remove.message");
    // Проверяем, что элемент с текстом remove.confirmation отсутствует
    expect(screen.queryByText("remove.confirmation")).toBeNull();
  });

  it("отображает диалог в режиме bulk с количеством торрентов", () => {
    renderDialog({ mode: "bulk", count: 5 });

    expect(screen.getByTestId("delete-dialog-title")).toHaveTextContent("remove.title");
    expect(screen.getByTestId("delete-dialog-confirmation")).toHaveTextContent("remove.selectedConfirmation");
    expect(screen.getByTestId("delete-dialog-count")).toHaveTextContent("remove.selectedCount");
  });

  it("вызывает onCancel при нажатии на кнопку отмены", () => {
    renderDialog();

    fireEvent.click(screen.getByTestId("delete-dialog-cancel"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("вызывает onConfirm при нажатии на кнопку подтверждения", () => {
    renderDialog();

    // Нажимаем на кнопку подтверждения
    fireEvent.click(screen.getByTestId("delete-dialog-confirm"));

    // Проверяем, что onConfirm был вызван
    expect(mockOnConfirm).toHaveBeenCalled();
    // По умолчанию deleteData должен быть false
    expect(mockOnConfirm).toHaveBeenCalledWith(false);
  });

  it("вызывает onConfirm с значением true когда чекбокс отмечен", () => {
    renderDialog();

    // Отмечаем чекбокс
    fireEvent.click(screen.getByTestId("delete-dialog-checkbox"));

    // Нажимаем на кнопку подтверждения
    fireEvent.click(screen.getByTestId("delete-dialog-confirm"));

    // Проверяем, что onConfirm был вызван с true
    expect(mockOnConfirm).toHaveBeenCalledWith(true);
  });

  it("вызывает onCancel при закрытии диалога через onOpenChange", () => {
    renderDialog();

    // Имитируем закрытие диалога
    mockOnOpenChange(false);

    // Проверяем, что onCancel был вызван
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
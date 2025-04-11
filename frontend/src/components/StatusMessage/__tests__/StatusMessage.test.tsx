import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import styles from "../StatusMessage.module.css";

// Мокируем компоненты Radix UI для упрощения тестирования
vi.mock("@radix-ui/themes", () => {
  return {
    Box: ({ className, style, children, ...props }: any) => (
      <div
        className={className}
        style={style}
        data-testid="status-box-container"
        {...props}
      >
        {children}
      </div>
    ),
    Flex: ({ className, children, ...props }: any) => (
      <div className={className} data-testid="flex-container" {...props}>
        {children}
      </div>
    ),
    Text: ({ className, children, style, ...props }: any) => (
      <span
        className={className}
        data-testid="status-message-text"
        data-color={props.color}
        style={style}
        {...props}
      >
        {children}
      </span>
    ),
  };
});

// Мокируем иконки Radix UI
vi.mock("@radix-ui/react-icons", () => {
  return {
    CheckCircledIcon: (props: any) => (
      <svg data-testid="check-icon" {...props} />
    ),
    CrossCircledIcon: (props: any) => (
      <svg data-testid="cross-icon" {...props} />
    ),
    InfoCircledIcon: (props: any) => <svg data-testid="info-icon" {...props} />,
  };
});

import StatusMessage from "../StatusMessage";

describe("StatusMessage", () => {
  it("отображает сообщение об успехе корректно", () => {
    const message = "Операция успешно выполнена";
    render(<StatusMessage status="success" message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toHaveClass(styles.success);
  });

  it("отображает сообщение об ошибке корректно", () => {
    const message = "Произошла ошибка";
    render(<StatusMessage status="error" message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByTestId("cross-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cross-icon")).toHaveClass(styles.error);
  });

  it("отображает информационное сообщение корректно", () => {
    const message = "Информационное сообщение";
    render(<StatusMessage status="info" message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    expect(screen.getByTestId("info-icon")).toHaveClass(styles.info);
  });

  it("возвращает пустой блок с фиксированной высотой при статусе none", () => {
    const height = "30px";
    render(<StatusMessage status="none" message="" height={height} />);

    const emptyBox = screen.getByTestId("status-box-container");
    expect(emptyBox).toHaveStyle(`height: ${height}`);
  });

  it("возвращает null при статусе none и fixedHeight=false", () => {
    const { container } = render(
      <StatusMessage status="none" message="" fixedHeight={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("применяет класс анимации когда animated=true", () => {
    render(
      <StatusMessage
        status="success"
        message="Сообщение с анимацией"
        animated={true}
      />
    );

    const boxContainer = screen.getByTestId("status-box-container");
    expect(boxContainer).toHaveClass(styles.statusContainer);

    const flexContainer = screen.getByTestId("flex-container");
    expect(flexContainer).toHaveClass(styles.messageContainer);
    expect(flexContainer).toHaveClass(styles.animated);
  });

  it("не применяет класс анимации когда animated=false", () => {
    render(
      <StatusMessage
        status="success"
        message="Сообщение без анимации"
        animated={false}
      />
    );

    const boxContainer = screen.getByTestId("status-box-container");
    expect(boxContainer).toHaveClass(styles.statusContainer);

    const flexContainer = screen.getByTestId("flex-container");
    expect(flexContainer).toHaveClass(styles.messageContainer);
    expect(flexContainer).not.toHaveClass(styles.animated);
  });

  it("применяет пользовательскую высоту", () => {
    const height = "40px";
    render(<StatusMessage status="info" message="Test" height={height} />);

    const messageContainer = screen.getByTestId("status-box-container");
    expect(messageContainer).toHaveStyle(`height: ${height}`);
  });

  it("устанавливает высоту по умолчанию 60px", () => {
    render(<StatusMessage status="info" message="Test" />);

    const messageContainer = screen.getByTestId("status-box-container");
    expect(messageContainer).toHaveStyle("height: 60px");
  });

  it("применяет настройку maxLines корректно", () => {
    render(<StatusMessage status="info" message="Test" maxLines={1} />);

    const messageText = screen.getByTestId("status-message-text");
    expect(messageText).toHaveStyle("line-clamp: 1");
    expect(messageText).toHaveStyle("-webkit-line-clamp: 1");
  });

  it("использует значение maxLines=2 по умолчанию", () => {
    render(<StatusMessage status="info" message="Test" />);

    const messageText = screen.getByTestId("status-message-text");
    expect(messageText).toHaveStyle("line-clamp: 2");
    expect(messageText).toHaveStyle("-webkit-line-clamp: 2");
  });

  it("устанавливает правильный цвет текста в зависимости от статуса", () => {
    const { rerender } = render(
      <StatusMessage status="success" message="Success message" />
    );
    let textElement = screen.getByText("Success message");
    expect(textElement).toHaveAttribute("data-color", "green");

    rerender(<StatusMessage status="error" message="Error message" />);
    textElement = screen.getByText("Error message");
    expect(textElement).toHaveAttribute("data-color", "red");

    rerender(<StatusMessage status="info" message="Info message" />);
    textElement = screen.getByText("Info message");
    expect(textElement).toHaveAttribute("data-color", "blue");
  });

  it("рендерится без фиксированной высоты когда fixedHeight=false", () => {
    render(<StatusMessage status="info" message="Test" fixedHeight={false} />);

    const messageContainer = screen.getByTestId("status-box-container");
    expect(messageContainer).not.toHaveStyle("height: 60px");
  });

  it("устанавливает правильные ARIA атрибуты для успешного статуса", () => {
    render(<StatusMessage status="success" message="Тест" />);

    const container = screen.getByTestId("status-box-container");
    expect(container).toHaveAttribute("role", "status");
    expect(container).toHaveAttribute("aria-live", "polite");
  });

  it("устанавливает правильные ARIA атрибуты для статуса ошибки", () => {
    render(<StatusMessage status="error" message="Тест" />);

    const container = screen.getByTestId("status-box-container");
    expect(container).toHaveAttribute("role", "alert");
    expect(container).toHaveAttribute("aria-live", "assertive");
  });

  it("устанавливает правильный aria-label для сообщения", () => {
    render(<StatusMessage status="success" message="Тест" />);

    const message = screen.getByTestId("status-message-text");
    expect(message).toHaveAttribute("aria-label", "Успешно: Тест");
  });

  it("устанавливает aria-hidden для иконок", () => {
    render(<StatusMessage status="success" message="Тест" />);

    const icon = screen.getByTestId("check-icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Мок для CSS модуля уже определен в setup-tests.ts
// Нам нужно импортировать его здесь для явного доступа к классам
import styles from "../../styles/StatusMessage.module.css";

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

// Импортируем реальный компонент StatusMessage
import StatusMessage from "../../components/StatusMessage";

describe("StatusMessage", () => {
  it("renders success message correctly", () => {
    const message = "Операция успешно выполнена";
    render(<StatusMessage status="success" message={message} />);

    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();

    // Проверяем наличие иконки успеха
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toHaveClass(styles.success);
  });

  it("renders error message correctly", () => {
    const message = "Произошла ошибка";
    render(<StatusMessage status="error" message={message} />);

    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();

    // Проверяем иконку ошибки
    expect(screen.getByTestId("cross-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cross-icon")).toHaveClass(styles.error);
  });

  it("renders info message correctly", () => {
    const message = "Информационное сообщение";
    render(<StatusMessage status="info" message={message} />);

    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();

    // Проверяем иконку информации
    expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    expect(screen.getByTestId("info-icon")).toHaveClass(styles.info);
  });

  it("returns empty box with fixed height when status is none", () => {
    const height = "30px";
    render(<StatusMessage status="none" message="" height={height} />);

    // Проверяем наличие пустого блока с заданной высотой, используя data-testid
    const emptyBox = screen.getByTestId("status-box-container");
    expect(emptyBox).toHaveStyle(`height: ${height}`);
  });

  it("returns null when status is none and fixedHeight is false", () => {
    const { container } = render(
      <StatusMessage status="none" message="" fixedHeight={false} />
    );

    // Проверяем что ничего не отрендерилось
    expect(container.firstChild).toBeNull();
  });

  it("applies animation class when animated is true", () => {
    render(
      <StatusMessage
        status="success"
        message="Сообщение с анимацией"
        animated={true}
      />
    );

    // Проверяем Box контейнер
    const boxContainer = screen.getByTestId("status-box-container");
    expect(boxContainer).toHaveClass(styles.statusContainer);

    // Проверяем Flex контейнер и его классы
    const flexContainer = screen.getByTestId("flex-container");
    expect(flexContainer).toHaveClass(styles.messageContainer);
    expect(flexContainer).toHaveClass(styles.animated);
  });

  it("does not apply animation class when animated is false", () => {
    render(
      <StatusMessage
        status="success"
        message="Сообщение без анимации"
        animated={false}
      />
    );

    // Проверяем Box контейнер
    const boxContainer = screen.getByTestId("status-box-container");
    expect(boxContainer).toHaveClass(styles.statusContainer);

    // Проверяем Flex контейнер и его классы
    const flexContainer = screen.getByTestId("flex-container");
    expect(flexContainer).toHaveClass(styles.messageContainer);
    expect(flexContainer).not.toHaveClass(styles.animated);
  });

  it("applies custom height when provided", () => {
    const height = "40px";
    render(<StatusMessage status="info" message="Test" height={height} />);

    // Используем специфичный data-testid вместо container.firstChild
    const messageContainer = screen.getByTestId("status-box-container");
    expect(messageContainer).toHaveStyle(`height: ${height}`);
  });

  it("sets default height of 60px if not specified", () => {
    render(<StatusMessage status="info" message="Test" />);

    // Используем специфичный data-testid вместо container.firstChild
    const messageContainer = screen.getByTestId("status-box-container");
    expect(messageContainer).toHaveStyle("height: 60px");
  });

  it("applies maxLines setting correctly", () => {
    render(<StatusMessage status="info" message="Test" maxLines={1} />);

    // Используем единый надежный селектор с data-testid
    const messageText = screen.getByTestId("status-message-text");

    // Проверяем стиль для ограничения строк
    expect(messageText).toHaveStyle("line-clamp: 1");
    expect(messageText).toHaveStyle("-webkit-line-clamp: 1");
  });

  it("uses default maxLines value of 2", () => {
    render(<StatusMessage status="info" message="Test" />);

    // Используем единый надежный селектор с data-testid
    const messageText = screen.getByTestId("status-message-text");

    // Проверяем стиль для ограничения строк
    expect(messageText).toHaveStyle("line-clamp: 2");
    expect(messageText).toHaveStyle("-webkit-line-clamp: 2");
  });

  it("sets correct text color based on status", () => {
    // success
    const { rerender } = render(
      <StatusMessage status="success" message="Success message" />
    );
    let textElement = screen.getByText("Success message");
    expect(textElement).toHaveAttribute("data-color", "green");

    // error
    rerender(<StatusMessage status="error" message="Error message" />);
    textElement = screen.getByText("Error message");
    expect(textElement).toHaveAttribute("data-color", "red");

    // info
    rerender(<StatusMessage status="info" message="Info message" />);
    textElement = screen.getByText("Info message");
    expect(textElement).toHaveAttribute("data-color", "blue");
  });

  it("renders without fixed height when fixedHeight is false", () => {
    render(<StatusMessage status="info" message="Test" fixedHeight={false} />);

    const messageContainer = screen.getByTestId("status-box-container");
    expect(messageContainer).not.toHaveStyle("height: 60px");
  });
});

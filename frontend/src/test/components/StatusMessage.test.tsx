import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Мокируем CSS модуль
vi.mock("../../styles/StatusMessage.module.css", () => {
  return {
    default: {
      statusContainer: "statusContainer-mock",
      messageContainer: "messageContainer-mock",
      animated: "animated-mock",
      success: "success-mock",
      error: "error-mock",
      info: "info-mock",
      expandableMessage: "expandableMessage-mock",
    },
  };
});

// Мокируем компоненты Radix UI для упрощения тестирования
vi.mock("@radix-ui/themes", () => {
  return {
    Box: (props: any) => <div {...props} />,
    Flex: (props: any) => <div {...props} />,
    Text: (props: any) => <span {...props} data-color={props.color} />,
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
import StatusMessage, { StatusType } from "../../components/StatusMessage";

describe("StatusMessage", () => {
  it("renders success message correctly", () => {
    const message = "Операция успешно выполнена";
    const { container } = render(
      <StatusMessage status="success" message={message} />
    );

    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();

    // Проверяем наличие иконки успеха
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toHaveClass("success-mock");
  });

  it("renders error message correctly", () => {
    const message = "Произошла ошибка";
    const { container } = render(
      <StatusMessage status="error" message={message} />
    );

    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();

    // Проверяем иконку ошибки
    expect(screen.getByTestId("cross-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cross-icon")).toHaveClass("error-mock");
  });

  it("renders info message correctly", () => {
    const message = "Информационное сообщение";
    const { container } = render(
      <StatusMessage status="info" message={message} />
    );

    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();

    // Проверяем иконку информации
    expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    expect(screen.getByTestId("info-icon")).toHaveClass("info-mock");
  });

  it("returns empty box with fixed height when status is none", () => {
    const height = "30px";
    const { container } = render(
      <StatusMessage status="none" message="" height={height} />
    );

    // Проверяем наличие пустого блока с заданной высотой
    const emptyBox = container.firstChild as HTMLElement;
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
    const { container } = render(
      <StatusMessage
        status="success"
        message="Сообщение с анимацией"
        animated={true}
      />
    );

    // Проверяем наличие класса анимации в контейнере сообщения
    const messageContainer = container.querySelector(".messageContainer-mock");
    expect(messageContainer).toHaveClass("animated-mock");
  });

  it("does not apply animation class when animated is false", () => {
    const { container } = render(
      <StatusMessage
        status="success"
        message="Сообщение без анимации"
        animated={false}
      />
    );

    // Проверяем отсутствие класса анимации
    const messageContainer = container.querySelector(".messageContainer-mock");
    expect(messageContainer).not.toHaveClass("animated-mock");
  });

  it("applies custom height when provided", () => {
    const customHeight = "100px";
    const { container } = render(
      <StatusMessage
        status="info"
        message="Сообщение с настраиваемой высотой"
        height={customHeight}
      />
    );

    // Проверяем применение пользовательской высоты к корневому контейнеру
    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer).toHaveStyle(`height: ${customHeight}`);
  });

  it("sets default height of 60px if not specified", () => {
    const { container } = render(
      <StatusMessage status="info" message="Сообщение" />
    );

    // Проверяем высоту по умолчанию
    const statusContainer = container.firstChild as HTMLElement;
    expect(statusContainer).toHaveStyle("height: 60px");
  });

  it("applies maxLines setting correctly", () => {
    const message = "Длинное информационное сообщение";
    const { container } = render(
      <StatusMessage status="info" message={message} maxLines={1} />
    );

    // Находим текстовый элемент по тексту
    const textElement = screen.getByText(message);

    // Проверяем ограничение строк
    expect(textElement).toHaveStyle("line-clamp: 1");
    expect(textElement).toHaveStyle("-webkit-line-clamp: 1");
  });

  it("uses default maxLines value of 2", () => {
    const message = "Информационное сообщение";
    const { container } = render(
      <StatusMessage status="info" message={message} />
    );

    // Находим текстовый элемент по тексту
    const textElement = screen.getByText(message);

    // Проверяем значение по умолчанию
    expect(textElement).toHaveStyle("line-clamp: 2");
    expect(textElement).toHaveStyle("-webkit-line-clamp: 2");
  });

  it("sets correct text color based on status", () => {
    // Проверяем успех - зеленый
    const { rerender } = render(
      <StatusMessage status="success" message="Успех" />
    );
    expect(screen.getByText("Успех")).toHaveAttribute("data-color", "green");

    // Проверяем ошибку - красный
    rerender(<StatusMessage status="error" message="Ошибка" />);
    expect(screen.getByText("Ошибка")).toHaveAttribute("data-color", "red");

    // Проверяем info - синий
    rerender(<StatusMessage status="info" message="Информация" />);
    expect(screen.getByText("Информация")).toHaveAttribute(
      "data-color",
      "blue"
    );
  });

  it("renders without fixed height when fixedHeight is false", () => {
    const message = "Сообщение без фиксированной высоты";
    const { container } = render(
      <StatusMessage status="info" message={message} fixedHeight={false} />
    );

    // Проверяем, что у корневого контейнера отсутствует класс statusContainer
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).not.toHaveClass("statusContainer-mock");

    // Проверяем, что у корневого контейнера не установлен атрибут style с height
    expect(rootElement).not.toHaveStyle("height: 60px");

    // Проверяем, что сообщение отображается
    expect(screen.getByText(message)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Отключаем мок, чтобы использовать реальный компонент
// vi.unmock('../../components/LoadingSpinner');
import { LoadingSpinner } from "../../components/LoadingSpinner";

describe("LoadingSpinner", () => {
  beforeEach(() => {
    // Проверяем, есть ли уже стили с id spin-keyframes в DOM
    const existingStyle = document.getElementById("spin-keyframes");
    if (existingStyle && existingStyle.parentNode) {
      existingStyle.parentNode.removeChild(existingStyle);
    }

    // Очищаем все моки перед каждым тестом
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default medium size", () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector("svg");

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("24px");
    expect(svg?.getAttribute("height")).toBe("24px");
  });

  it("renders with small size when specified", () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const svg = container.querySelector("svg");

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("16px");
    expect(svg?.getAttribute("height")).toBe("16px");
  });

  it("renders with large size when specified", () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const svg = container.querySelector("svg");

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("32px");
    expect(svg?.getAttribute("height")).toBe("32px");
  });

  it("applies className when provided", () => {
    const testClass = "test-spinner-class";
    const { container } = render(<LoadingSpinner className={testClass} />);

    // Проверяем наличие класса на корневом элементе
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass(testClass);
  });

  it("verifies animation styles in the component", () => {
    // Проверяем, что есть код анимации в DOM
    const { container } = render(<LoadingSpinner />);

    // Проверяем, что svg имеет стиль анимации
    const svg = container.querySelector("svg");
    expect(svg?.style.animation).toBe("spin 1s linear infinite");

    // Проверяем, что getSize работает корректно при рендере
    expect(svg?.getAttribute("width")).toBe("24px");

    // В этом тесте мы не проверяем сам DOM-элемент с анимацией,
    // но важен факт, что svg имеет анимацию, которая должна быть определена где-то
  });

  it("does not create duplicate animation styles", () => {
    // Сначала добавляем элемент стилей
    const styleElement = document.createElement("style");
    styleElement.id = "spin-keyframes";
    styleElement.textContent = "@keyframes spin { /* content */ }";
    document.head.appendChild(styleElement);

    // Шпионим за appendChild для проверки
    const appendChildSpy = vi.spyOn(document.head, "appendChild");

    // Рендерим компонент
    render(<LoadingSpinner />);

    // Проверяем, что повторно стили не добавились
    expect(appendChildSpy).not.toHaveBeenCalled();
  });

  it("applies animation style to the icon", () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector("svg");

    // Проверяем стиль анимации
    expect(svg?.style.animation).toBe("spin 1s linear infinite");
  });
});

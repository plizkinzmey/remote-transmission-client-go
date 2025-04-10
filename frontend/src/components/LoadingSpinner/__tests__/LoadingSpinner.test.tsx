import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";
import styles from "../LoadingSpinner.module.css";

describe("LoadingSpinner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("отображает спиннер со средним размером по умолчанию", () => {
    render(<LoadingSpinner />);
    const svg = screen.getByTestId("loading-spinner-svg");
    
    expect(svg).toHaveClass(styles.medium);
    expect(svg).toHaveClass(styles.spinnerSvg);
  });

  it("отображает спиннер с маленьким размером", () => {
    render(<LoadingSpinner size="small" />);
    const svg = screen.getByTestId("loading-spinner-svg");
    
    expect(svg).toHaveClass(styles.small);
    expect(svg).toHaveClass(styles.spinnerSvg);
  });

  it("отображает спиннер с большим размером", () => {
    render(<LoadingSpinner size="large" />);
    const svg = screen.getByTestId("loading-spinner-svg");
    
    expect(svg).toHaveClass(styles.large);
    expect(svg).toHaveClass(styles.spinnerSvg);
  });

  it("применяет переданный className", () => {
    const testClass = "test-spinner-class";
    render(<LoadingSpinner className={testClass} />);
    
    const container = screen.getByTestId("loading-spinner");
    expect(container).toHaveClass(testClass);
  });

  it("имеет правильные стили и анимацию", () => {
    render(<LoadingSpinner />);
    
    const container = screen.getByTestId("loading-spinner");
    const svg = screen.getByTestId("loading-spinner-svg");
    
    expect(container).toHaveClass(styles.spinner);
    expect(svg).toHaveClass(styles.spinnerSvg);
  });
});
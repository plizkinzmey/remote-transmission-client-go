import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoadingSpinner } from "../../components/LoadingSpinner";

describe("LoadingSpinner component", () => {
  it("должен корректно рендериться с размером по умолчанию", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("spinner");
    expect(spinner).not.toHaveClass("small");
    expect(spinner).not.toHaveClass("large");
  });

  it("должен корректно рендериться с маленьким размером", () => {
    render(<LoadingSpinner size="small" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("small");
  });

  it("должен корректно рендериться с большим размером", () => {
    render(<LoadingSpinner size="large" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("large");
  });

  it("должен принимать дополнительный className", () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("custom-class");
  });
});

import { describe, it, expect, vi, Mock } from "vitest";
import { themeCleanup } from "../themeCleanup";

describe("ThemeContext cleanup catch coverage", () => {
  it("covers catch block for removeEventListener", () => {
    const errorSpy = vi.spyOn(console, "error");
    const cleanupError = new Error("removeEventListener cleanup error");
    const handleSystemThemeChange = () => {};
    const mediaQuery = {
      removeEventListener: vi.fn(() => {
        throw cleanupError;
      }) as Mock,
      removeListener: undefined as undefined | Mock,
    };

    themeCleanup(mediaQuery, handleSystemThemeChange);

    expect(mediaQuery.removeEventListener).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error removing theme change listener:",
      cleanupError
    );
    errorSpy.mockRestore();
  });

  it("covers catch block for removeListener", () => {
    const errorSpy = vi.spyOn(console, "error");
    const cleanupError = new Error("removeListener cleanup error");
    const handleSystemThemeChange = () => {};
    const mediaQuery = {
      removeEventListener: undefined as undefined | Mock,
      removeListener: vi.fn(() => {
        throw cleanupError;
      }) as Mock,
    };

    themeCleanup(mediaQuery, handleSystemThemeChange);

    expect(mediaQuery.removeListener).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error removing theme change listener:",
      cleanupError
    );
    errorSpy.mockRestore();
  });
});

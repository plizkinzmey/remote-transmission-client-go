import { describe, it, expect } from "vitest";
import { formatFileSize } from "../formatFileSize";

describe("formatFileSize", () => {
  it("форматирует размер в байтах", () => {
    expect(formatFileSize(100)).toBe("100.00 B");
  });

  it("форматирует размер в килобайтах", () => {
    expect(formatFileSize(2048)).toBe("2.00 KiB");
  });

  it("форматирует размер в мегабайтах", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MiB");
  });

  it("форматирует размер в гигабайтах", () => {
    expect(formatFileSize(3 * 1024 * 1024 * 1024)).toBe("3.00 GiB");
  });

  it("форматирует размер в терабайтах", () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024 * 1024)).toBe("2.00 TiB");
  });

  it("корректно обрабатывает undefined", () => {
    expect(formatFileSize(undefined)).toBe("0.00 B");
  });

  it("корректно обрабатывает отрицательные значения", () => {
    expect(formatFileSize(-100)).toBe("0.00 B");
  });

  it("корректно обрабатывает 0", () => {
    expect(formatFileSize(0)).toBe("0.00 B");
  });
});

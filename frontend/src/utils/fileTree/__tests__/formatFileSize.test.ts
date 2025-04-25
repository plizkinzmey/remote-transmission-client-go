import { describe, it, expect } from "vitest";
import { formatFileSize } from "../formatFileSize";

describe("formatFileSize", () => {
  it("should return 0.00 B for undefined input", () => {
    expect(formatFileSize(undefined)).toBe("0.00 B");
  });

  it("should return 0.00 B for null input", () => {
    // @ts-expect-error testing invalid input
    expect(formatFileSize(null)).toBe("0.00 B");
  });

  it("should return 0.00 B for zero input", () => {
    expect(formatFileSize(0)).toBe("0.00 B");
  });

  it("should return 0.00 B for negative input", () => {
    expect(formatFileSize(-100)).toBe("0.00 B");
  });

  it("should format bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500.00 B");
  });

  it("should format KiB correctly", () => {
    expect(formatFileSize(1024)).toBe("1.00 KiB");
    expect(formatFileSize(1536)).toBe("1.50 KiB");
  });

  it("should format MiB correctly", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.00 MiB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.50 MiB");
  });

  it("should format GiB correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.00 GiB");
    expect(formatFileSize(2.75 * 1024 * 1024 * 1024)).toBe("2.75 GiB");
  });

  it("should format TiB correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe("1.00 TiB");
    expect(formatFileSize(3 * 1024 * 1024 * 1024 * 1024)).toBe("3.00 TiB");
  });

  it("should handle large numbers close to unit boundaries", () => {
    expect(formatFileSize(1023)).toBe("1023.00 B");
    expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.00 KiB"); // Note: rounds up due to division
    expect(formatFileSize(1024 * 1024 * 1024 - 1)).toBe("1024.00 MiB");
  });
});

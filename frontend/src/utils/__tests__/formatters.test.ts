import { describe, it, expect } from "vitest";
import {
  formatSize,
  formatSpeed,
  formatRatio,
  normalizeValue,
  // Импортируем старые функции для проверки @deprecated
  formatFileSize,
  formatStorageSize,
  formatSpeed_deprecated, // Используем новое имя
  formatTransferSpeed,
} from "../formatters";

describe("normalizeValue", () => {
  it("должен возвращать 0 для undefined", () => {
    expect(normalizeValue(undefined)).toBe(0);
  });

  it("должен возвращать 0 для null", () => {
    expect(normalizeValue(null)).toBe(0);
  });

  it("должен возвращать 0 для NaN", () => {
    expect(normalizeValue(NaN)).toBe(0);
  });

  it("должен возвращать 0 для отрицательных чисел", () => {
    expect(normalizeValue(-100)).toBe(0);
    expect(normalizeValue(-0.5)).toBe(0);
  });

  it("должен возвращать 0 для нуля", () => {
    expect(normalizeValue(0)).toBe(0);
  });

  it("должен возвращать то же значение для положительных чисел", () => {
    expect(normalizeValue(100)).toBe(100);
    expect(normalizeValue(0.5)).toBe(0.5);
    expect(normalizeValue(12345.67)).toBe(12345.67);
  });
});

describe("formatRatio", () => {
  it("должен возвращать '0.00' для undefined", () => {
    expect(formatRatio(undefined)).toBe("0.00");
  });

  it("должен возвращать '0.00' для null", () => {
    expect(formatRatio(null)).toBe("0.00");
  });

  it("должен возвращать '0.00' для NaN", () => {
    expect(formatRatio(NaN)).toBe("0.00");
  });

  it("должен возвращать '0.00' для отрицательных чисел", () => {
    expect(formatRatio(-10)).toBe("0.00");
    expect(formatRatio(-0.1)).toBe("0.00");
  });

  it("должен возвращать '0.00' для нуля", () => {
    expect(formatRatio(0)).toBe("0.00");
  });

  it("должен форматировать положительные числа до двух знаков после запятой", () => {
    expect(formatRatio(1)).toBe("1.00");
    expect(formatRatio(0.5)).toBe("0.50");
    expect(formatRatio(1.23)).toBe("1.23");
    expect(formatRatio(1.234)).toBe("1.23");
    expect(formatRatio(1.239)).toBe("1.24"); // Проверка округления
    expect(formatRatio(12345.678)).toBe("12345.68");
  });
});

describe("formatSize", () => {
  it("должен возвращать '0.00 B' для undefined, null, NaN и отрицательных чисел", () => {
    expect(formatSize(undefined)).toBe("0.00 B");
    expect(formatSize(null)).toBe("0.00 B");
    expect(formatSize(NaN)).toBe("0.00 B");
    expect(formatSize(-100)).toBe("0.00 B");
  });

  it("должен возвращать '0.00 B' для нуля", () => {
    expect(formatSize(0)).toBe("0.00 B");
  });

  it("должен форматировать байты (B)", () => {
    expect(formatSize(1)).toBe("1.00 B");
    expect(formatSize(500)).toBe("500.00 B");
    expect(formatSize(1023)).toBe("1023.00 B");
  });

  it("должен форматировать килобайты (KB)", () => {
    expect(formatSize(1024)).toBe("1.00 KB");
    expect(formatSize(1536)).toBe("1.50 KB"); // 1.5 * 1024
    expect(formatSize(1024 * 1023.9)).toBe("1023.90 KB");
    expect(formatSize(1024 * 1024 - 1)).toBe("1024.00 KB"); // Округление до 1024.00 KB, т.к. < 1 MB
  });

  it("должен форматировать мегабайты (MB)", () => {
    const MB = 1024 * 1024;
    expect(formatSize(MB)).toBe("1.00 MB");
    expect(formatSize(MB * 1.5)).toBe("1.50 MB");
    expect(formatSize(MB * 1023.9)).toBe("1023.90 MB");
    expect(formatSize(MB * 1024 - 1)).toBe("1024.00 MB"); // Округление до 1024.00 MB
  });

  it("должен форматировать гигабайты (GB)", () => {
    const GB = 1024 * 1024 * 1024;
    expect(formatSize(GB)).toBe("1.00 GB");
    expect(formatSize(GB * 2.75)).toBe("2.75 GB");
  });

  it("должен форматировать терабайты (TB)", () => {
    const TB = 1024 * 1024 * 1024 * 1024;
    expect(formatSize(TB)).toBe("1.00 TB");
    expect(formatSize(TB * 5.1)).toBe("5.10 TB");
  });

  it("должен форматировать петабайты (PB)", () => {
    const PB = 1024 * 1024 * 1024 * 1024 * 1024;
    expect(formatSize(PB)).toBe("1.00 PB");
  });

  it("должен форматировать эксабайты (EB)", () => {
    const EB = 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
    expect(formatSize(EB)).toBe("1.00 EB");
    // Проверка максимальной единицы
    expect(formatSize(EB * 1.5)).toBe("1.50 EB");
  });
});

describe("formatSpeed", () => {
  it("должен возвращать '0.00 B/s' для undefined, null, NaN и отрицательных чисел", () => {
    expect(formatSpeed(undefined)).toBe("0.00 B/s");
    expect(formatSpeed(null)).toBe("0.00 B/s");
    expect(formatSpeed(NaN)).toBe("0.00 B/s");
    expect(formatSpeed(-100)).toBe("0.00 B/s");
  });

  it("должен возвращать '0.00 B/s' для нуля", () => {
    expect(formatSpeed(0)).toBe("0.00 B/s");
  });

  it("должен форматировать байты в секунду (B/s)", () => {
    expect(formatSpeed(1)).toBe("1.00 B/s");
    expect(formatSpeed(500)).toBe("500.00 B/s");
    expect(formatSpeed(1023)).toBe("1023.00 B/s");
  });

  it("должен форматировать килобайты в секунду (KB/s)", () => {
    expect(formatSpeed(1024)).toBe("1.00 KB/s");
    expect(formatSpeed(1536)).toBe("1.50 KB/s");
    expect(formatSpeed(1024 * 1024 - 1)).toBe("1024.00 KB/s");
  });

  it("должен форматировать мегабайты в секунду (MB/s)", () => {
    const MB = 1024 * 1024;
    expect(formatSpeed(MB)).toBe("1.00 MB/s");
    expect(formatSpeed(MB * 1.5)).toBe("1.50 MB/s");
  });

  it("должен форматировать гигабайты в секунду (GB/s)", () => {
    const GB = 1024 * 1024 * 1024;
    expect(formatSpeed(GB)).toBe("1.00 GB/s");
  });

  it("должен форматировать терабайты в секунду (TB/s)", () => {
    const TB = 1024 * 1024 * 1024 * 1024;
    expect(formatSpeed(TB)).toBe("1.00 TB/s");
  });

  it("должен форматировать петабайты в секунду (PB/s)", () => {
    const PB = 1024 * 1024 * 1024 * 1024 * 1024;
    expect(formatSpeed(PB)).toBe("1.00 PB/s");
  });

  it("должен форматировать эксабайты в секунду (EB/s)", () => {
    const EB = 1024 * 1024 * 1024 * 1024 * 1024 * 1024;
    expect(formatSpeed(EB)).toBe("1.00 EB/s");
    expect(formatSpeed(EB * 1.5)).toBe("1.50 EB/s");
  });
});

describe("Deprecated Functions (Optional Check)", () => {
  it("formatFileSize (deprecated) должен использовать KiB", () => {
    expect(formatFileSize(1024)).toBe("1.00 KiB");
    expect(formatFileSize(0)).toBe("0.00 B");
    expect(formatFileSize(-1)).toBe("0.00 B");
    expect(formatFileSize(undefined)).toBe("0.00 B"); // Проверяем undefined, но не null
  });

  it("formatStorageSize (deprecated) должен использовать KB", () => {
    expect(formatStorageSize(1024)).toBe("1.00 KB");
    expect(formatStorageSize(0)).toBe("0.00 B");
    expect(formatStorageSize(-1)).toBe("0.00 B");
    expect(formatStorageSize(undefined)).toBe("0.00 B"); // Проверяем undefined
  });

  it("formatSpeed_deprecated (deprecated) должен использовать KiB/s", () => {
    expect(formatSpeed_deprecated(1024)).toBe("1.00 KiB/s");
    expect(formatSpeed_deprecated(0)).toBe("0.00 KiB/s");
    expect(formatSpeed_deprecated(-1)).toBe("0.00 KiB/s");
    expect(formatSpeed_deprecated(undefined)).toBe("0.00 KiB/s"); // Проверяем undefined
  });

  it("formatTransferSpeed (deprecated) должен использовать KB/s", () => {
    expect(formatTransferSpeed(1024)).toBe("1.00 KB/s");
    expect(formatTransferSpeed(0)).toBe("0.00 B/s");
    expect(formatTransferSpeed(-1)).toBe("0.00 B/s");
    expect(formatTransferSpeed(undefined)).toBe("0.00 B/s"); // Проверяем undefined
  });
});

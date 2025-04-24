import { describe, it, expect } from "vitest";
import { useAppErrorHandler } from "../index"; // Импорт из index.ts
import { useAppErrorHandler as OriginalHook } from "../useAppErrorHandler"; // Импорт из файла хука

describe("useAppErrorHandler index", () => {
  it("should re-export useAppErrorHandler hook", () => {
    expect(useAppErrorHandler).toBeDefined();
    // Дополнительно проверяем, что это правильный хук
    expect(useAppErrorHandler).toBe(OriginalHook);
  });
});

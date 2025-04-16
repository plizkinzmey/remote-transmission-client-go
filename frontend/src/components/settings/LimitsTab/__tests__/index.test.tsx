import { describe, it, expect } from "vitest";
// Импортируем из index.ts
import { LimitsTab } from "../index";
// Импортируем напрямую для сравнения
import { LimitsTab as OriginalLimitsTab } from "../LimitsTab";
// Импортируем тип (проверка на уровне компиляции)
import type { LimitsTabProps as IndexProps } from "../index";
import type { LimitsTabProps as OriginalProps } from "../LimitsTab";

describe("LimitsTab index", () => {
    it("should export LimitsTab component", () => {
        expect(LimitsTab).toBeDefined();
        expect(LimitsTab).toBe(OriginalLimitsTab);
    });

    it("should export LimitsTabProps type", () => {
        // Этот тест в основном проверяет, что типы существуют и могут быть импортированы.
        // TypeScript выполнит проверку совместимости типов во время компиляции.
        const variable: IndexProps | null = null;
        const variable2: OriginalProps | null = null;
        expect(variable).toBeNull(); // Просто чтобы использовать тип
        expect(variable2).toBeNull();
        // Опционально: можно создать фиктивный объект и проверить его тип,
        // но это избыточно, так как TS уже проверяет совместимость.
    });
});

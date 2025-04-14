import { describe, it, expect } from "vitest";
import { ThemeToggle } from "../index"; // Импорт из index.ts
import { ThemeToggle as OriginalThemeToggle } from "../ThemeToggle"; // Импорт из файла компонента

describe("ThemeToggle index", () => {
    it("должен экспортировать компонент ThemeToggle", () => {
        expect(ThemeToggle).toBeDefined();
        // Дополнительно проверяем, что это действительно тот компонент
        expect(ThemeToggle).toBe(OriginalThemeToggle);
    });

    // Если ThemeToggleProps экспортируется из index.ts, можно добавить тест:
    // import type { ThemeToggleProps } from "../index";
    // it("должен экспортировать тип ThemeToggleProps", () => {
    //   const testProps: ThemeToggleProps = { /* ... */ };
    //   expect(testProps).toBeDefined();
    // });
});

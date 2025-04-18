import { describe, it, expect } from "vitest";
import { PathsTab } from "../index";
import { PathsTab as OriginalPathsTab } from "../PathsTab";
import type { PathsTabRef } from "../index";
import type { PathsTabRef as OriginalPathsTabRef } from "../PathsTab";

describe("PathsTab index exports", () => {
    it("should export PathsTab component correctly", () => {
        expect(PathsTab).toBe(OriginalPathsTab);
    });

    it("should export PathsTabRef type correctly", () => {
        // TypeScript типы существуют только во время компиляции,
        // поэтому мы проверяем только то, что они экспортированы,
        // убедившись, что код компилируется
        const typeCheck = true;
        expect(typeCheck).toBe(true);

        // Создаем функции, которые преобразуют типы друг в друга.
        // Это не будет выполняться в рантайме, но поможет проверить совместимость типов.
        type AssertType<T, Expected> = T extends Expected ? (Expected extends T ? true : false) : false;
        const assertTypesEqual: AssertType<PathsTabRef, OriginalPathsTabRef> = true;
        expect(assertTypesEqual).toBe(true);
    });
});

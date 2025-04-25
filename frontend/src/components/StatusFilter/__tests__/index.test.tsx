import { describe, it, expect } from "vitest";
import { StatusFilter } from "../index"; // Импорт из index.ts
import { StatusFilter as OriginalStatusFilter } from "../StatusFilter"; // Импорт из файла компонента
// Предполагаем, что StatusOption экспортируется для использования в StatusFilterProps
import type { StatusOption } from "../index";

describe("StatusFilter index", () => {
  it("должен экспортировать компонент StatusFilter", () => {
    expect(StatusFilter).toBeDefined();
    // Дополнительно проверяем, что это действительно тот компонент
    expect(StatusFilter).toBe(OriginalStatusFilter);
  });

  // Добавляем тест для StatusOption (если он экспортируется из index.ts)
  it("должен экспортировать тип StatusOption", () => {
    // Проверка существования типа во время компиляции
    const testOption: StatusOption = { id: "downloading", label: "downloading", color: "blue" };
    expect(testOption).toBeDefined();
    expect(typeof testOption).toBe("object");
  });
});

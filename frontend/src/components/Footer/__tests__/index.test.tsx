import { describe, it, expect } from "vitest";
import { Footer } from "../index"; // Импорт из index.ts
import { Footer as OriginalFooter } from "../Footer"; // Импорт из файла компонента

describe("Footer index", () => {
  it("должен экспортировать компонент Footer", () => {
    expect(Footer).toBeDefined();
    // Дополнительно проверяем, что это действительно тот компонент
    expect(Footer).toBe(OriginalFooter);
  });
});

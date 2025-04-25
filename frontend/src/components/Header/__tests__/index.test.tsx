import { describe, it, expect } from "vitest";
import { Header } from "../index"; // Импорт из index.ts
import { Header as OriginalHeader } from "../Header"; // Импорт из файла компонента

describe("Header index", () => {
  it("должен экспортировать компонент Header", () => {
    expect(Header).toBeDefined();
    // Дополнительно проверяем, что это действительно тот компонент
    expect(Header).toBe(OriginalHeader);
  });
});

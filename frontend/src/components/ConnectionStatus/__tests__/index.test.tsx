import { describe, it, expect } from "vitest";
import { ConnectionStatus } from "../index"; // Импорт из index.ts
import { ConnectionStatus as OriginalConnectionStatus } from "../ConnectionStatus"; // Импорт из файла компонента

describe("ConnectionStatus index", () => {
  it("должен экспортировать компонент ConnectionStatus", () => {
    expect(ConnectionStatus).toBeDefined();
    // Дополнительно проверяем, что это действительно тот компонент
    expect(ConnectionStatus).toBe(OriginalConnectionStatus);
  });
});

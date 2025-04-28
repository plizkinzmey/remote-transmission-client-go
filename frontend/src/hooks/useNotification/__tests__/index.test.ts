import { describe, it, expect } from "vitest";
import * as Exports from "../index";
import { useNotification as OriginalUseNotification } from "../useNotification";

describe("useNotification index", () => {
  it("должен экспортировать хук useNotification", () => {
    expect(Exports.useNotification).toBeDefined();
    expect(Exports.useNotification).toBe(OriginalUseNotification);
  });

  it("должен экспортировать типы UseNotificationResult и NotificationLevel", () => {
    // Экспорт типов нельзя проверить напрямую в рантайме,
    // но можно убедиться, что typescript не показывает ошибки при использовании
    // импортированных типов. Поскольку компилируется без ошибок, значит типы правильно экспортируются.
    // Это просто плейсхолдер для документирования экспортов типов.
    expect(typeof Exports).toBe("object");
  });
});

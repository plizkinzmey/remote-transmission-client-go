import { describe, it, expect } from "vitest";
// Используем импорт по умолчанию для StatusMessage
import StatusMessage from "../index"; // <--- ИЗМЕНЕНО
// Типы импортируем как именованные
import type { StatusType, StatusMessageProps } from "../index";
import { StatusMessage as OriginalStatusMessage } from "../StatusMessage"; // Импорт из файла компонента

describe("StatusMessage index", () => {
    it("должен экспортировать компонент StatusMessage", () => {
        expect(StatusMessage).toBeDefined();
        // Дополнительно проверяем, что это действительно тот компонент
        expect(StatusMessage).toBe(OriginalStatusMessage);
    });

    it("должен экспортировать тип StatusType", () => {
        // Проверка существования типа во время компиляции
        const testValue: StatusType = "success";
        expect(testValue).toBeDefined();
        // Проверка на undefined в рантайме (хотя типы стираются)
        expect(typeof testValue).toBe("string");
    });

    it("должен экспортировать тип StatusMessageProps", () => {
        // Проверка существования типа во время компиляции
        const testProps: StatusMessageProps = {
            status: "info",
            message: "Test",
        };
        expect(testProps).toBeDefined();
        expect(typeof testProps).toBe("object");
    });
});
